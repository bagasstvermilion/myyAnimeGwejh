// Builds src/data/searchIndex.json — the title list the typo-tolerant search
// (src/lib/fuzzySearch.js) matches against when AniList's own search comes
// back empty. AniList only matches whole words, so a single typo ("narto",
// "one pice") returns nothing; this index lets the app work out which title
// was meant and re-run the search with it.
//
// Run with `npm run search-index` every so often (e.g. each new season) so
// newly popular titles get picked up.

import { writeFile, mkdir } from 'node:fs/promises'

const ENDPOINT = 'https://graphql.anilist.co'
const PER_PAGE = 50 // AniList's max
const TOTAL = Number(process.argv[2]) || 5000
const OUT = new URL('../src/data/searchIndex.json', import.meta.url)

const QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        id
        title { romaji english }
        synonyms
      }
    }
  }
`

// synonyms come in every script under the sun — only latin-script ones are
// useful for matching what people type into the search box
const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u

function compactLength(name) {
  return name.normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '').length
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchPage(page) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
    })

    if (res.status === 429 && attempt < 5) {
      const wait = (Number(res.headers.get('retry-after')) || 60) * 1000
      console.log(`  rate limited, waiting ${wait / 1000}s`)
      await sleep(wait)
      continue
    }

    const json = await res.json()
    if (!res.ok || json.errors) {
      throw new Error(json.errors?.[0]?.message || `AniList API error: ${res.status}`)
    }
    return json.data.Page
  }
}

const entries = []
const pages = Math.ceil(TOTAL / PER_PAGE)

for (let page = 1; page <= pages; page++) {
  const { media, pageInfo } = await fetchPage(page)

  for (const m of media) {
    const seen = new Set()
    const names = []
    for (const name of [m.title.romaji, m.title.english, ...(m.synonyms ?? [])]) {
      const trimmed = name?.trim()
      if (!trimmed || !LATIN_ONLY.test(trimmed) || compactLength(trimmed) < 4) continue
      const key = trimmed.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      names.push(trimmed)
    }
    if (names.length) entries.push([m.id, names])
  }

  console.log(`page ${page}/${pages} — ${entries.length} titles`)
  if (!pageInfo.hasNextPage) break
  // stays under AniList's (currently reduced) 30 requests/minute limit
  await sleep(2100)
}

await mkdir(new URL('.', OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(entries))
console.log(`wrote ${entries.length} titles to ${OUT.pathname}`)
