// Opening / ending / insert songs (with playable video) from
// AnimeThemes.moe, looked up by the AniList id the rest of the app already
// uses. Goes through their GraphQL endpoint — the older REST API at
// api.animethemes.moe is deprecated and currently answers 503.
// Rate limit there is 90 requests/minute, separate from AniList's.

const ENDPOINT = 'https://graphql.animethemes.moe/'

const QUERY = `
  query ($ids: [Int!]) {
    findAnimeByExternalSite(site: ANILIST, id: $ids) {
      siteUrl
      animethemes {
        id
        type
        sequence
        slug
        group {
          name
        }
        song {
          title {
            romaji
            native
          }
          performances {
            as
            artist {
              name {
                main
              }
            }
          }
        }
        animethemeentries {
          id
          version
          episodes
          spoiler
          nsfw
          videos {
            nodes {
              id
              link
              resolution
              nc
              subbed
              lyrics
              overlap
            }
          }
        }
      }
    }
  }
`

const TYPE_ORDER = { OP: 0, ED: 1, IN: 2 }

// AnimeThemes files dubbed OP/EDs under a theme group named after the
// language ("English Version", "English Version - 4Kids", "Chinese
// Version", "Korean Version" — One Piece alone has 17 of them). Every other
// group ("TV Version", "BD Version", broadcast/theatrical cuts…) is still
// the original Japanese song, so only language-named groups are dropped.
const DUB_GROUP =
  /english|chinese|mandarin|cantonese|korean|spanish|latin|portuguese|french|german|italian|arabic|russian|tagalog|thai|indonesian/i

function isDub(theme) {
  return Boolean(theme.group && DUB_GROUP.test(theme.group.name))
}

// an entry can have several encodes (with/without credits, subbed, lyrics,
// 720p/1080p...) — prefer the plain one: no lyrics/subs, nothing overlapping
// the footage, creditless if there is one, highest resolution
function pickVideo(videos) {
  const rank = (v) => [
    v.lyrics || v.subbed ? 1 : 0,
    v.overlap === 'NONE' ? 0 : 1,
    v.nc ? 0 : 1,
    -(v.resolution ?? 0),
  ]
  return [...videos].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let i = 0; i < ra.length; i++) {
      if (ra[i] !== rb[i]) return ra[i] - rb[i]
    }
    return 0
  })[0]
}

function normalizeTheme(theme) {
  const entries = theme.animethemeentries
    .map((entry) => {
      const video = pickVideo(entry.videos?.nodes ?? [])
      if (!video) return null
      return {
        id: entry.id,
        version: entry.version,
        episodes: entry.episodes,
        spoiler: entry.spoiler,
        nsfw: entry.nsfw,
        videoUrl: video.link,
        resolution: video.resolution,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.version - b.version)

  return {
    id: theme.id,
    type: theme.type,
    sequence: theme.sequence,
    slug: theme.slug,
    title: theme.song?.title?.romaji || theme.song?.title?.native || 'Judul tidak diketahui',
    titleNative: theme.song?.title?.native ?? null,
    artists: (theme.song?.performances ?? []).map((p) => ({
      name: p.artist.name.main,
      as: p.as || null,
    })),
    entries,
  }
}

// { siteUrl, themes } — original Japanese themes only (no dubs), ordered
// OP → ED → insert songs, each by sequence. Anime AnimeThemes doesn't know
// about (common for titles that haven't aired) just come back with an
// empty list.
export async function getAnimeThemes(anilistId) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { ids: [Number(anilistId)] } }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok || !json || json.errors) {
    throw new Error(json?.errors?.[0]?.message || `AnimeThemes API error: ${res.status}`)
  }

  const anime = json.data?.findAnimeByExternalSite?.[0]
  if (!anime) return { siteUrl: null, themes: [] }

  const themes = anime.animethemes
    .filter((t) => !isDub(t))
    .map(normalizeTheme)
    .filter((t) => t.entries.length)
    .sort(
      (a, b) =>
        (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3) ||
        (a.sequence ?? 1) - (b.sequence ?? 1) ||
        a.slug.localeCompare(b.slug),
    )

  return { siteUrl: anime.siteUrl, themes }
}
