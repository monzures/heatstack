import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Medal, RunResult } from '@/game/types.ts'
import { getPacificDateString } from '@/game/rng.ts'

interface StatsState {
  gamesPlayed: number
  bestBlitzScore: number
  bestDailyScore: number
  dailyStreak: number
  maxDailyStreak: number
  lastDailyPlayedDate: string | null
  lastDailyScore: number
  lastDailyMedal: Medal
  lastDailyResult: RunResult | null
  bronzeMedals: number
  silverMedals: number
  goldMedals: number
  totalWordsPlayed: number
  playedDailySeeds: number[]

  recordRun: (result: RunResult) => void
  canPlayDaily: (seed?: number) => boolean
}

function diffDaysUtc(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime()
  const b = new Date(`${to}T00:00:00Z`).getTime()
  return Math.floor((b - a) / 86_400_000)
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      gamesPlayed: 0,
      bestBlitzScore: 0,
      bestDailyScore: 0,
      dailyStreak: 0,
      maxDailyStreak: 0,
      lastDailyPlayedDate: null,
      lastDailyScore: 0,
      lastDailyMedal: 'None',
      lastDailyResult: null,
      bronzeMedals: 0,
      silverMedals: 0,
      goldMedals: 0,
      totalWordsPlayed: 0,
      playedDailySeeds: [],

      recordRun: (result) => {
        const s = get()

        const updates: Partial<StatsState> = {
          gamesPlayed: s.gamesPlayed + 1,
          totalWordsPlayed: s.totalWordsPlayed + result.wordsPlayed,
        }

        if (result.mode === 'blitz') {
          updates.bestBlitzScore = Math.max(s.bestBlitzScore, result.score)
        }

        if (result.mode === 'daily') {
          const today = getPacificDateString()
          if (s.lastDailyPlayedDate !== today) {
            const streak = s.lastDailyPlayedDate && diffDaysUtc(s.lastDailyPlayedDate, today) === 1
              ? s.dailyStreak + 1
              : 1
            updates.dailyStreak = streak
            updates.maxDailyStreak = Math.max(s.maxDailyStreak, streak)
          }

          updates.lastDailyPlayedDate = today
          updates.lastDailyScore = result.score
          updates.lastDailyMedal = result.medal
          updates.lastDailyResult = {
            ...result,
            heatTrace: [...result.heatTrace],
            topChain: [...result.topChain],
          }
          if (result.medal === 'Bronze') {
            updates.bronzeMedals = s.bronzeMedals + 1
          }
          if (result.medal === 'Silver') {
            updates.silverMedals = s.silverMedals + 1
          }
          if (result.medal === 'Gold') {
            updates.goldMedals = s.goldMedals + 1
          }
          updates.bestDailyScore = Math.max(s.bestDailyScore, result.score)
          const nextSeeds = [...s.playedDailySeeds.filter((seed) => seed !== result.seed), result.seed]
          updates.playedDailySeeds = nextSeeds.slice(-120)
        }

        set(updates)
      },

      canPlayDaily: (seed) => {
        const s = get()
        if (typeof seed === 'number' && s.playedDailySeeds.includes(seed)) return false
        return s.lastDailyPlayedDate !== getPacificDateString()
      },
    }),
    {
      name: 'heatstack-stats',
    }
  )
)
