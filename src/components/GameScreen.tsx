import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useGameStore } from '@/store/gameStore'
import { getAnagramsForLetters, isValidWord } from '@/game/words'
import { heatToColor } from '@/game/heat'
import { getModifierById, isRerollDisabled } from '@/game/modifiers'
import { playTone } from '@/lib/feedback'
import { generateShareText } from '@/game/share'
import { getMsUntilNextPacificDay } from '@/game/rng'
import { DiceRow } from './DiceRow'
import { Button } from './ui/button'
import { ResultModal } from './ResultModal'
import { HowToPlayModal } from './HowToPlayModal'
import { useKeyboard } from '@/hooks/useKeyboard'

const HINT_REVEAL_MS = 10_000
const WARNING_THRESHOLDS_MS = [5000, 3000, 1000] as const

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatCountdownMs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function GameScreen() {
  useKeyboard()

  const lastTickRef = useRef<number>(0)
  const autoSubmitRef = useRef<string | null>(null)
  const warningPlayedRef = useRef<Record<number, boolean>>({
    5000: false,
    3000: false,
    1000: false,
  })
  const [nowMs, setNowMs] = useState(() => Date.now())

  const status = useGameStore((s) => s.status)
  const mode = useGameStore((s) => s.mode)
  const dayNumber = useGameStore((s) => s.dayNumber)
  const dailyModifierId = useGameStore((s) => s.dailyModifierId)
  const timeLeftMs = useGameStore((s) => s.timeLeftMs)
  const score = useGameStore((s) => s.score)
  const combo = useGameStore((s) => s.combo)
  const heat = useGameStore((s) => s.heat)
  const rerollsLeft = useGameStore((s) => s.rerollsLeft)
  const rackAgeMs = useGameStore((s) => s.rackAgeMs)
  const dice = useGameStore((s) => s.dice)
  const stageIds = useGameStore((s) => s.stageIds)
  const usedWords = useGameStore((s) => s.usedWords)
  const wordHistory = useGameStore((s) => s.wordHistory)
  const showCoachmarks = useGameStore((s) => s.showCoachmarks)
  const goToMenu = useGameStore((s) => s.goToMenu)
  const tick = useGameStore((s) => s.tick)
  const autoFillStage = useGameStore((s) => s.autoFillStage)
  const clearStage = useGameStore((s) => s.clearStage)
  const shuffleRack = useGameStore((s) => s.shuffleRack)
  const rerollRack = useGameStore((s) => s.rerollRack)
  const submitWord = useGameStore((s) => s.submitWord)
  const startGame = useGameStore((s) => s.startGame)
  const setShowResult = useGameStore((s) => s.setShowResult)
  const result = useGameStore((s) => s.result)
  const soundEnabled = useGameStore((s) => s.soundEnabled)
  const hapticsEnabled = useGameStore((s) => s.hapticsEnabled)
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled)
  const setHapticsEnabled = useGameStore((s) => s.setHapticsEnabled)

  useEffect(() => {
    if (status !== 'playing') return
    if (showCoachmarks) return
    lastTickRef.current = performance.now()

    const runTick = () => {
      const now = performance.now()
      const elapsed = now - lastTickRef.current
      lastTickRef.current = now
      tick(elapsed)
    }

    const id = window.setInterval(runTick, 100)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        runTick()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [status, showCoachmarks, tick])

  useEffect(() => {
    if (status !== 'playing' || showCoachmarks) return

    if (timeLeftMs > WARNING_THRESHOLDS_MS[0]) {
      warningPlayedRef.current[5000] = false
      warningPlayedRef.current[3000] = false
      warningPlayedRef.current[1000] = false
      return
    }

    for (const threshold of WARNING_THRESHOLDS_MS) {
      if (timeLeftMs <= threshold && timeLeftMs > 0 && !warningPlayedRef.current[threshold]) {
        warningPlayedRef.current[threshold] = true
        playTone('warning', soundEnabled)
      }
    }
  }, [status, showCoachmarks, soundEnabled, timeLeftMs])

  useEffect(() => {
    if (status !== 'finished' || mode !== 'daily') return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [mode, status])

  const byId = useMemo(() => new Map(dice.map((die) => [die.id, die.letter])), [dice])
  const stageWord = useMemo(
    () => stageIds.map((id) => byId.get(id) ?? '').join(''),
    [byId, stageIds],
  )
  const currentWord = stageWord.toLowerCase()
  const stageComplete = stageIds.length === dice.length
  const isValid = stageComplete && isValidWord(currentWord)
  const alreadyUsed = usedWords.includes(currentWord)
  const canAttemptSubmit = status === 'playing' && stageComplete
  const canSubmit = status === 'playing' && stageComplete && isValid && !alreadyUsed
  const hintedWord = useMemo(() => {
    const options = getAnagramsForLetters(dice.map((die) => die.letter))
    return options.find((word) => !usedWords.includes(word.toLowerCase())) ?? options[0] ?? null
  }, [dice, usedWords])
  const showHint = rackAgeMs > HINT_REVEAL_MS && !isValid && Boolean(hintedWord)
  const hintMask = hintedWord ? `${hintedWord[0]} _ _ _ ${hintedWord[4]}` : null
  const latestWords = useMemo(
    () => wordHistory.slice(-6).map((entry) => entry.word),
    [wordHistory],
  )
  const dailyModifier = useMemo(() => getModifierById(dailyModifierId), [dailyModifierId])
  const rerollsDisabledByModifier = isRerollDisabled(dailyModifierId)
  const msToNextDaily = useMemo(() => getMsUntilNextPacificDay(nowMs), [nowMs])
  const nextDailyCountdown = useMemo(() => formatCountdownMs(msToNextDaily), [msToNextDaily])
  const nextDailyProgress = useMemo(
    () => Math.max(0, Math.min(1, 1 - msToNextDaily / 86_400_000)),
    [msToNextDaily],
  )

  useEffect(() => {
    if (!canSubmit || showCoachmarks) {
      autoSubmitRef.current = null
      return
    }

    const signature = `${stageWord}:${usedWords.length}`
    if (autoSubmitRef.current === signature) return
    autoSubmitRef.current = signature

    const timeout = window.setTimeout(() => {
      const state = useGameStore.getState()
      if (state.status !== 'playing' || state.showCoachmarks) return
      const byIdNow = new Map(state.dice.map((die) => [die.id, die.letter]))
      const current = state.stageIds.map((id) => byIdNow.get(id) ?? '').join('').toLowerCase()
      const full = state.stageIds.length === state.dice.length
      if (full && isValidWord(current) && !state.usedWords.includes(current)) {
        state.submitWord()
      }
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [canSubmit, showCoachmarks, stageWord, usedWords.length])

  async function handleQuickShare() {
    if (!result) return
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
    <div className="relative z-10 flex-1 px-4 sm:px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+14px)] flex flex-col gap-3 overflow-hidden">
      <header className="flex items-center justify-between">
        <button
          onClick={goToMenu}
          className="font-micro h-9 px-3 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          MENU
        </button>
        <div className="text-center">
          <p className="font-micro text-[11px] uppercase text-white/55">
            {mode === 'daily' ? `Daily #${dayNumber}` : 'Blitz Reactor'}
          </p>
          {mode === 'daily' && (
            <p className="text-[11px] text-[#ffcf9a] font-semibold">{dailyModifier.name}</p>
          )}
          <p className="text-[11px] text-white/45">Use rack letters only. Tap or type to build a word.</p>
        </div>
        <div className="min-w-[72px] text-right">
          <p className="font-micro text-xs text-white/45 uppercase">Time</p>
          <p className={`font-numeric text-2xl font-extrabold tabular-nums ${timeLeftMs < 12_000 ? 'text-[#ff8d7b]' : 'text-white'}`}>
            {formatMs(timeLeftMs)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <HudBox label="Score" value={score.toString()} emphasis />
        <HudBox label="Combo" value={`x${Math.max(1, combo)}`} />
        <HudBox label="Reroll Charges" value={rerollsLeft.toString()} />
      </section>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em]">
          <span className="font-micro text-white/55 font-semibold">Reactor Heat</span>
          <span style={{ color: heatToColor(heat) }} className="font-black">{Math.round(heat)}%</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-[#151826] overflow-hidden border border-white/8">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, #4ea6ff 0%, #ff3d80 45%, #ff8b36 75%, #fff2d2 100%)`,
              boxShadow: `0 0 18px ${heatToColor(heat)}`,
            }}
            animate={{ width: `${heat}%` }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          />
        </div>
      </section>

      <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/[0.03] px-3 py-4 flex flex-col items-center justify-center gap-4">
        <StageTray stageWord={stageWord} stageLength={stageIds.length} />
        <DiceRow />

        <div className="text-center">
          <p className="font-micro text-[11px] uppercase text-white/45">Stage Word</p>
          <p className="font-brand mt-1 text-3xl font-extrabold tracking-[0.18em]">{stageWord.padEnd(5, '.')}</p>
          <p className="mt-1 text-xs font-semibold">
            {alreadyUsed && stageComplete && <span className="text-[#ff8a7a]">Already used in this run</span>}
            {!alreadyUsed && isValid && <span className="text-[#73ffa3]">Playable word</span>}
            {!isValid && stageComplete && <span className="text-white/45">Not in playable list for this rack</span>}
            {!stageComplete && <span className="text-white/45">Use only rack letters. Fill all 5 slots.</span>}
          </p>
          {canSubmit && (
            <p className="mt-1 text-[11px] text-white/45">Valid words auto-submit on the 5th letter.</p>
          )}
          {showHint && hintMask && (
            <p className="mt-1 text-[11px] text-[#ffc789] font-semibold">
              Hint trail: {hintMask}
            </p>
          )}
          {showHint && hintedWord && stageComplete && !isValid && (
            <p className="mt-0.5 text-[11px] text-white/65">
              Try this rack word: <span className="font-bold text-[#ffd39d]">{hintedWord}</span>
            </p>
          )}
        </div>
        {!showHint && (
          <p className="text-[11px] text-white/40 -mt-1">
            Hint unlocks after 10s on the same rack.
          </p>
        )}

        <div className="w-full max-w-[420px] grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={autoFillStage} disabled={status !== 'playing' || rerollsDisabledByModifier || rerollsLeft < 2}>
            Auto Fill (-2)
          </Button>
          <Button variant="outline" onClick={shuffleRack} disabled={status !== 'playing'}>
            Shuffle Rack
          </Button>
          <Button variant="outline" onClick={rerollRack} disabled={status !== 'playing' || rerollsDisabledByModifier || rerollsLeft <= 0}>
            Re-roll (-1)
          </Button>
        </div>
        {mode === 'daily' && (
          <p className="text-[11px] text-white/55 -mt-1 text-center">
            Daily twist: {dailyModifier.description}
          </p>
        )}

        <div className="w-full max-w-[420px] grid grid-cols-2 gap-2">
          <Button
            onClick={clearStage}
            disabled={status !== 'playing' || stageIds.length === 0}
            className="bg-[#ff5667] text-white hover:bg-[#ff475a] shadow-[0_6px_22px_rgba(255,86,103,0.35)]"
          >
            CLEAR STAGE
          </Button>
          <Button onClick={submitWord} disabled={!canAttemptSubmit}>
            Submit
          </Button>
        </div>
      </div>

      {status === 'finished' && mode === 'blitz' && (
        <section className="rounded-2xl border border-[#ffb36a]/30 bg-[#1a1523]/75 px-4 py-3">
          <p className="font-micro text-[10px] uppercase tracking-[0.14em] text-[#ffcb9a]">Blitz Complete</p>
          <p className="mt-1 text-sm text-white/85">
            Score <span className="font-black text-[#ffd9a8] tabular-nums">{result?.score ?? score}</span>. Run it back?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button onClick={() => startGame('blitz')}>
              Play Again
            </Button>
            <Button variant="outline" onClick={() => setShowResult(true)} disabled={!result}>
              View Results
            </Button>
          </div>
        </section>
      )}

      {status === 'finished' && mode === 'daily' && result && (
        <section className="rounded-2xl border border-[#7bb7ff]/30 bg-[linear-gradient(135deg,rgba(42,60,104,0.72),rgba(33,28,52,0.75))] px-4 py-3 shadow-[0_8px_28px_rgba(67,118,196,0.25)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-micro text-[10px] uppercase tracking-[0.14em] text-[#c9ddff]">Daily Complete</p>
              <p className="mt-1 text-sm text-white/90">
                Official score locked at <span className="font-black text-[#ffd9a8] tabular-nums">{result.score}</span>
              </p>
            </div>
            <button
              onClick={() => setShowResult(true)}
              className="text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
            >
              View Result
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="font-micro text-[10px] uppercase tracking-[0.14em] text-white/55">Next Daily In</p>
            <p className="font-numeric mt-1 text-3xl font-black tracking-[0.06em] text-[#bfe0ff]">{nextDailyCountdown}</p>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#6fb0ff_0%,#8dd8ff_55%,#ffc98f_100%)]"
                animate={{ width: `${nextDailyProgress * 100}%` }}
                transition={{ type: 'spring', stiffness: 170, damping: 24 }}
              />
            </div>
            <p className="mt-1 text-[11px] text-white/55">Resets at midnight PT</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button onClick={handleQuickShare}>Share Daily</Button>
            <Button variant="outline" onClick={() => startGame('blitz')}>Play Blitz</Button>
            <Button variant="outline" onClick={() => setShowResult(true)}>Open Results</Button>
            <Button variant="ghost" onClick={goToMenu}>Menu</Button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-micro text-[10px] uppercase text-white/45 font-semibold">Word Chain</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[10px] uppercase tracking-[0.14em] text-white/55 hover:text-white cursor-pointer"
            >
              Sound {soundEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className="text-[10px] uppercase tracking-[0.14em] text-white/55 hover:text-white cursor-pointer"
            >
              Haptics {hapticsEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {latestWords.length === 0 && <span className="text-xs text-white/35">Submit words to start your chain.</span>}
          {latestWords.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="px-2.5 py-1 rounded-full border border-white/12 bg-white/[0.05] text-xs font-bold tracking-wide"
            >
              {word}
            </span>
          ))}
        </div>
      </section>

      <HowToPlayModal />
      <ResultModal />
    </div>
  )
}

function HudBox(props: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{props.label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${props.emphasis ? 'text-[#ffd09b]' : 'text-white'}`}>
        {props.value}
      </p>
    </div>
  )
}

function StageTray(props: { stageWord: string; stageLength: number }) {
  const letters = props.stageWord.toUpperCase().split('')
  return (
    <div className="flex gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-black ${
            i < props.stageLength
              ? 'bg-[#281f2c] border-[#ff67b2] text-white'
              : 'bg-[#121629] border-white/10 text-white/20'
          }`}
        >
          {letters[i] ?? ''}
        </div>
      ))}
    </div>
  )
}
