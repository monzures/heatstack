import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  chooseNextRackSource,
  getMultisetOverlap,
  getNextCombo,
  getTopChain,
  trimRecentRackSources,
} from '../chain.ts'
import { mulberry32 } from '../rng.ts'
import { __resetWordListsForTests, __setPlayableWordsForTests } from '../words.ts'
import type { WordRecord } from '../types.ts'

describe('chain mechanics', () => {
  beforeEach(() => {
    __setPlayableWordsForTests([
      'crane', 'trace', 'caper', 'clear', 'pearl',
      'crown', 'reach', 'brace', 'cared', 'flare',
    ])
  })

  afterEach(() => {
    __resetWordListsForTests()
  })

  it('counts multiset overlap including duplicates', () => {
    expect(getMultisetOverlap('LEVEL', 'LEMON')).toBe(2) // L,E
    expect(getMultisetOverlap('EERIE', 'SHEER')).toBe(3) // E,E,R
  })

  it('increments combo only when overlap is at least 2', () => {
    expect(getNextCombo({
      previousWord: 'CRANE',
      previousCombo: 3,
      nextWord: 'CAPER',
    })).toEqual({ combo: 4, overlap: 4 })

    expect(getNextCombo({
      previousWord: 'CRANE',
      previousCombo: 3,
      nextWord: 'FJORD',
    })).toEqual({ combo: 1, overlap: 1 })
  })

  it('chooses next rack source containing sampled anchors', () => {
    const rng = mulberry32(42)
    const result = chooseNextRackSource({
      previousWord: 'CRANE',
      rng,
      recentRackSources: ['CRANE'],
    })

    expect(result.anchors).not.toBeNull()
    expect(result.sourceWord).toHaveLength(5)
    if (result.anchors) {
      expect(result.sourceWord.includes(result.anchors[0])).toBe(true)
      expect(result.sourceWord.includes(result.anchors[1])).toBe(true)
    }
  })

  it('trims recent rack source cache to max length', () => {
    const list = Array.from({ length: 14 }, (_, i) => `W${i}`)
    expect(trimRecentRackSources(list, 10)).toHaveLength(10)
    expect(trimRecentRackSources(list, 10)[0]).toBe('W4')
  })

  it('returns longest combo chain words', () => {
    const history: WordRecord[] = [
      { word: 'CRANE', combo: 1, overlap: 0, scoreGain: 100, heatAfter: 30, multiplier: 1.4, rerollsLeft: 2, anchors: ['C', 'R'], submittedAtMs: 0 },
      { word: 'TRACE', combo: 2, overlap: 4, scoreGain: 120, heatAfter: 40, multiplier: 1.4, rerollsLeft: 2, anchors: ['T', 'R'], submittedAtMs: 1 },
      { word: 'CLEAR', combo: 3, overlap: 3, scoreGain: 150, heatAfter: 50, multiplier: 1.8, rerollsLeft: 2, anchors: ['C', 'L'], submittedAtMs: 2 },
      { word: 'MIGHT', combo: 1, overlap: 1, scoreGain: 110, heatAfter: 35, multiplier: 1.4, rerollsLeft: 1, anchors: ['M', 'I'], submittedAtMs: 3 },
    ]

    expect(getTopChain(history)).toEqual(['CRANE', 'TRACE', 'CLEAR'])
  })
})
