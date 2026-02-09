import { describe, it, expect } from 'vitest'
import { getDailySeed, getDayNumberForSeed, getMsUntilNextPacificDay, mulberry32 } from '../rng.ts'

describe('mulberry32', () => {
  it('same seed produces same sequence', () => {
    const rng1 = mulberry32(12345)
    const rng2 = mulberry32(12345)
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2())
    }
  })

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(12345)
    const rng2 = mulberry32(54321)
    const same = Array.from({ length: 10 }, () => rng1() === rng2())
    expect(same.every(Boolean)).toBe(false)
  })

  it('produces values between 0 and 1', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const val = rng()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })
})

describe('getDailySeed', () => {
  it('returns a number in YYYYMMDD format', () => {
    const seed = getDailySeed()
    expect(seed).toBeGreaterThan(20260000)
    expect(seed).toBeLessThan(21000000)
  })

  it('uses 2026-02-09 as day 1 epoch', () => {
    expect(getDayNumberForSeed(20260209)).toBe(1)
    expect(getDayNumberForSeed(20260210)).toBe(2)
  })

  it('uses Pacific date for daily seed boundaries', () => {
    const beforePacificMidnight = Date.UTC(2026, 1, 10, 7, 59, 59) // 2026-02-09 23:59:59 PT
    const atPacificMidnight = Date.UTC(2026, 1, 10, 8, 0, 0) // 2026-02-10 00:00:00 PT

    expect(getDailySeed(beforePacificMidnight)).toBe(20260209)
    expect(getDailySeed(atPacificMidnight)).toBe(20260210)
  })

  it('computes time remaining to next Pacific day', () => {
    const atNoonPacific = Date.UTC(2026, 1, 9, 20, 0, 0) // 2026-02-09 12:00:00 PT
    expect(getMsUntilNextPacificDay(atNoonPacific)).toBe(43_200_000)

    const oneSecondBeforePacificMidnight = Date.UTC(2026, 1, 10, 7, 59, 59) // 23:59:59 PT
    expect(getMsUntilNextPacificDay(oneSecondBeforePacificMidnight)).toBe(1000)
  })
})
