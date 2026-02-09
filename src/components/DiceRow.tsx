import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Die } from './Die'

export function DiceRow() {
  const dice = useGameStore((s) => s.dice)
  const stageIds = useGameStore((s) => s.stageIds)
  const toggleStageDie = useGameStore((s) => s.toggleStageDie)

  const orderById = useMemo(() => {
    const map = new Map<string, number>()
    stageIds.forEach((id, i) => map.set(id, i + 1))
    return map
  }, [stageIds])

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-micro text-[10px] font-semibold uppercase text-white/45">
        Letter Rack
      </span>
      <span className="text-[10px] text-white/40 -mt-1">
        <span className="sm:hidden">Rack letters only.</span>
        <span className="hidden sm:inline">Only these 5 letters can be used.</span>
      </span>
      <div className="flex gap-1.5 sm:gap-3">
        {dice.map((die, i) => {
          const order = orderById.get(die.id) ?? null
          return (
            <Die
              key={die.id}
              letter={die.letter}
              locked={false}
              selected={order !== null}
              badge={order}
              onClick={() => toggleStageDie(i)}
            />
          )
        })}
      </div>
    </div>
  )
}
