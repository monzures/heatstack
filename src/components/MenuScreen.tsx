import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Github, Linkedin, Link2, MapPin, Share2, Trophy } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useStatsStore } from '@/store/statsStore'
import { getDailyModifierForSeed } from '@/game/modifiers'
import { getDailySeed, getDayNumberForSeed, getMsUntilNextPacificDay } from '@/game/rng'
import { generateShareText } from '@/game/share'
import type { RunResult } from '@/game/types'
import { Button } from './ui/button'
import { StatsModal } from './StatsModal'
import { ResultModal } from './ResultModal'

function formatCountdownMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function parseSeedFromDateString(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const seed = Number.parseInt(value.replaceAll('-', ''), 10)
  return Number.isFinite(seed) ? seed : null
}

export function MenuScreen() {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const init = useGameStore((s) => s.init)
  const wordsLoaded = useGameStore((s) => s.wordsLoaded)
  const startGame = useGameStore((s) => s.startGame)
  const showResultSnapshot = useGameStore((s) => s.showResultSnapshot)
  const refreshDailyLock = useGameStore((s) => s.refreshDailyLock)
  const setShowStats = useGameStore((s) => s.setShowStats)
  const dailyLockedToday = useGameStore((s) => s.dailyLockedToday)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled)
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled)
  const setHapticsEnabled = useGameStore((s) => s.setHapticsEnabled)
  const canPlayDaily = useStatsStore((s) => s.canPlayDaily)
  const lastDailyPlayedDate = useStatsStore((s) => s.lastDailyPlayedDate)
  const lastDailyScore = useStatsStore((s) => s.lastDailyScore)
  const lastDailyMedal = useStatsStore((s) => s.lastDailyMedal)
  const lastDailyResult = useStatsStore((s) => s.lastDailyResult)
  const bestBlitzScore = useStatsStore((s) => s.bestBlitzScore)
  const dailyStreak = useStatsStore((s) => s.dailyStreak)
  const todaysSeed = getDailySeed()
  const todaysModifier = getDailyModifierForSeed(todaysSeed)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now())
      refreshDailyLock()
    }, 1000)
    refreshDailyLock()
    return () => window.clearInterval(id)
  }, [refreshDailyLock])

  const dailyAvailable = canPlayDaily(todaysSeed) && !dailyLockedToday
  const msToNextDaily = useMemo(() => getMsUntilNextPacificDay(nowMs), [nowMs])
  const nextDailyCountdown = useMemo(() => formatCountdownMs(msToNextDaily), [msToNextDaily])
  const dailyCountdownLabel = dailyAvailable ? 'Next daily in (PT)' : 'Unlocks in (PT)'
  const dailyResultToShow = useMemo(() => {
    if (lastDailyResult) return lastDailyResult
    if (!lastDailyPlayedDate || lastDailyScore <= 0) return null
    const inferredSeed = parseSeedFromDateString(lastDailyPlayedDate) ?? todaysSeed
    return {
      mode: 'daily',
      dayNumber: getDayNumberForSeed(inferredSeed),
      seed: inferredSeed,
      dailyModifierId: getDailyModifierForSeed(inferredSeed).id,
      score: lastDailyScore,
      wordsPlayed: 0,
      maxCombo: 1,
      maxHeat: 0,
      medal: lastDailyMedal,
      heatTrace: [],
      topChain: [],
      endedAtIso: `${lastDailyPlayedDate}T00:00:00.000Z`,
    } satisfies RunResult
  }, [lastDailyPlayedDate, lastDailyMedal, lastDailyResult, lastDailyScore, todaysSeed])
  const showDailyActions = !dailyAvailable || Boolean(dailyResultToShow)

  async function handleShareResult(result: RunResult) {
    const shareText = generateShareText(result)
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
      }
      toast.success('Shared result copied')
    } catch {
      try {
        await navigator.clipboard.writeText(shareText)
        toast.success('Copied to clipboard')
      } catch {
        toast.error('Could not copy result')
      }
    }
  }

  return (
    <div className="relative z-10 flex-1 px-5 pt-10 pb-8 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="text-center"
      >
        <p className="font-micro text-[11px] uppercase text-white/55 font-semibold">Casual Word Reactor</p>
        <img
          src="/heatstack-logo.svg"
          alt="Heatstack"
          className="mx-auto mt-3 w-full max-w-[520px] sm:max-w-[560px] select-none pointer-events-none drop-shadow-[0_8px_28px_rgba(255,122,162,0.22)]"
        />
        <p className="mt-2 text-sm text-white/72 font-medium">
          Build a word chain, keep the reactor hot, and climb the combo.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 180, damping: 24 }}
        className="mt-10 grid gap-3"
      >
        <ModeCard
          title="Daily Reactor"
          subtitle={`75 seconds · 1 official run · ${todaysModifier.name}`}
          meta={dailyAvailable ? `Streak ${dailyStreak}` : `Locked today · ${lastDailyScore} pts`}
          countdownLabel={dailyCountdownLabel}
          countdown={nextDailyCountdown}
          actions={showDailyActions && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dailyResultToShow && showResultSnapshot(dailyResultToShow)}
                disabled={!dailyResultToShow}
                className="font-semibold text-[11px]"
              >
                <Trophy className="size-3.5" />
                {dailyResultToShow ? `Score ${dailyResultToShow.score}` : 'View Daily'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dailyResultToShow && void handleShareResult(dailyResultToShow)}
                disabled={!dailyResultToShow}
                className="font-semibold text-[11px]"
              >
                <Share2 className="size-3.5" />
                Share Daily
              </Button>
            </div>
          )}
          primaryLabel={dailyAvailable ? 'Play Daily' : 'Daily Complete'}
          disabled={!wordsLoaded || !dailyAvailable}
          onClick={() => startGame('daily')}
        />
        <ModeCard
          title="Blitz Reactor"
          subtitle="60 seconds · unlimited runs"
          meta={`Best ${bestBlitzScore} pts`}
          primaryLabel="Start Blitz"
          disabled={!wordsLoaded}
          onClick={() => startGame('blitz')}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-auto pt-7 grid gap-3"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-micro text-[11px] text-white/45 uppercase">
            Learn in 5s. Finish under 90s.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[11px] font-semibold text-white/65 hover:text-white transition-colors cursor-pointer"
            >
              Sound {soundEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className="text-[11px] font-semibold text-white/65 hover:text-white transition-colors cursor-pointer"
            >
              Haptics {hapticsEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="text-[11px] font-semibold text-white/65 hover:text-white transition-colors cursor-pointer"
            >
              Stats
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/12 bg-[linear-gradient(120deg,rgba(255,180,118,0.08),rgba(141,184,255,0.08))] px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md shadow-[0_10px_32px_rgba(11,17,36,0.35)]">
          <p className="text-sm sm:text-[15px] text-white/86 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>Crafted for your enjoyment by</span>
            <span className="font-semibold text-[#ffd8aa]">Tim Monzures</span>
            <span className="inline-flex items-center gap-1 text-white/82">
              in San Francisco
              <MapPin className="size-3.5" />
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-white/65">
            <SocialChip href="https://www.linkedin.com/in/tmonzures/" label="LinkedIn" icon={<Linkedin className="size-3.5" />} />
            <SocialChip href="https://x.com/phaxian" label="X" icon={<BrandXIcon />} />
            <SocialChip href="https://github.com/monzures" label="GitHub" icon={<Github className="size-3.5" />} />
            <SocialChip href="https://github.com/monzures/heatstack" label="Source" icon={<Link2 className="size-3.5" />} />
            <span className="text-white/40">© 2026</span>
          </div>
        </div>
      </motion.div>

      {!wordsLoaded && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      <StatsModal />
      <ResultModal />
    </div>
  )
}

function ModeCard(props: {
  title: string
  subtitle: string
  meta: string
  countdownLabel?: string
  countdown?: string
  actions?: ReactNode
  primaryLabel: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.035] p-4 sm:p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-brand text-xl font-extrabold tracking-[-0.02em]">{props.title}</p>
          <p className="font-micro text-[11px] text-white/55 mt-1">{props.subtitle}</p>
        </div>
        <span className="font-micro text-[11px] text-[#ffad67] font-semibold">{props.meta}</span>
      </div>
      <Button
        disabled={props.disabled}
        onClick={props.onClick}
        size="lg"
        className="w-full mt-4"
      >
        {props.primaryLabel}
      </Button>
      {props.countdown && (
        <div className="mt-3 rounded-lg border border-white/12 bg-black/15 px-3 py-2 flex items-center justify-between gap-3">
          <span className="font-micro text-[10px] text-white/52 uppercase">
            {props.countdownLabel}
          </span>
          <span className="font-numeric text-sm sm:text-[15px] font-black tabular-nums text-[#b8ddff]">
            {props.countdown}
          </span>
        </div>
      )}
      {props.actions}
    </div>
  )
}

function SocialChip(props: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-black/20 px-2 py-1 text-white/72 hover:text-white hover:border-white/25 transition-colors"
    >
      {props.icon}
      {props.label}
    </a>
  )
}

function BrandXIcon() {
  return <span className="font-brand text-[13px] leading-none font-bold">x</span>
}
