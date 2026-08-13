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

// AniList bios come back as markdown even with asHtml: false — strip the
// link syntax and emphasis markers down to plain text. Spoiler markers
// (~!...!~) are deliberately left in place here — parseBioSegments() below
// uses them to keep spoiler text blurred instead of just unwrapping it
export function cleanBio(text) {
  if (!text) return null
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim()
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
// etc.) before the actual prose — pull those leading lines out so they can
// render as their own stat rows instead of leaking into the bio paragraph
export function extractStats(description) {
  if (!description) return { stats: [], rest: null }

  const lines = description.split(/\r?\n/)
  const stats = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      i++
      continue
    }
    // handles both "**Height:** 164cm" (colon inside the markers) and
    // "**Height**: 164cm" (colon outside)
    const match = line.match(/^(?:\*\*|__)([^*_]+)(?:\*\*|__):?\s*(.+)$/)
    if (!match) break
    const label = match[1].replace(/:$/, "").trim()
    stats.push({ label, value: match[2].trim() })
    i++
  }

  return { stats, rest: lines.slice(i).join("\n").trim() || null }
}
