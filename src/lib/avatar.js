import { supabase } from './supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function deriveNameFromEmail(email) {
  const local = email.split('@')[0]
  return local
    .replace(/[._]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function displayName(user) {
  if (!user) return ''
  return user.user_metadata?.display_name || deriveNameFromEmail(user.email)
}

// Google's OAuth avatar URLs embed the requested size (e.g. "=s96-c"),
// which defaults to a tiny thumbnail — bump it up for full-size previews
export function largeAvatarUrl(url, size = 512) {
  if (!url) return url
  if (!url.includes('googleusercontent.com')) return url
  return url.replace(/=s\d+/, `=s${size}`)
}

export async function uploadAvatar(file, userId) {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran gambar maksimal 5MB.')
  }

  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // cache-bust so the browser doesn't keep showing the old photo at the
  // same URL right after a re-upload
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  })
  if (updateError) throw updateError

  return avatarUrl
}

export async function removeAvatar(userId) {
  const { data: files } = await supabase.storage.from('avatars').list(userId)
  if (files?.length) {
    await supabase.storage
      .from('avatars')
      .remove(files.map((f) => `${userId}/${f.name}`))
  }

  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: null },
  })
  if (error) throw error
}

export async function updateDisplayName(name) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Nama gak boleh kosong.')

  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed },
  })
  if (error) throw error

  return trimmed
}
