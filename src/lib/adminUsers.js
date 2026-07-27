import { supabase } from './supabase'

async function extractError(error, data) {
  if (data?.error) return data.error

  if (error?.context?.json) {
    try {
      const body = await error.context.json()
      if (body?.error) return body.error
    } catch {
      // response body wasn't JSON, fall through to the generic message
    }
  }

  return error?.message ?? 'Terjadi kesalahan.'
}

export async function fetchUsers() {
  const { data, error } = await supabase.functions.invoke('admin-list-users')
  if (error) throw new Error(await extractError(error, data))
  return data.users
}

export async function setUserRole({ userId, role }) {
  const { data, error } = await supabase.functions.invoke('admin-grant-access', {
    body: { userId, role },
  })
  if (error) throw new Error(await extractError(error, data))
  return data
}

export async function manageUser({ userId, action, duration, reason }) {
  const { data, error } = await supabase.functions.invoke('admin-manage-user', {
    body: { userId, action, duration, reason },
  })
  if (error) throw new Error(await extractError(error, data))
  return data
}

// user_events already has RLS scoped to admins-only, so this can query the
// table directly instead of going through an edge function
export async function fetchLoginEvents(days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('user_events')
    .select('created_at')
    .eq('event_type', 'login')
    .gte('created_at', since)

  if (error) throw error
  return data
}

export async function fetchRecentEvents(limit = 12) {
  const { data, error } = await supabase
    .from('user_events')
    .select('id, event_type, user_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
