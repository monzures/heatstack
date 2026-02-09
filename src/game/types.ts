export type GameMode = 'daily' | 'blitz'
export type GameStatus = 'menu' | 'playing' | 'finished'
export type Medal = 'None' | 'Bronze' | 'Silver' | 'Gold'
export type DailyModifierId = 'none' | 'heat_bleed' | 'no_rerolls' | 'surge_start'

export interface DieState {
  id: string
  letter: string
  locked: boolean
}

export interface WordRecord {
  word: string
  combo: number
  overlap: number
  scoreGain: number
  heatAfter: number
  multiplier: number
  rerollsLeft: number
  anchors: [string, string]
  submittedAtMs: number
}

export interface RunResult {
  mode: GameMode
  dayNumber: number | null
  seed: number
  dailyModifierId: DailyModifierId
  score: number
  wordsPlayed: number
  maxCombo: number
  maxHeat: number
  medal: Medal
  heatTrace: number[]
  topChain: string[]
  endedAtIso: string
}

export interface GameState {
  dice: DieState[]
  stageIds: string[]
  rerollsLeft: number
  dailyModifierId: DailyModifierId
  timeLeftMs: number
  rackAgeMs: number
  score: number
  combo: number
  maxCombo: number
  heat: number
  usedWords: string[]
  lastWord: string | null
  wordHistory: WordRecord[]
  anchors: [string, string] | null
  mode: GameMode
  status: GameStatus
  seed: number
  dayNumber: number | null
  recentRackSources: string[]
  result: RunResult | null
}

export const DICE_COUNT = 5
export const STARTING_REROLL_CHARGES = 4
export const DAILY_DURATION_MS = 75_000
export const BLITZ_DURATION_MS = 60_000
