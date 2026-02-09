import { describe, expect, it } from 'vitest'
import { createVerificationToken, generateShareText, toSparkline } from '../share.ts'
import type { RunResult } from '../types.ts'

describe('share format', () => {
  it('builds compact sparkline', () => {
    expect(toSparkline([0, 25, 50, 75, 100])).toBe('▁▃▅▆█')
  })

  it('includes score narrative and no Wordle grid rows', () => {
    const result: RunResult = {
      mode: 'daily',
      dayNumber: 7,
      seed: 20260215,
      dailyModifierId: 'heat_bleed',
      score: 2450,
      wordsPlayed: 10,
      maxCombo: 5,
      maxHeat: 92,
      medal: 'Silver',
      heatTrace: [22, 44, 68, 90],
      topChain: ['CRANE', 'TRACE', 'CLEAR'],
      endedAtIso: '2026-02-15T12:00:00.000Z',
    }

    const text = generateShareText(result)
    expect(text).toContain('Score 2450')
    expect(text).toContain('Combo x5')
    expect(text).toContain('Twist: Heat Bleed +20%')
    expect(text).toContain('Top Chain: CRANE -> TRACE -> CLEAR')
    expect(text).toContain('Challenge: Beat 2450 on Daily #7.')
    expect(text).toContain('Verify HS-')
    expect(text).not.toContain('🟩')
    expect(text).not.toContain('⬛')
  })

  it('creates stable verification token for the same result', () => {
    const result: RunResult = {
      mode: 'blitz',
      dayNumber: null,
      seed: 20260215,
      dailyModifierId: 'none',
      score: 1800,
      wordsPlayed: 8,
      maxCombo: 4,
      maxHeat: 88,
      medal: 'None',
      heatTrace: [22, 44, 68, 88],
      topChain: ['CRANE', 'TRACE'],
      endedAtIso: '2026-02-15T12:00:00.000Z',
    }

    expect(createVerificationToken(result)).toBe(createVerificationToken(result))
  })
})
