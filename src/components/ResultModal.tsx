import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Flame, Medal, Sigma, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useGameStore } from '@/store/gameStore'
import { generateShareText, toSparkline, createVerificationToken } from '@/game/share'
import { getModifierById } from '@/game/modifiers'
import { Dialog, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

const MEDAL_STYLES = {
  None: 'text-white/75 border-white/12 bg-white/[0.04]',
  Bronze: 'text-[#e7a165] border-[#e7a165]/35 bg-[#e7a165]/12',
  Silver: 'text-[#d5def7] border-[#d5def7]/35 bg-[#d5def7]/12',
  Gold: 'text-[#ffd972] border-[#ffd972]/35 bg-[#ffd972]/14',
} as const

export function ResultModal() {
  const result = useGameStore((s) => s.result)
  const showResult = useGameStore((s) => s.showResult)
  const setShowResult = useGameStore((s) => s.setShowResult)
  const startGame = useGameStore((s) => s.startGame)
  const goToMenu = useGameStore((s) => s.goToMenu)

  if (!result) return null

  const spark = toSparkline(result.heatTrace)
  const shareText = generateShareText(result)
  const modifier = getModifierById(result.dailyModifierId)
  const verificationToken = createVerificationToken(result)

  async function handleShare() {
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
    <Dialog open={showResult} onOpenChange={setShowResult}>
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
          {result.mode === 'daily' ? `Daily #${result.dayNumber}` : 'Blitz'}
        </p>
        <DialogTitle className="text-center mt-1 mb-1">Run Complete</DialogTitle>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd79f]/35 bg-[#ffd79f]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#ffd79f]">
          <Trophy className="size-3.5" />
          Final Score
        </p>
        <p className="mt-1 text-5xl font-black tabular-nums tracking-tight text-[#ffd9a8]">
          {result.score}
        </p>
        <p className="text-xs text-white/65">Keep the chain hot.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <Stat label="Words" value={result.wordsPlayed} icon={<Sigma className="size-3.5" />} />
        <Stat label="Max Combo" value={`x${result.maxCombo}`} icon={<Flame className="size-3.5" />} />
        <Stat
          label="Medal"
          value={result.medal}
          icon={<Medal className="size-3.5" />}
          tone={result.medal}
        />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-bold">Daily Twist</p>
        <p className="mt-1 text-sm font-semibold text-white/90">{modifier.name}</p>
        <p className="mt-0.5 text-xs text-white/60">{modifier.description}</p>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-bold">Heat Sparkline</p>
        <p className="mt-1 text-lg font-black tracking-[0.18em] text-[#ffb97e]">{spark}</p>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-bold">Top Chain</p>
        <p className="mt-1 text-sm font-semibold text-white/85 break-words">
          {result.topChain.length > 0 ? result.topChain.join(' -> ') : 'No chain built'}
        </p>
      </div>

      <p className="mt-2 text-[11px] text-center text-white/45">Verification {verificationToken}</p>

      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={handleShare} className="w-full">
          Share Run
        </Button>
        <Button variant="outline" onClick={() => startGame('blitz')} className="w-full">
          Play Blitz Again
        </Button>
        <Button variant="ghost" onClick={goToMenu} className="w-full">
          Back to Menu
        </Button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[11px] text-center mt-3 text-white/40"
      >
        Finish fast, keep heat high, chain words to go viral.
      </motion.p>
    </Dialog>
  )
}

function Stat(props: {
  label: string
  value: string | number
  icon: ReactNode
  tone?: keyof typeof MEDAL_STYLES
}) {
  return (
    <div className={`rounded-lg border p-2.5 text-center ${props.tone ? MEDAL_STYLES[props.tone] : 'border-white/10 bg-black/20 text-white'}`}>
      <div className={`inline-flex items-center justify-center size-6 rounded-full mb-1 ${props.tone ? 'bg-black/18' : 'bg-white/[0.07] text-white/75'}`}>
        {props.icon}
      </div>
      <p className="text-lg font-black tabular-nums">
        {props.value}
      </p>
      <p className={`text-[10px] uppercase tracking-[0.14em] ${props.tone ? 'opacity-85' : 'text-white/45'}`}>{props.label}</p>
    </div>
  )
}
