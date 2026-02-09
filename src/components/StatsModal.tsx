import type { ReactNode } from 'react'
import { CalendarDays, Flame, Medal, Rocket, Sigma, Trophy } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useStatsStore } from '@/store/statsStore'
import { Dialog, DialogClose, DialogTitle } from './ui/dialog'

const MEDAL_STYLES = {
  None: 'text-white/70 border-white/12 bg-white/[0.04]',
  Bronze: 'text-[#e7a165] border-[#e7a165]/35 bg-[#e7a165]/12',
  Silver: 'text-[#d5def7] border-[#d5def7]/35 bg-[#d5def7]/12',
  Gold: 'text-[#ffd972] border-[#ffd972]/35 bg-[#ffd972]/14',
} as const

export function StatsModal() {
  const show = useGameStore((s) => s.showStats)
  const setShow = useGameStore((s) => s.setShowStats)
  const stats = useStatsStore()

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogClose onClose={() => setShow(false)} />
      <DialogTitle>Reactor Stats</DialogTitle>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Runs" value={stats.gamesPlayed} icon={<Rocket className="size-3.5" />} />
        <Stat label="Best Blitz" value={stats.bestBlitzScore} icon={<Trophy className="size-3.5" />} />
        <Stat label="Best Daily" value={stats.bestDailyScore} icon={<Medal className="size-3.5" />} />
        <Stat label="Daily Streak" value={stats.dailyStreak} icon={<Flame className="size-3.5" />} />
        <Stat label="Best Streak" value={stats.maxDailyStreak} icon={<Flame className="size-3.5" />} />
        <Stat label="Words Played" value={stats.totalWordsPlayed} icon={<Sigma className="size-3.5" />} />
      </div>

      <section className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/50 font-semibold">Medal Cabinet</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <MedalChip label="Gold" value={stats.goldMedals} tone="Gold" />
          <MedalChip label="Silver" value={stats.silverMedals} tone="Silver" />
          <MedalChip label="Bronze" value={stats.bronzeMedals} tone="Bronze" />
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/50 font-semibold">Last Daily</p>
        {stats.lastDailyPlayedDate ? (
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-white/75">
              <CalendarDays className="size-3.5" />
              {stats.lastDailyPlayedDate}
            </span>
            <span className="inline-flex items-center gap-1.5 text-white/90 font-semibold">
              <Trophy className="size-3.5 text-[#ffd79f]" />
              {stats.lastDailyScore} pts
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border text-xs font-semibold ${MEDAL_STYLES[stats.lastDailyMedal]}`}>
              <Medal className="size-3.5" />
              {stats.lastDailyMedal}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-white/70">No daily run yet.</p>
        )}
      </section>
    </Dialog>
  )
}

function Stat(props: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <div className="bg-[var(--bg-primary)]/55 rounded-xl p-3 text-center border border-white/10">
      <div className="inline-flex items-center justify-center size-6 rounded-full bg-white/[0.07] text-white/75 mb-1">
        {props.icon}
      </div>
      <div className="text-xl font-bold tabular-nums">{props.value}</div>
      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">{props.label}</div>
    </div>
  )
}

function MedalChip(props: { label: string; value: number; tone: keyof typeof MEDAL_STYLES }) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 text-center ${MEDAL_STYLES[props.tone]}`}>
      <div className="inline-flex items-center justify-center size-5">
        <Medal className="size-4" />
      </div>
      <p className="text-base font-black tabular-nums mt-0.5">{props.value}</p>
      <p className="text-[10px] uppercase tracking-[0.14em] opacity-85">{props.label}</p>
    </div>
  )
}
