import { supabase } from './supabase'

export const STATUSES = [
  { value: 'watching', label: 'Sedang Ditonton' },
  { value: 'completed', label: 'Selesai' },
  { value: 'plan_to_watch', label: 'Rencana Ditonton' },
  { value: 'dropped', label: 'Berhenti' },
]

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value
}

const STATUS_COLORS = {
  watching: 'text-blue-600',
  completed: 'text-emerald-600',
  plan_to_watch: 'text-violet-600',
  dropped: 'text-red-500',
}

export function statusColor(value) {
  return STATUS_COLORS[value] ?? 'text-zinc-500'
}

export async function getWatchlist(userId) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getWatchlistEntry(userId, animeId) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .eq('anime_id', animeId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertWatchlistEntry({ userId, animeId, title, coverImage, status }) {
  const { data, error } = await supabase
    .from('watchlist')
    .upsert(
      {
        user_id: userId,
        anime_id: animeId,
        title,
        cover_image: coverImage,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,anime_id' },
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeWatchlistEntry(userId, animeId) {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('anime_id', animeId)

  if (error) throw error
}
