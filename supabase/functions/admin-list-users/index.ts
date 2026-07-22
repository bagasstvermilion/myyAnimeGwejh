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

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: usersPage, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) return json({ error: listError.message }, 500)

  const users = usersPage.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      role: u.app_metadata?.role === 'admin' ? 'admin' : 'user',
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
      isBanned: !!u.banned_until && new Date(u.banned_until) > new Date(),
      logs: Array.isArray(u.app_metadata?.logs) ? u.app_metadata.logs : [],
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return json({ users })
})
