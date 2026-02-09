import { clampHeat, HEAT_START } from './heat.ts'
import type { DailyModifierId } from './types.ts'

export interface DailyModifier {
  id: DailyModifierId
  name: string
  description: string
}

const DAILY_MODIFIERS: DailyModifier[] = [
  {
    id: 'heat_bleed',
    name: 'Heat Bleed +20%',
    description: 'Reactor heat drains faster all run.',
  },
  {
    id: 'no_rerolls',
    name: 'No Rerolls',
    description: 'Re-roll and Auto Fill are disabled today.',
  },
  {
    id: 'surge_start',
    name: 'Surge Start',
    description: 'Start with +20 heat for an early combo push.',
  },
]

const NO_MODIFIER: DailyModifier = {
  id: 'none',
  name: 'No Modifier',
  description: 'Standard rules.',
}

const modifierById: Record<DailyModifierId, DailyModifier> = {
  none: NO_MODIFIER,
  heat_bleed: DAILY_MODIFIERS[0],
  no_rerolls: DAILY_MODIFIERS[1],
  surge_start: DAILY_MODIFIERS[2],
}

export function getModifierById(id: DailyModifierId): DailyModifier {
  return modifierById[id]
}

export function getDailyModifierForSeed(seed: number): DailyModifier {
  const mixed = mix32(seed ^ 0x9e3779b9)
  const idx = mixed % DAILY_MODIFIERS.length
  return DAILY_MODIFIERS[idx] ?? DAILY_MODIFIERS[0]
}

function mix32(value: number): number {
  let x = value | 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d)
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b)
  x ^= x >>> 16
  return x >>> 0
}

export function applyStartHeatModifier(heat: number, modifierId: DailyModifierId): number {
  if (modifierId === 'surge_start') {
    return clampHeat(heat + 20)
  }
  return heat
}

export function getHeatDecayMultiplier(modifierId: DailyModifierId): number {
  if (modifierId === 'heat_bleed') return 1.2
  return 1
}

export function getStartingRerollCharges(defaultCharges: number, modifierId: DailyModifierId): number {
  if (modifierId === 'no_rerolls') return 0
  return defaultCharges
}

export function isRerollDisabled(modifierId: DailyModifierId): boolean {
  return modifierId === 'no_rerolls'
}

export function getDefaultHeatStartForModifier(modifierId: DailyModifierId): number {
  return applyStartHeatModifier(HEAT_START, modifierId)
}
