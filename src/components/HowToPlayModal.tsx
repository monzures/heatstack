import { useGameStore } from '@/store/gameStore'
import { Dialog, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

export function HowToPlayModal() {
  const show = useGameStore((s) => s.showCoachmarks)
  const dismiss = useGameStore((s) => s.dismissCoachmarks)

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) dismiss() }}>
      <DialogTitle>How to Play</DialogTitle>

      <div className="space-y-4 text-sm">
        <Step title="1. Fill The Stage">
          Use only rack letters. Tap dice or type letters to build a 5-letter word.
        </Step>
        <Step title="2. Build A Chain">
          Submit valid words and keep at least 2 shared letters to grow combo.
        </Step>
        <Step title="3. Stay Hot">
          Heat drains over time. Auto Fill costs 2 charges, Re-roll costs 1.
        </Step>
        <Step title="4. Daily Twist">
          Daily mode has one seeded modifier (same for everyone that day).
        </Step>
        <Step title="5. Hint Timing">
          Hint trail and full word reveal unlock after 10 seconds on one rack.
        </Step>
        <Step title="6. Final Countdown">
          A soft chime plays in the final 5 seconds so you can clutch-submit.
        </Step>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
        Timer starts only after you press <strong className="text-white">Start Run</strong>. Valid rack words auto-submit when slot 5 is filled.
      </div>

      <Button onClick={dismiss} className="w-full mt-5">
        Start Run
      </Button>
    </Dialog>
  )
}

function Step(props: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-white">{props.title}</p>
      <p className="text-white/70">{props.children}</p>
    </div>
  )
}
