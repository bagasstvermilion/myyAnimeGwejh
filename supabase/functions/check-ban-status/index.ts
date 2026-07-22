import { createClient } from 'jsr:@supabase/supabase-js@2'

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

  const { email } = await req.json()
  if (!email) return json({ banned: false })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (error) return json({ banned: false })

  const target = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )
  if (!target) return json({ banned: false })

  const isBanned = !!target.banned_until && new Date(target.banned_until) > new Date()
  if (!isBanned) return json({ banned: false })

  return json({
    banned: true,
    bannedUntil: target.banned_until,
    reason: target.app_metadata?.banReason ?? null,
    duration: target.app_metadata?.banDurationLabel ?? null,
  })
})
