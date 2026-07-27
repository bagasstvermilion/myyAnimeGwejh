import { createClient } from 'jsr:@supabase/supabase-js@2'

const VALID_ROLES = ['admin', 'moderator', 'user']

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

  // only real admins can change roles — moderators keep dashboard access but
  // can't promote/demote anyone (including themselves), so there's no coup path
  if (!caller || caller.app_metadata?.role !== 'admin') {
    return json({ error: 'Cuma admin yang bisa ubah role.' }, 403)
  }

  const { userId, role } = await req.json()
  if (!userId || !VALID_ROLES.includes(role)) {
    return json({ error: 'userId dan role (admin/moderator/user) wajib diisi.' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: target, error: getError } = await adminClient.auth.admin.getUserById(userId)
  if (getError || !target.user) return json({ error: 'Akun tidak ditemukan.' }, 404)

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { ...target.user.app_metadata, role },
  })
  if (updateError) return json({ error: updateError.message }, 500)

  // lets the admin Overview page's realtime subscription know to refetch
  await adminClient
    .from('user_events')
    .insert({ event_type: 'role_change', user_id: userId, metadata: { role } })

  return json({ success: true })
})
