const ENDPOINT = 'https://graphql.anilist.co'

const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    large
    extraLarge
  }
  averageScore
  episodes
  duration
  status
  format
  genres
  description(asHtml: false)
  studios(isMain: true) {
    nodes {
      name
    }
  }
  source
  startDate {
    year
    month
    day
  }
  rankings {
    rank
    type
    allTime
  }
`

const STATUS_LABELS = {
  FINISHED: 'Finished Airing',
  RELEASING: 'Currently Airing',
  NOT_YET_RELEASED: 'Not Yet Aired',
  CANCELLED: 'Cancelled',
  HIATUS: 'On Hiatus',
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// reshape AniList's Media object into the same shape the rest of the app
// already expects (mirrors what Jikan/MAL used to return), so components
// like AnimeCard/AnimeDetail didn't need to change when we switched APIs
function normalize(media) {
  if (!media) return null

  const allTimeRank = media.rankings?.find((r) => r.type === 'RATED' && r.allTime)?.rank

  return {
    mal_id: media.id,
    title: media.title?.romaji,
    title_english: media.title?.english,
    title_japanese: media.title?.native,
    images: {
      webp: {
        image_url: media.coverImage?.large,
        large_image_url: media.coverImage?.extraLarge || media.coverImage?.large,
      },
    },
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
    type: media.format,
    episodes: media.episodes,
    status: STATUS_LABELS[media.status] || media.status,
    genres: media.genres?.map((name) => ({ mal_id: name, name })) ?? [],
    synopsis: stripHtml(media.description),
    studios: media.studios?.nodes ?? [],
    source: media.source,
    duration: media.duration ? `${media.duration} min per ep` : null,
    rank: allTimeRank,
    aired: {
      string: media.startDate?.year
        ? [media.startDate.day, media.startDate.month, media.startDate.year].filter(Boolean).join('/')
        : null,
    },
  }
}

async function anilistFetch(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json()

  if (!res.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || `AniList API error: ${res.status}`)
  }

  return json.data
}

export async function searchAnime(query, page = 1) {
  const gql = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 25) {
        media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { search: query, page })
  return { data: data.Page.media.map(normalize) }
}

export async function getTopAnime(page = 1) {
  const gql = `
    query ($page: Int) {
      Page(page: $page, perPage: 25) {
        media(type: ANIME, isAdult: false, sort: SCORE_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { page })
  return { data: data.Page.media.map(normalize) }
}

export async function getAnimeById(id) {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
      }
    }
  `
  const data = await anilistFetch(gql, { id: Number(id) })
  return { data: normalize(data.Media) }
}
