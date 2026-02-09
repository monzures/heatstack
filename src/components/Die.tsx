import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface DieProps {
  letter: string
  locked: boolean
  selected: boolean
  badge?: number | null
  onClick: () => void
}

export function Die({ letter, locked, selected, badge, onClick }: DieProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-[62px] h-[62px] sm:w-[72px] sm:h-[72px] rounded-2xl font-black text-[30px] sm:text-[34px] uppercase tracking-tight',
        'flex items-center justify-center select-none',
        'border shadow-[0_10px_30px_rgba(0,0,0,0.35)]',
        selected
          ? 'bg-[#2f2131] border-[#ff63b0] text-white cursor-grab'
          : 'bg-[#1a1f33] border-white/14 text-white cursor-grab hover:border-white/30',
      )}
      animate={
        selected ? { scale: 1.05 } : { scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    >
      {letter}
      {badge ? (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#ff67b2] text-[10px] font-black flex items-center justify-center text-white border border-white/30">
          {badge}
        </span>
      ) : null}
      {locked && null}
    </motion.button>
  )
}
