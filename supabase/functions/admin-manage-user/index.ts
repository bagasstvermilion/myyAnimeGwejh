import { createClient } from 'jsr:@supabase/supabase-js@2'

const VALID_ACTIONS = ['delete', 'ban', 'unban']

const BAN_DURATIONS: Record<string, string> = {
  '3d': '72h',
  '7d': '168h',
  '30d': '720h',
  permanent: '876000h', // ~100 years, effectively permanent
}

const DURATION_LABELS: Record<string, string> = {
  '3d': '3 hari',
  '7d': '7 hari',
  '30d': '30 hari',
  permanent: 'permanen',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Belum login.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // verify the caller (using their own token) is an admin before doing anything
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()

  if (!caller || caller.app_metadata?.role !== 'admin') {
    return json({ error: 'Kamu bukan admin.' }, 403)
  }

  const { userId, action, duration, reason } = await req.json()
  if (!userId || !VALID_ACTIONS.includes(action)) {
    return json({ error: 'userId dan action (delete/ban/unban) wajib diisi.' }, 400)
  }

  if (action === 'ban' && !BAN_DURATIONS[duration]) {
    return json({ error: 'Durasi banned gak valid.' }, 400)
  }

  if (userId === caller.id) {
    return json({ error: 'Gak bisa lakuin aksi ini ke akun sendiri.' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  if (action === 'delete') {
    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 500)
    return json({ success: true })
  }

  const { data: target, error: getError } = await adminClient.auth.admin.getUserById(userId)
  if (getError || !target.user) return json({ error: 'Akun tidak ditemukan.' }, 404)

  const actorName = caller.email?.split('@')[0] ?? 'admin'
  const message =
    action === 'ban'
      ? `${actorName} telah mem-banned user tersebut selama ${DURATION_LABELS[duration]}${reason ? ` (Alasan: ${reason})` : ''}`
      : `${actorName} telah meng-unbanned user tersebut`

  const existingLogs = Array.isArray(target.user.app_metadata?.logs)
    ? target.user.app_metadata.logs
    : []
  const logs = [...existingLogs, { message, at: new Date().toISOString(), action }]

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: action === 'ban' ? BAN_DURATIONS[duration] : 'none',
    app_metadata: {
      ...target.user.app_metadata,
      logs,
      banReason: action === 'ban' ? reason || null : null,
      banDurationLabel: action === 'ban' ? DURATION_LABELS[duration] : null,
    },
  })
  if (error) return json({ error: error.message }, 500)

  return json({ success: true })
})
