import type { RNG } from './rng.ts'
import type { WordRecord } from './types.ts'
import { getRandomPlayableWord, getRandomWordWithAnchors, getWordsWithAnchors } from './words.ts'

const LINKED_RACK_CHANCE = 0.62
const WILD_ANCHOR_POOL = ['E', 'A', 'R', 'O', 'T', 'L', 'I', 'N', 'S', 'H']

export function getMultisetOverlap(a: string, b: string): number {
  const leftCounts = new Map<string, number>()
  for (const letter of a.toUpperCase()) {
    leftCounts.set(letter, (leftCounts.get(letter) ?? 0) + 1)
  }

  let overlap = 0
  for (const letter of b.toUpperCase()) {
    const count = leftCounts.get(letter) ?? 0
    if (count > 0) {
      overlap += 1
      leftCounts.set(letter, count - 1)
    }
  }

  return overlap
}

export function getNextCombo(params: {
  previousWord: string | null
  previousCombo: number
  nextWord: string
}): { combo: number; overlap: number } {
  if (!params.previousWord) {
    return { combo: 1, overlap: 0 }
  }

  const overlap = getMultisetOverlap(params.previousWord, params.nextWord)
  if (overlap >= 2) {
    return { combo: params.previousCombo + 1, overlap }
  }

  return { combo: 1, overlap }
}

export function pickAnchors(word: string, rng: RNG): [string, string] {
  const letters = word.toUpperCase().split('')
  const first = Math.floor(rng() * letters.length)

  let second = Math.floor(rng() * letters.length)
  while (second === first) {
    second = Math.floor(rng() * letters.length)
  }

  return [letters[first], letters[second]]
}

function pickWildAnchors(word: string, rng: RNG): [string, string] {
  const letters = word.toUpperCase().split('')
  const anchorFromChain = letters[Math.floor(rng() * letters.length)]
  const randomPoolLetter = WILD_ANCHOR_POOL[Math.floor(rng() * WILD_ANCHOR_POOL.length)]
  return [anchorFromChain, randomPoolLetter]
}

export function shuffledLetters(word: string, rng: RNG): string[] {
  const letters = word.toUpperCase().split('')
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  return letters
}

export function chooseNextRackSource(params: {
  previousWord: string | null
  rng: RNG
  recentRackSources: string[]
}): { sourceWord: string; anchors: [string, string] | null } {
  if (!params.previousWord) {
    return {
      sourceWord: getRandomPlayableWord(params.rng),
      anchors: null,
    }
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const useLinked = params.rng() < LINKED_RACK_CHANCE
    const anchors = useLinked
      ? pickAnchors(params.previousWord, params.rng)
      : pickWildAnchors(params.previousWord, params.rng)
    const candidates = getWordsWithAnchors(anchors[0], anchors[1])
    if (candidates.length === 0) continue

    const sourceWord = getRandomWordWithAnchors({
      a: anchors[0],
      b: anchors[1],
      rng: params.rng,
      exclude: params.recentRackSources,
    })

    return { sourceWord, anchors }
  }

  return {
    sourceWord: getRandomPlayableWord(params.rng),
    anchors: null,
  }
}

export function trimRecentRackSources(sources: string[], max = 10): string[] {
  if (sources.length <= max) return sources
  return sources.slice(sources.length - max)
}

export function getTopChain(history: WordRecord[]): string[] {
  if (history.length === 0) return []

  let bestStart = 0
  let bestLen = 1
  let start = 0

  for (let i = 1; i < history.length; i++) {
    if (history[i].combo <= 1) {
      const len = i - start
      if (len > bestLen) {
        bestLen = len
        bestStart = start
      }
      start = i
    }
  }

  const tailLen = history.length - start
  if (tailLen > bestLen) {
    bestLen = tailLen
    bestStart = start
  }

  return history
    .slice(bestStart, bestStart + bestLen)
    .map((entry) => entry.word.toUpperCase())
    .slice(0, 6)
}
