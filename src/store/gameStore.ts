import { create } from 'zustand'
import { toast } from 'sonner'
import type { DieState, GameMode, GameState, RunResult } from '@/game/types.ts'
import { BLITZ_DURATION_MS, DAILY_DURATION_MS, DICE_COUNT, STARTING_REROLL_CHARGES } from '@/game/types.ts'
import { mulberry32, getDailySeed, getDayNumberForSeed, getPacificDateString, type RNG } from '@/game/rng.ts'
import { getAnagramsForLetters, getRandomPlayableWord, getRandomWordWithAnchors, isValidWord, loadWordLists } from '@/game/words.ts'
import { createDiceFromWord, shuffleDice } from '@/game/dice.ts'
import { HEAT_START, applyHeatGain, clampHeat, decayHeat } from '@/game/heat.ts'
import { chooseNextRackSource, getNextCombo, getTopChain, trimRecentRackSources } from '@/game/chain.ts'
import { calculateWordScore, getDailyMedal } from '@/game/scoring.ts'
import { getDailyModifierForSeed, getHeatDecayMultiplier, getModifierById, getStartingRerollCharges, getDefaultHeatStartForModifier, isRerollDisabled } from '@/game/modifiers.ts'
import { isHapticsSupported, playTone, triggerHaptic } from '@/lib/feedback.ts'
import { useStatsStore } from './statsStore.ts'

interface GameStore extends GameState {
  wordsLoaded: boolean
  showResult: boolean
  showStats: boolean
  showCoachmarks: boolean
  rng: RNG | null
  soundEnabled: boolean
  hapticsEnabled: boolean
  dailyLockedToday: boolean

  init: () => Promise<void>
  goToMenu: () => void
  startGame: (mode: GameMode) => void
  tick: (elapsedMs: number) => void
  toggleStageDie: (index: number) => void
  stageLetter: (letter: string) => void
  popStage: () => void
  clearStage: () => void
  autoFillStage: () => void
  shuffleRack: () => void
  rerollRack: () => void
  submitWord: () => void
  finishRun: () => void
  dismissCoachmarks: () => void
  setShowResult: (value: boolean) => void
  setShowStats: (value: boolean) => void
  setSoundEnabled: (value: boolean) => void
  setHapticsEnabled: (value: boolean) => void
  showResultSnapshot: (result: RunResult) => void
  refreshDailyLock: () => void
}

const COACHMARK_KEY = 'heatstack-coachmarks-seen-v1'
const SOUND_KEY = 'heatstack-sound-enabled-v1'
const HAPTICS_KEY = 'heatstack-haptics-enabled-v1'
const DAILY_LOCK_KEY = 'heatstack-daily-lock-v1'

function initialGameState(): GameState {
  return {
    dice: Array.from({ length: DICE_COUNT }, (_, i) => ({
      id: `die-${i}`,
      letter: '',
      locked: false,
    })),
    stageIds: [],
    rerollsLeft: STARTING_REROLL_CHARGES,
    dailyModifierId: 'none',
    timeLeftMs: 0,
    rackAgeMs: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    heat: HEAT_START,
    usedWords: [],
    lastWord: null,
    wordHistory: [],
    anchors: null,
    mode: 'daily',
    status: 'menu',
    seed: 0,
    dayNumber: null,
    recentRackSources: [],
    result: null,
  }
}

function getDurationForMode(mode: GameMode): number {
  return mode === 'daily' ? DAILY_DURATION_MS : BLITZ_DURATION_MS
}

function stageWordFromIds(stageIds: string[], dice: DieState[]): string {
  if (stageIds.length === 0) return ''
  const byId = new Map(dice.map((die) => [die.id, die.letter]))
  return stageIds.map((id) => byId.get(id) ?? '').join('')
}

function stageIdsForWord(word: string, dice: DieState[]): string[] | null {
  const used = new Set<string>()
  const ids: string[] = []
  for (const letter of word.toUpperCase()) {
    const match = dice.find((die) => die.letter === letter && !used.has(die.id))
    if (!match) return null
    ids.push(match.id)
    used.add(match.id)
  }
  return ids
}

function readBooleanSetting(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return raw === '1'
  } catch {
    return fallback
  }
}

function writeBooleanSetting(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // ignore
  }
}

function getTodayDailyLock(): boolean {
  try {
    return localStorage.getItem(DAILY_LOCK_KEY) === getPacificDateString()
  } catch {
    return false
  }
}

function lockDailyForToday(): void {
  try {
    localStorage.setItem(DAILY_LOCK_KEY, getPacificDateString())
  } catch {
    // ignore
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialGameState(),
  wordsLoaded: false,
  showResult: false,
  showStats: false,
  showCoachmarks: false,
  rng: null,
  soundEnabled: true,
  hapticsEnabled: true,
  dailyLockedToday: false,

  init: async () => {
    await loadWordLists()
    const supportsHaptics = isHapticsSupported()
    set({
      wordsLoaded: true,
      showCoachmarks: !readBooleanSetting(COACHMARK_KEY, false),
      soundEnabled: readBooleanSetting(SOUND_KEY, true),
      hapticsEnabled: supportsHaptics ? readBooleanSetting(HAPTICS_KEY, true) : false,
      dailyLockedToday: getTodayDailyLock(),
    })
  },

  goToMenu: () => {
    set({
      ...initialGameState(),
      wordsLoaded: get().wordsLoaded,
      showCoachmarks: get().showCoachmarks,
      showStats: false,
      showResult: false,
      rng: null,
      soundEnabled: get().soundEnabled,
      hapticsEnabled: get().hapticsEnabled,
      dailyLockedToday: getTodayDailyLock(),
    })
  },

  startGame: (mode) => {
    const seed = mode === 'daily' ? getDailySeed() : Date.now()
    if (mode === 'daily' && (getTodayDailyLock() || !useStatsStore.getState().canPlayDaily(seed))) {
      set({ dailyLockedToday: true })
      toast.error('Daily already played today')
      return
    }

    const rng = mulberry32(seed)
    const dayNumber = mode === 'daily' ? getDayNumberForSeed(seed) : null
    const dailyModifierId = mode === 'daily'
      ? getDailyModifierForSeed(seed).id
      : 'none'

    const { sourceWord } = chooseNextRackSource({
      previousWord: null,
      rng,
      recentRackSources: [],
    })

    if (mode === 'daily') {
      lockDailyForToday()
    }

    set({
      ...initialGameState(),
      mode,
      status: 'playing',
      seed,
      dayNumber,
      rng,
      dice: createDiceFromWord(sourceWord, rng),
      recentRackSources: [sourceWord],
      timeLeftMs: getDurationForMode(mode),
      heat: getDefaultHeatStartForModifier(dailyModifierId),
      rerollsLeft: getStartingRerollCharges(STARTING_REROLL_CHARGES, dailyModifierId),
      dailyModifierId,
      dailyLockedToday: mode === 'daily' ? true : get().dailyLockedToday,
      soundEnabled: get().soundEnabled,
      hapticsEnabled: get().hapticsEnabled,
      wordsLoaded: get().wordsLoaded,
      showCoachmarks: get().showCoachmarks,
    })

    playTone('start', get().soundEnabled)
  },

  tick: (elapsedMs) => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.showCoachmarks) return
    if (elapsedMs <= 0) return

    const nextTime = Math.max(0, state.timeLeftMs - elapsedMs)
    const nextHeat = decayHeat(state.heat, elapsedMs, getHeatDecayMultiplier(state.dailyModifierId))

    set({
      timeLeftMs: nextTime,
      heat: nextHeat,
      rackAgeMs: Math.min(120_000, state.rackAgeMs + elapsedMs),
    })

    if (nextTime <= 0) {
      get().finishRun()
    }
  },

  toggleStageDie: (index) => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.showCoachmarks) return
    const die = state.dice[index]
    if (!die) return

    const existingIdx = state.stageIds.indexOf(die.id)
    if (existingIdx >= 0) {
      const next = state.stageIds.filter((id) => id !== die.id)
      set({ stageIds: next })
      return
    }

    if (state.stageIds.length >= state.dice.length) return
    const next = [...state.stageIds, die.id]
    set({ stageIds: next })
    playTone('tap', state.soundEnabled)
    triggerHaptic(8, state.hapticsEnabled)
  },

  stageLetter: (letter) => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.showCoachmarks) return

    const upper = letter.toUpperCase()
    if (!/^[A-Z]$/.test(upper)) return
    if (state.stageIds.length >= state.dice.length) return

    const used = new Set(state.stageIds)
    const nextDie = state.dice.find((die) => die.letter === upper && !used.has(die.id))
    if (!nextDie) return

    set({ stageIds: [...state.stageIds, nextDie.id] })
    playTone('tap', state.soundEnabled)
    triggerHaptic(8, state.hapticsEnabled)
  },

  popStage: () => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.showCoachmarks) return
    if (state.stageIds.length === 0) return

    set({ stageIds: state.stageIds.slice(0, -1) })
    playTone('tap', state.soundEnabled)
    triggerHaptic(6, state.hapticsEnabled)
  },

  clearStage: () => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.showCoachmarks) return
    set({ stageIds: [] })
  },

  autoFillStage: () => {
    const state = get()
    if (state.status !== 'playing') return
    if (state.showCoachmarks) return
    if (isRerollDisabled(state.dailyModifierId)) {
      toast.error(`${getModifierById(state.dailyModifierId).name}: Auto Fill disabled`)
      playTone('error', state.soundEnabled)
      return
    }
    if (state.rerollsLeft < 2) {
      toast.error('Auto Fill needs 2 reroll charges')
      playTone('error', state.soundEnabled)
      return
    }
    const candidates = getAnagramsForLetters(state.dice.map((die) => die.letter))
    const candidate = candidates.find((word) => !state.usedWords.includes(word.toLowerCase())) ?? candidates[0]
    if (!candidate) return
    const ids = stageIdsForWord(candidate, state.dice)
    if (!ids) return
    set({
      stageIds: ids,
      rerollsLeft: state.rerollsLeft - 2,
      heat: clampHeat(state.heat - 12),
    })
    playTone('tap', state.soundEnabled)
    triggerHaptic(10, state.hapticsEnabled)
  },

  shuffleRack: () => {
    const state = get()
    if (state.status !== 'playing' || !state.rng) return
    if (state.showCoachmarks) return
    set({
      dice: shuffleDice(state.dice, state.rng),
      stageIds: [],
      rackAgeMs: 0,
    })
    playTone('tap', state.soundEnabled)
    triggerHaptic(8, state.hapticsEnabled)
  },

  rerollRack: () => {
    const state = get()
    if (state.status !== 'playing' || !state.rng) return
    if (state.showCoachmarks) return
    if (isRerollDisabled(state.dailyModifierId)) {
      toast.error(`${getModifierById(state.dailyModifierId).name}: Re-roll disabled`)
      playTone('error', state.soundEnabled)
      return
    }
    if (state.rerollsLeft <= 0) return

    const source = state.anchors
      ? getRandomWordWithAnchors({
        a: state.anchors[0],
        b: state.anchors[1],
        rng: state.rng,
        exclude: state.recentRackSources,
      })
      : getRandomPlayableWord(state.rng)

    set({
      dice: createDiceFromWord(source, state.rng),
      rerollsLeft: state.rerollsLeft - 1,
      stageIds: [],
      rackAgeMs: 0,
      recentRackSources: trimRecentRackSources([...state.recentRackSources, source], 10),
    })
    playTone('tap', state.soundEnabled)
    triggerHaptic(10, state.hapticsEnabled)
  },

  submitWord: () => {
    const state = get()
    if (state.status !== 'playing' || !state.rng) return
    if (state.showCoachmarks) return
    if (state.timeLeftMs <= 0) {
      get().finishRun()
      return
    }

    if (state.stageIds.length !== state.dice.length) {
      toast.error('Fill all 5 stage slots first')
      playTone('error', state.soundEnabled)
      triggerHaptic([12, 18, 12], state.hapticsEnabled)
      return
    }

    const currentWord = stageWordFromIds(state.stageIds, state.dice).toLowerCase()
    if (!isValidWord(currentWord)) {
      toast.error('Not in the playable list')
      playTone('error', state.soundEnabled)
      triggerHaptic([12, 18, 12], state.hapticsEnabled)
      return
    }

    if (state.usedWords.includes(currentWord)) {
      toast.error('Word already used in this run')
      playTone('error', state.soundEnabled)
      triggerHaptic([12, 18, 12], state.hapticsEnabled)
      return
    }

    const upperWord = currentWord.toUpperCase()
    const { combo, overlap } = getNextCombo({
      previousWord: state.lastWord,
      previousCombo: state.combo,
      nextWord: upperWord,
    })

    const nextHeat = applyHeatGain(state.heat, combo)
    const scoreCalc = calculateWordScore({
      word: upperWord,
      rerollsLeft: state.rerollsLeft,
      heat: nextHeat,
      combo,
      rackAgeMs: state.rackAgeMs,
    })

    const { sourceWord, anchors } = chooseNextRackSource({
      previousWord: upperWord,
      rng: state.rng,
      recentRackSources: state.recentRackSources,
    })

    const wordRecord = {
      word: upperWord,
      combo,
      overlap,
      scoreGain: scoreCalc.scoreGain,
      heatAfter: nextHeat,
      multiplier: scoreCalc.multiplier,
      rerollsLeft: state.rerollsLeft,
      anchors: anchors ?? ['A', 'E'],
      submittedAtMs: Date.now(),
    }

    set({
      score: state.score + scoreCalc.scoreGain,
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      heat: nextHeat,
      usedWords: [...state.usedWords, currentWord],
      lastWord: upperWord,
      wordHistory: [...state.wordHistory, wordRecord],
      anchors,
      dice: createDiceFromWord(sourceWord, state.rng),
      stageIds: [],
      rackAgeMs: 0,
      recentRackSources: trimRecentRackSources([...state.recentRackSources, sourceWord], 10),
    })

    playTone('submit', state.soundEnabled)
    triggerHaptic(combo >= 4 ? [14, 12, 18] : 12, state.hapticsEnabled)
  },

  finishRun: () => {
    const state = get()
    if (state.status !== 'playing') return

    const result: RunResult = {
      mode: state.mode,
      dayNumber: state.dayNumber,
      seed: state.seed,
      dailyModifierId: state.dailyModifierId,
      score: state.score,
      wordsPlayed: state.wordHistory.length,
      maxCombo: state.maxCombo,
      maxHeat: Math.max(
        state.heat,
        ...state.wordHistory.map((entry) => entry.heatAfter),
        getDefaultHeatStartForModifier(state.dailyModifierId),
      ),
      medal: state.mode === 'daily' ? getDailyMedal(state.score) : 'None',
      heatTrace: state.wordHistory.map((entry) => entry.heatAfter),
      topChain: getTopChain(state.wordHistory),
      endedAtIso: new Date().toISOString(),
    }

    set({
      status: 'finished',
      timeLeftMs: 0,
      result,
      showResult: true,
      stageIds: [],
    })

    useStatsStore.getState().recordRun(result)
    playTone('finish', state.soundEnabled)
    triggerHaptic([24, 40, 24], state.hapticsEnabled)
  },

  dismissCoachmarks: () => {
    writeBooleanSetting(COACHMARK_KEY, true)
    set({ showCoachmarks: false })
  },

  setShowResult: (value) => set({ showResult: value }),
  setShowStats: (value) => set({ showStats: value }),

  setSoundEnabled: (value) => {
    writeBooleanSetting(SOUND_KEY, value)
    set({ soundEnabled: value })
  },

  setHapticsEnabled: (value) => {
    if (value && !isHapticsSupported()) {
      writeBooleanSetting(HAPTICS_KEY, false)
      set({ hapticsEnabled: false })
      toast.error('Haptics are not available on this browser')
      return
    }
    writeBooleanSetting(HAPTICS_KEY, value)
    set({ hapticsEnabled: value })
  },

  showResultSnapshot: (result) => {
    set({
      result: {
        ...result,
        heatTrace: [...result.heatTrace],
        topChain: [...result.topChain],
      },
      showResult: true,
    })
  },

  refreshDailyLock: () => {
    set({ dailyLockedToday: getTodayDailyLock() })
  },
}))
