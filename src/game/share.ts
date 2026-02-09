import type { RunResult } from './types.ts'
import { getModifierById } from './modifiers.ts'

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

export function toSparkline(values: number[]): string {
  if (values.length === 0) return '▁'
  return values
    .map((value) => {
      const idx = Math.round((Math.max(0, Math.min(100, value)) / 100) * (SPARK_CHARS.length - 1))
      return SPARK_CHARS[idx]
    })
    .join('')
}

function hashFNV1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function createVerificationToken(result: RunResult): string {
  const payload = [
    result.seed,
    result.dailyModifierId,
    result.score,
    result.wordsPlayed,
    result.maxCombo,
    Math.round(result.maxHeat),
  ].join(':')
  return `HS-${hashFNV1a(payload).toString(36).toUpperCase().slice(0, 6)}`
}

export function generateShareText(result: RunResult): string {
  const modeLabel = result.mode === 'daily'
    ? `Daily #${result.dayNumber ?? '-'}`
    : 'Blitz'
  const medalLabel = result.medal === 'None' ? 'No Medal' : `${result.medal} Medal`
  const topChain = result.topChain.length > 0 ? result.topChain.join(' -> ') : 'No chain'
  const heatLine = toSparkline(result.heatTrace)
  const modifier = getModifierById(result.dailyModifierId)
  const challenge = result.mode === 'daily'
    ? `Challenge: Beat ${result.score} on ${modeLabel}.`
    : `Challenge: Beat ${result.score} in 60s Blitz.`
  const token = createVerificationToken(result)

  return [
    `HEATSTACK ${modeLabel}`,
    `Score ${result.score} | Combo x${result.maxCombo} | ${medalLabel}`,
    `Twist: ${modifier.name}`,
    `Heat ${heatLine}`,
    `Top Chain: ${topChain}`,
    challenge,
    `Verify ${token}`,
    'Play: https://heatstack.pages.dev',
  ].join('\n')
}
