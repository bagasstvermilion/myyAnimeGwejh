const BASE_URL = 'https://api.jikan.moe/v4'

async function jikanFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Jikan API error: ${res.status}`)
  }
  return res.json()
}

export function searchAnime(query, page = 1) {
  const params = new URLSearchParams({ q: query, page })
  return jikanFetch(`/anime?${params}`)
}

export function getTopAnime(page = 1) {
  const params = new URLSearchParams({ page })
  return jikanFetch(`/top/anime?${params}`)
}

export function getAnimeById(id) {
  return jikanFetch(`/anime/${id}/full`)
}
