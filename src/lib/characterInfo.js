const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

export function formatBirthday(dob) {
  if (!dob?.day || !dob?.month) return null
  return `${dob.day} ${MONTHS[dob.month - 1]}`
}

export function formatFavourites(n) {
  if (n == null) return null
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}

// strips link syntax and emphasis markers down to plain text. Spoiler
// markers (~!...!~) are deliberately left alone — parseBioSegments() below
// uses them to keep spoiler text blurred instead of just unwrapping it
function stripMarkdownEmphasis(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
}

// AniList bios come back as markdown even with asHtml: false
export function cleanBio(text) {
  if (!text) return null
  return stripMarkdownEmphasis(text).trim()
}

// splits cleaned bio text on ~!spoiler!~ markers into alternating
// non-spoiler/spoiler segments, so the UI can render spoiler parts blurred
export function parseBioSegments(text) {
  if (!text) return []
  return text
    .split(/~!|!~/)
    .map((part, i) => ({ spoiler: i % 2 === 1, text: part }))
    .filter((part) => part.text)
}

// editors commonly prepend a "**Label:** value" stat block (Height, Weight,
// etc.) before the actual prose — pull those out so they can render as
// their own stat rows instead of leaking into the bio paragraph.
//
// AniList frequently packs several "__Label:__ value" pairs onto a single
// line (e.g. "__Affiliation:__ ~!...!~ __Occupation:__ ~!...!~__Devil
// Fruit:__ ..."), so this scans for every label marker across the whole
// leading block rather than assuming one label per line — a per-line match
// would swallow the later labels (and their raw markdown/spoiler tags)
// into the first label's value.
export function extractStats(description) {
  if (!description) return { stats: [], rest: null }

  // the stat block ends at the first blank line, where free-form prose
  // begins
  const blankLineIndex = description.search(/\r?\n[ \t]*\r?\n/)
  const blockEnd = blankLineIndex === -1 ? description.length : blankLineIndex
  const block = description.slice(0, blockEnd)
  const rest = description.slice(blockEnd).trim() || null

  // handles both "**Height:** 164cm" (colon inside the markers) and
  // "**Height**: 164cm" (colon outside)
  const labelPattern = /(?:\*\*|__)([^*_]+?)(?:\*\*|__):?[ \t]*/g
  const matches = [...block.matchAll(labelPattern)]
  if (!matches.length) return { stats: [], rest: description.trim() || null }

  const stats = matches
    .map((m, i) => {
      const label = m[1].replace(/:$/, "").trim()
      const start = m.index + m[0].length
      const end = i + 1 < matches.length ? matches[i + 1].index : block.length
      const value = stripMarkdownEmphasis(block.slice(start, end)).trim()
      return { label, value }
    })
    .filter((s) => s.value)

  return { stats, rest }
}
