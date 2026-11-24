import { findSimilarTitles, normalizeWords } from './fuzzySearch'

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
  bannerImage
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

// AniList's fixed genre list (minus Hentai, since isAdult: false already
// excludes it from every query anyway)
export const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
]

export const FORMATS = [
  { value: 'TV', label: 'TV' },
  { value: 'TV_SHORT', label: 'TV Short' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'MUSIC', label: 'Music' },
]

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

function mapCharacterEdge(edge) {
  return {
    id: edge.node.id,
    name: edge.node.name?.full,
    nativeName: edge.node.name?.native,
    alternative: (edge.node.name?.alternative ?? []).filter(Boolean),
    alternativeSpoiler: (edge.node.name?.alternativeSpoiler ?? []).filter(Boolean),
    image: edge.node.image?.large,
    role: edge.role,
    description: edge.node.description,
    gender: edge.node.gender,
    age: edge.node.age,
    dateOfBirth: edge.node.dateOfBirth,
    favourites: edge.node.favourites,
  }
}

const CHARACTER_NODE_FIELDS = `
  id
  name {
    full
    native
    alternative
    alternativeSpoiler
  }
  image {
    large
  }
  description(asHtml: false)
  gender
  age
  dateOfBirth {
    year
    month
    day
  }
  favourites
`

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
    banner: media.bannerImage,
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
    characters: media.characters?.edges?.map(mapCharacterEdge) ?? [],
    charactersHasMore: media.characters?.pageInfo?.hasNextPage ?? false,
    charactersLastPage: media.characters?.pageInfo?.lastPage ?? 1,
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

async function searchMedia(query, page, { genre, format }) {
  const gql = `
    query ($search: String, $page: Int, $genre: [String], $format: [MediaFormat]) {
      Page(page: $page, perPage: 24) {
        pageInfo {
          currentPage
          lastPage
          hasNextPage
        }
        media(
          search: $search
          type: ANIME
          isAdult: false
          sort: SEARCH_MATCH
          genre_in: $genre
          format_in: $format
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { search: query, page, genre, format })
  return { data: data.Page.media.map(normalize), pageInfo: data.Page.pageInfo }
}

// fetches specific titles (still honouring the genre/format filters), kept in
// the order the ids were given
async function getAnimeByIds(ids, { genre, format }) {
  const gql = `
    query ($ids: [Int], $perPage: Int, $genre: [String], $format: [MediaFormat]) {
      Page(page: 1, perPage: $perPage) {
        media(
          id_in: $ids
          type: ANIME
          isAdult: false
          genre_in: $genre
          format_in: $format
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { ids, perPage: ids.length, genre, format })
  const order = new Map(ids.map((id, i) => [id, i]))
  return data.Page.media
    .sort((a, b) => order.get(a.id) - order.get(b.id))
    .map(normalize)
}

// AniList only matches whole words, so a single typo returns nothing. When a
// search comes back empty, this works out which title was probably meant
// (see fuzzySearch.js) and searches for that instead. The result then also
// carries `suggestion`:
//   { type: 'corrected', query } — results are for the corrected `query`
//   { type: 'similar' }          — results are the closest-matching titles
export async function searchAnime(query, page = 1, filters = {}) {
  const result = await searchMedia(query, page, filters)
  if (result.data.length) return result

  const similar = await findSimilarTitles(query).catch(() => null)
  if (!similar) return result

  const { correctedQuery, ids } = similar
  if (normalizeWords(correctedQuery) !== normalizeWords(query)) {
    const corrected = await searchMedia(correctedQuery, page, filters)
    if (corrected.data.length) {
      return { ...corrected, suggestion: { type: 'corrected', query: correctedQuery } }
    }
  }

  // the closest titles don't paginate, so they only ever fill page 1
  if (page > 1) return result

  const data = await getAnimeByIds(ids, filters)
  if (!data.length) return result

  return {
    data,
    pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false },
    suggestion: { type: 'similar' },
  }
}

export async function getTopAnime(page = 1, { perPage = 24, genre, format, sort = 'SCORE_DESC' } = {}) {
  const gql = `
    query ($page: Int, $perPage: Int, $genre: [String], $format: [MediaFormat], $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          lastPage
          hasNextPage
        }
        media(
          type: ANIME
          isAdult: false
          sort: $sort
          genre_in: $genre
          format_in: $format
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { page, perPage, genre, format, sort: [sort] })
  return { data: data.Page.media.map(normalize), pageInfo: data.Page.pageInfo }
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  if (month <= 3) return { season: 'WINTER', year }
  if (month <= 6) return { season: 'SPRING', year }
  if (month <= 9) return { season: 'SUMMER', year }
  return { season: 'FALL', year }
}

export async function getSeasonAnime(page = 1, { genre, format } = {}) {
  const { season, year } = getCurrentSeason()
  const gql = `
    query (
      $page: Int
      $season: MediaSeason
      $seasonYear: Int
      $genre: [String]
      $format: [MediaFormat]
    ) {
      Page(page: $page, perPage: 24) {
        pageInfo {
          currentPage
          lastPage
          hasNextPage
        }
        media(
          season: $season
          seasonYear: $seasonYear
          type: ANIME
          isAdult: false
          sort: POPULARITY_DESC
          genre_in: $genre
          format_in: $format
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { page, season, seasonYear: year, genre, format })
  return { data: data.Page.media.map(normalize), pageInfo: data.Page.pageInfo }
}

export async function getUpcomingAnime(page = 1, { genre, format } = {}) {
  const gql = `
    query ($page: Int, $genre: [String], $format: [MediaFormat]) {
      Page(page: $page, perPage: 24) {
        pageInfo {
          currentPage
          lastPage
          hasNextPage
        }
        media(
          status: NOT_YET_RELEASED
          type: ANIME
          isAdult: false
          sort: POPULARITY_DESC
          genre_in: $genre
          format_in: $format
        ) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `
  const data = await anilistFetch(gql, { page, genre, format })
  return { data: data.Page.media.map(normalize), pageInfo: data.Page.pageInfo }
}

export async function getAnimeById(id) {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        characters(sort: [ROLE, FAVOURITES_DESC], perPage: 25) {
          pageInfo {
            hasNextPage
            lastPage
          }
          edges {
            role
            node {
              ${CHARACTER_NODE_FIELDS}
            }
          }
        }
      }
    }
  `
  const data = await anilistFetch(gql, { id: Number(id) })
  return { data: normalize(data.Media) }
}

// the character tab only ships the anime's first 25 cast members up front
// (AniList caps perPage at 25 regardless of what's requested) — this pulls
// one additional page at a time so the search box can look beyond it
export async function getAnimeCharactersPage(id, page) {
  const gql = `
    query ($id: Int, $page: Int) {
      Media(id: $id, type: ANIME) {
        characters(sort: [ROLE, FAVOURITES_DESC], page: $page, perPage: 25) {
          pageInfo {
            hasNextPage
          }
          edges {
            role
            node {
              ${CHARACTER_NODE_FIELDS}
            }
          }
        }
      }
    }
  `
  const data = await anilistFetch(gql, { id: Number(id), page })
  const conn = data.Media.characters
  return {
    characters: conn.edges.map(mapCharacterEdge),
    hasNextPage: conn.pageInfo.hasNextPage,
  }
}

export async function getCharacterById(id) {
  const gql = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name {
          full
          native
          alternative
          alternativeSpoiler
        }
        image {
          large
        }
        description(asHtml: false)
        gender
        age
        dateOfBirth {
          year
          month
          day
        }
        favourites
        media(sort: POPULARITY_DESC, page: 1, perPage: 5) {
          edges {
            voiceActors {
              name {
                full
                native
              }
              languageV2
            }
            # AniList quirk: voiceActors silently resolves to null on this
            # edge type unless a node field is also selected alongside it
            node {
              id
            }
          }
        }
      }
    }
  `
  const data = await anilistFetch(gql, { id: Number(id) })
  const c = data.Character
  // the voiceActors(language: JAPANESE) filter argument unreliably returns
  // null instead of the actual list for some characters (an AniList API
  // quirk) — so this fetches every language instead and picks the
  // Japanese one here. Not every media credit has a VA listed at all
  // (e.g. a movie cameo), so this also skips past those to the next one
  const va = c.media?.edges
    ?.flatMap((e) => e.voiceActors ?? [])
    .find((actor) => actor.languageV2 === "Japanese")
  return {
    id: c.id,
    name: c.name?.full,
    nativeName: c.name?.native,
    alternative: (c.name?.alternative ?? []).filter(Boolean),
    alternativeSpoiler: (c.name?.alternativeSpoiler ?? []).filter(Boolean),
    image: c.image?.large,
    description: c.description,
    gender: c.gender,
    age: c.age,
    dateOfBirth: c.dateOfBirth,
    favourites: c.favourites,
    voiceActor: va ? { name: va.name?.full, nativeName: va.name?.native } : null,
  }
}
