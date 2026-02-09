import { describe, it, expect } from 'vitest'
import { calculateWordBaseScore, calculateWordScore, countUniqueLetters, getDailyMedal } from '../scoring.ts'

describe('scoring', () => {
  it('counts unique letters', () => {
    expect(countUniqueLetters('STACK')).toBe(5)
    expect(countUniqueLetters('LEVEL')).toBe(3)
  })

  it('computes base score from unique letters and rerolls', () => {
    // 80 + (5 * 8) + (4 * 6) = 144
    expect(calculateWordBaseScore('CRANE', 4)).toBe(144)
  })

  it('applies heat multiplier, combo bonus, and quick bonus', () => {
    const result = calculateWordScore({
      word: 'CRANE',
      rerollsLeft: 4,
      heat: 80, // 1.9x
      combo: 4,
      rackAgeMs: 0,
    })

    // base 144 * 1.9 => 273.6 (~274), combo 56, quick 45 => 375
    expect(result.scoreGain).toBe(375)
    expect(result.multiplier).toBe(1.9)
  })

  it('returns daily medal thresholds', () => {
    expect(getDailyMedal(1300)).toBe('None')
    expect(getDailyMedal(1400)).toBe('Bronze')
    expect(getDailyMedal(2200)).toBe('Silver')
    expect(getDailyMedal(3000)).toBe('Silver')
    expect(getDailyMedal(3200)).toBe('Gold')
  })
})
