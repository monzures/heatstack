import type { RNG } from './rng.ts'
import type { DieState } from './types.ts'
import { DICE_COUNT } from './types.ts'
import { shuffledLetters } from './chain.ts'

export function createDiceFromLetters(letters: string[]): DieState[] {
  return letters.slice(0, DICE_COUNT).map((letter, i) => ({
    id: `die-${i}`,
    letter: letter.toUpperCase(),
    locked: false,
  }))
}

export function createDiceFromWord(word: string, rng: RNG): DieState[] {
  return createDiceFromLetters(shuffledLetters(word, rng))
}

export function readWord(dice: DieState[]): string {
  return dice.map((d) => d.letter).join('')
}

export function swapDice(dice: DieState[], i: number, j: number): DieState[] {
  if (i === j) return dice
  if (i < 0 || i >= dice.length || j < 0 || j >= dice.length) return dice

  const result = [...dice]
  ;[result[i], result[j]] = [result[j], result[i]]
  return result
}

export function shuffleDice(dice: DieState[], rng: RNG): DieState[] {
  const result = [...dice]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
