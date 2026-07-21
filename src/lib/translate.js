const ENDPOINT = 'https://api.mymemory.translated.net/get'
// MyMemory's free/anonymous tier caps out around 500 chars per request, so
// long synopses need to be split into smaller pieces first
const CHUNK_SIZE = 450

function splitIntoChunks(text) {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks = []
  let current = ''

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence
    if (candidate.length > CHUNK_SIZE && current) {
      chunks.push(current)
      current = sentence
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)

  return chunks
}

async function translateChunk(text, target) {
  const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|${target}`
  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok || !json.responseData) {
    throw new Error('Translation failed')
  }

  return json.responseData.translatedText
}

export async function translateText(text, target = 'id') {
  if (!text) return ''

  const chunks = splitIntoChunks(text)
  const translated = []
  for (const chunk of chunks) {
    // sequential, not Promise.all — MyMemory's anonymous tier is easy to
    // rate-limit if hit with several requests at once
    translated.push(await translateChunk(chunk, target))
  }

  return translated.join(' ')
}
