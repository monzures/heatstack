export const HEAT_MIN = 0
export const HEAT_MAX = 100
export const HEAT_START = 25
export const HEAT_DECAY_PER_SEC = 3

export function clampHeat(heat: number): number {
  return Math.max(HEAT_MIN, Math.min(HEAT_MAX, heat))
}

export function decayHeat(currentHeat: number, elapsedMs: number, decayMultiplier = 1): number {
  const decayPerSec = currentHeat >= 75
    ? 4.4
    : currentHeat >= 50
      ? 3.6
      : currentHeat >= 25
        ? 3
        : 2.6
  const decayed = currentHeat - (decayPerSec * decayMultiplier * elapsedMs) / 1000
  return clampHeat(decayed)
}

export function getHeatMultiplier(heat: number): number {
  if (heat >= 75) return 1.9
  if (heat >= 50) return 1.55
  if (heat >= 25) return 1.25
  return 1
}

export function getHeatGainForCombo(combo: number): number {
  return 13 + Math.min(16, 3 * Math.max(0, combo - 1))
}

export function applyHeatGain(currentHeat: number, combo: number): number {
  return clampHeat(currentHeat + getHeatGainForCombo(combo))
}

export function heatToColor(heat: number): string {
  if (heat >= 90) return '#fff3db'
  if (heat >= 75) return '#ff8a3c'
  if (heat >= 50) return '#ff5f45'
  if (heat >= 25) return '#ff3f7a'
  return '#55a3ff'
}
