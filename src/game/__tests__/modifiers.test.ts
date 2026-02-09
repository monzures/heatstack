import { describe, expect, it } from 'vitest'
import {
  applyStartHeatModifier,
  getDailyModifierForSeed,
  getHeatDecayMultiplier,
  getModifierById,
  getStartingRerollCharges,
  isRerollDisabled,
} from '../modifiers.ts'

describe('daily modifiers', () => {
  it('is deterministic for a given seed', () => {
    expect(getDailyModifierForSeed(20260209).id).toBe(getDailyModifierForSeed(20260209).id)
  })

  it('returns metadata for known modifier ids', () => {
    expect(getModifierById('heat_bleed').name).toContain('Heat Bleed')
    expect(getModifierById('none').name).toBe('No Modifier')
  })

  it('applies modifier effects correctly', () => {
    expect(getHeatDecayMultiplier('none')).toBe(1)
    expect(getHeatDecayMultiplier('heat_bleed')).toBe(1.2)
    expect(getStartingRerollCharges(4, 'none')).toBe(4)
    expect(getStartingRerollCharges(4, 'no_rerolls')).toBe(0)
    expect(isRerollDisabled('no_rerolls')).toBe(true)
    expect(isRerollDisabled('surge_start')).toBe(false)
    expect(applyStartHeatModifier(25, 'surge_start')).toBe(45)
  })
})
