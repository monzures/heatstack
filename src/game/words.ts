import type { RNG } from './rng.ts'

let playableWords: string[] = []
let validSet: Set<string> = new Set()
const signatureToWords: Map<string, string[]> = new Map()
const anchorKeyToWords: Map<string, string[]> = new Map()
let loaded = false

function buildCaches(words: string[]) {
  signatureToWords.clear()
  anchorKeyToWords.clear()

  for (const word of words) {
    const upper = word.toUpperCase()
    const letters = upper.split('')
    const signature = letters.slice().sort().join('')

    const sigBucket = signatureToWords.get(signature)
    if (sigBucket) {
      sigBucket.push(upper)
    } else {
      signatureToWords.set(signature, [upper])
    }

    for (let i = 0; i < letters.length; i++) {
      for (let j = i + 1; j < letters.length; j++) {
        const key = [letters[i], letters[j]].sort().join('')
        const anchorBucket = anchorKeyToWords.get(key)
        if (anchorBucket) {
          anchorBucket.push(upper)
        } else {
          anchorKeyToWords.set(key, [upper])
        }
      }
    }
  }
}

export async function loadWordLists(): Promise<void> {
  if (loaded) return
  const response = await fetch('/data/playable.json')
  playableWords = await response.json()
  validSet = new Set(playableWords)
  buildCaches(playableWords)
  loaded = true
}

export function isLoaded(): boolean {
  return loaded
}

export function isValidWord(word: string): boolean {
  return validSet.has(word.toLowerCase())
}

export function getPlayableWords(): string[] {
  return playableWords
}

export function getRandomPlayableWord(rng: RNG): string {
  const idx = Math.floor(rng() * playableWords.length)
  return playableWords[idx].toUpperCase()
}

export function findAnagramForLetters(letters: string[]): string | null {
  if (!loaded) return null
  const signature = letters.map((l) => l.toUpperCase()).sort().join('')
  return signatureToWords.get(signature)?.[0] ?? null
}

export function getAnagramsForLetters(letters: string[]): string[] {
  if (!loaded) return []
  const signature = letters.map((l) => l.toUpperCase()).sort().join('')
  return signatureToWords.get(signature) ?? []
}

export function canFormPlayableWord(letters: string[]): boolean {
  return findAnagramForLetters(letters) !== null
}

export function getWordsWithAnchors(a: string, b: string): string[] {
  if (!loaded) return []
  const key = [a.toUpperCase(), b.toUpperCase()].sort().join('')
  return anchorKeyToWords.get(key) ?? []
}

export function getRandomWordWithAnchors(params: {
  a: string
  b: string
  rng: RNG
  exclude?: string[]
}): string {
  const candidates = getWordsWithAnchors(params.a, params.b)
  const excluded = new Set(params.exclude ?? [])
  const filtered = candidates.filter((word) => !excluded.has(word))
  const pool = filtered.length > 0 ? filtered : candidates

  if (pool.length === 0) return getRandomPlayableWord(params.rng)
  const idx = Math.floor(params.rng() * pool.length)
  return pool[idx]
}

export function getWordCount(): number {
  return playableWords.length
}

export function __setPlayableWordsForTests(words: string[]): void {
  playableWords = words.map((word) => word.toLowerCase())
  validSet = new Set(playableWords)
  buildCaches(playableWords)
  loaded = true
}

export function __resetWordListsForTests(): void {
  playableWords = []
  validSet = new Set()
  signatureToWords.clear()
  anchorKeyToWords.clear()
  loaded = false
}
