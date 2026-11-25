// Typo-tolerant title lookup. AniList's `search` only matches whole words, so
// one wrong letter ("narto", "one pice", "jujutsu kaisn") — or a missing
// space ("onepiece") — returns nothing at all. When that happens, this
// matches the query against a bundled list of popular titles
// (src/data/searchIndex.json, built by `npm run search-index`) and works out
// which title was most likely meant.
//
// Each query word is matched against each title with an edit distance that
// counts a missing, extra, wrong or swapped letter as one edit, and lets the
// word land anywhere in the title — so "frieren" still finds
// "Sousou no Frieren" and a half-typed "chainsa" finds "Chainsaw Man".

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

// lowercase, strip accents, and turn everything that isn't a letter/digit
// into single spaces — the same folding prepareName() applies to titles
export function normalizeWords(text) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

// a title squashed down to letters/digits only (so missing/extra spaces
// don't count as typos), remembering where each kept character came from in
// the original title and where its words start/end
function prepareName(text) {
  let compact = ''
  const origin = []
  const wordStart = []
  let atBoundary = true

  for (let i = 0; i < text.length; i++) {
    const folded = text[i].normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    let kept = false
    for (const ch of folded) {
      if (!LETTER_OR_DIGIT.test(ch)) continue
      compact += ch
      origin.push(i)
      wordStart.push(atBoundary)
      atBoundary = false
      kept = true
    }
    if (!kept) atBoundary = true
  }

  const wordEnd = wordStart.map((_, j) => j === wordStart.length - 1 || wordStart[j + 1])
  return { text, compact, origin, wordStart, wordEnd }
}

let indexPromise = null

// the index is ~a few hundred KB, so it's only fetched (as its own chunk)
// the first time a search actually comes back empty
function loadIndex() {
  indexPromise ??= import('../data/searchIndex.json')
    .then(({ default: entries }) =>
      entries.map(([id, names]) => ({ id, names: names.map(prepareName) })),
    )
    .catch((err) => {
      indexPromise = null
      throw err
    })
  return indexPromise
}

// how many typos a single word may have — short words get none, since with
// so few letters almost anything is "one edit away"
function wordBudget(length) {
  if (length <= 2) return 0
  if (length <= 7) return 1
  if (length <= 11) return 2
  return 3
}

// how many typos the whole query may have in total
function queryBudget(length) {
  if (length < 4) return 0
  if (length <= 5) return 1
  if (length <= 9) return 2
  if (length <= 14) return 3
  return 4
}

// fewest edits (missing / extra / wrong letter, or two neighbouring letters
// swapped) that turn `word` into some stretch of the title starting at the
// beginning of one of its words, and where that stretch is. A stretch may
// end mid-word (so a half-typed "chainsa" still finds "Chainsaw"), but that
// scores a little worse; so does reusing title letters an earlier query word
// already claimed (`taken`), so "hunter x huntr" maps onto both "Hunter"s.
// Returns null when it'd take more than `maxEdits`.
function matchWord(word, name, maxEdits, taken) {
  const text = name.compact
  const m = word.length
  const n = text.length
  if (!n || m - maxEdits > n) return null

  // rolling DP rows: dist[j] = edits so far when the match ends right before
  // text[j]; start[j] = where in the title that match began. In row 0 a
  // match may begin at any word start for free — beginning mid-word costs
  // one edit per letter skipped, so "aruto" still reaches "Naruto" but
  // "episode" can't hide inside the middle of some unrelated word.
  let before = null
  let beforeStart = null
  let prev = new Array(n + 1)
  let prevStart = new Array(n + 1)
  for (let j = 0; j <= n; j++) {
    if (j < n && name.wordStart[j]) {
      prev[j] = 0
      prevStart[j] = j
    } else {
      prev[j] = prev[j - 1] + 1
      prevStart[j] = prevStart[j - 1]
    }
  }

  for (let i = 1; i <= m; i++) {
    const cur = new Array(n + 1)
    const curStart = new Array(n + 1)
    cur[0] = i
    curStart[0] = 0
    let rowMin = i

    for (let j = 1; j <= n; j++) {
      let best = prev[j - 1] + (word[i - 1] === text[j - 1] ? 0 : 1)
      let start = prevStart[j - 1]

      if (prev[j] + 1 < best) {
        best = prev[j] + 1 // letter in the query that the title doesn't have
        start = prevStart[j]
      }
      if (cur[j - 1] + 1 < best) {
        best = cur[j - 1] + 1 // letter in the title that the query skipped
        start = curStart[j - 1]
      }
      if (
        i > 1 &&
        j > 1 &&
        word[i - 1] === text[j - 2] &&
        word[i - 2] === text[j - 1] &&
        before[j - 2] + 1 < best
      ) {
        best = before[j - 2] + 1 // two letters swapped ("naurto")
        start = beforeStart[j - 2]
      }

      cur[j] = best
      curStart[j] = start
      if (best < rowMin) rowMin = best
    }

    // the row minimum never goes down, so this title can't match anymore
    if (rowMin > maxEdits) return null

    before = prev
    beforeStart = prevStart
    prev = cur
    prevStart = curStart
  }

  let result = null
  for (let j = 1; j <= n; j++) {
    const edits = prev[j]
    const start = prevStart[j]
    const end = j - 1
    if (edits > maxEdits || end < start) continue

    const overlaps = taken.some((t) => start <= t.end && end >= t.start)
    const score = edits + (name.wordEnd[end] ? 0 : 0.5) + (overlaps ? 1 : 0)
    if (!result || score < result.score) result = { edits, score, start, end }
  }
  return result
}

// the query either word by word, or — to catch stray spaces like
// "tora dora" for "Toradora" — squashed into a single word, whichever fits
// the title better
function matchName(words, name, maxTotal) {
  const separate = matchWords(words, name, maxTotal)
  if (words.length === 1) return separate

  // squashed, it's one long word with a bigger typo budget than its parts
  // had — capped so it can't wave through more typos than they could
  const partsBudget = words.reduce((sum, w) => sum + wordBudget(w.length), 0)
  const joined = matchWords([words.join('')], name, Math.min(maxTotal, partsBudget))
  if (!joined) return separate
  if (!separate) return joined
  return joined.score < separate.score ? joined : separate
}

function matchWords(words, name, maxTotal) {
  let edits = 0
  let score = 0
  const spans = []

  for (const word of words) {
    const budget = Math.min(wordBudget(word.length), maxTotal - edits)
    const hit = matchWord(word, name, budget, spans)
    if (!hit) return null
    edits += hit.edits
    score += hit.score
    spans.push(hit)
  }

  return { edits, score, name, spans }
}

// the corrected search text: each query word swapped for the whole title
// word(s) it lined up with, in the title's own spelling ("narto" → "Naruto",
// "onepiece" → "ONE PIECE")
function correctionFor({ name, spans }) {
  const parts = []
  const used = new Set()

  for (let { start, end } of spans) {
    while (!name.wordEnd[end]) end++

    // two query words landing on the same title word only add it once
    const key = `${start}-${end}`
    if (used.has(key)) continue
    used.add(key)
    parts.push(name.text.slice(name.origin[start], name.origin[end] + 1))
  }

  return parts.join(' ')
}

function parseQuery(query) {
  const words = normalizeWords(query).split(' ').filter(Boolean)
  const maxTotal = queryBudget(words.reduce((sum, w) => sum + w.length, 0))
  return { words, maxTotal }
}

// typo-tolerant filter for a list that's already in memory (e.g. an anime's
// cast): the items whose name is close enough to the query, best match
// first, ties kept in their original order. Anything clearly worse than the
// best match is dropped — "yun yun" should find Yunyun, not also Luna just
// because "yun" is one letter off "lun".
export function fuzzyFilter(query, items, getName) {
  const { words, maxTotal } = parseQuery(query)
  if (!maxTotal) return []

  const matches = items
    .map((item, order) => {
      const name = getName(item)
      const hit = name && matchName(words, prepareName(name), maxTotal)
      return hit && { item, order, score: hit.score }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.order - b.order)

  const cutoff = (matches[0]?.score ?? 0) + 1
  return matches.filter((m) => m.score <= cutoff).map((m) => m.item)
}

// best guess at which title(s) a query that found nothing was meant to be.
// Returns null when nothing is close enough; otherwise
//   correctedQuery — the query rewritten to the closest title's spelling
//   ids          — AniList ids of the closest titles, best first
export async function findSimilarTitles(query, limit = 24) {
  const { words, maxTotal } = parseQuery(query)
  if (!maxTotal) return null

  const index = await loadIndex()
  const matches = []

  // index is ordered by popularity, so `rank` breaks ties toward the title
  // people are far more likely to be looking for
  index.forEach((entry, rank) => {
    let best = null
    for (const name of entry.names) {
      const hit = matchName(words, name, maxTotal)
      if (hit && (!best || hit.score < best.score)) best = hit
    }
    if (best) matches.push({ id: entry.id, rank, best })
  })

  if (!matches.length) return null

  matches.sort((a, b) => a.best.score - b.best.score || a.rank - b.rank)

  return {
    correctedQuery: correctionFor(matches[0].best),
    ids: matches.slice(0, limit).map((m) => m.id),
  }
}
