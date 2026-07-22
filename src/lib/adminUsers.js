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

export async function manageUser({ userId, action, duration }) {
  const { data, error } = await supabase.functions.invoke('admin-manage-user', {
    body: { userId, action, duration },
  })
  if (error) throw new Error(await extractError(error, data))
  return data
}
