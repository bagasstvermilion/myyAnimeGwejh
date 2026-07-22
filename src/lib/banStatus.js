import { supabase } from './supabase'

export async function checkBanStatus(email) {
  const { data, error } = await supabase.functions.invoke('check-ban-status', {
    body: { email },
  })
  if (error || !data) return { banned: false }
  return data
}
