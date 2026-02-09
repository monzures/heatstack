import { describe, it, expect } from 'vitest'
import {
  HEAT_START,
  applyHeatGain,
  clampHeat,
  decayHeat,
  getHeatGainForCombo,
  getHeatMultiplier,
} from '../heat.ts'

describe('heat system', () => {
  it('starts at configured baseline', () => {
    expect(HEAT_START).toBe(25)
  })

  it('decays faster in hotter tiers', () => {
    expect(decayHeat(25, 1000)).toBe(22)
    expect(decayHeat(60, 1000)).toBe(56.4)
    expect(decayHeat(80, 1000)).toBe(75.6)
  })

  it('supports external decay multipliers (daily modifiers)', () => {
    expect(decayHeat(50, 1000, 1.2)).toBeCloseTo(45.68, 5)
  })

  it('clamps heat into 0..100', () => {
    expect(clampHeat(-10)).toBe(0)
    expect(clampHeat(50)).toBe(50)
    expect(clampHeat(120)).toBe(100)
  })

  it('scales gain with combo and caps bonus at +16', () => {
    expect(getHeatGainForCombo(1)).toBe(13)
    expect(getHeatGainForCombo(2)).toBe(16)
    expect(getHeatGainForCombo(6)).toBe(28)
    expect(getHeatGainForCombo(10)).toBe(29)
  })

  it('applies gain and clamps to max', () => {
    expect(applyHeatGain(30, 1)).toBe(43)
    expect(applyHeatGain(95, 6)).toBe(100)
  })

  it('returns expected multipliers by tier', () => {
    expect(getHeatMultiplier(0)).toBe(1)
    expect(getHeatMultiplier(24)).toBe(1)
    expect(getHeatMultiplier(25)).toBe(1.25)
    expect(getHeatMultiplier(50)).toBe(1.55)
    expect(getHeatMultiplier(75)).toBe(1.9)
  })
})
