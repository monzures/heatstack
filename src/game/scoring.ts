import type { Medal } from './types.ts'
import { getHeatMultiplier } from './heat.ts'

export function countUniqueLetters(word: string): number {
  return new Set(word.toUpperCase().split('')).size
}

export function calculateWordBaseScore(word: string, rerollsLeft: number): number {
  return 80 + countUniqueLetters(word) * 8 + rerollsLeft * 6
}

export function calculateWordScore(params: {
  word: string
  rerollsLeft: number
  heat: number
  combo: number
  rackAgeMs: number
}): { scoreGain: number; multiplier: number; base: number } {
  const base = calculateWordBaseScore(params.word, params.rerollsLeft)
  const multiplier = getHeatMultiplier(params.heat)
  const quickBonus = Math.max(0, 45 - Math.floor(params.rackAgeMs / 250))
  const scoreGain = Math.round(base * multiplier) + params.combo * 14 + quickBonus
  return { scoreGain, multiplier, base }
}

export function getDailyMedal(score: number): Medal {
  if (score >= 3200) return 'Gold'
  if (score >= 2200) return 'Silver'
  if (score >= 1400) return 'Bronze'
  return 'None'
}
