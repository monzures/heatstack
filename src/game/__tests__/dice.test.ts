import { describe, it, expect } from 'vitest'
import { createDiceFromLetters, createDiceFromWord, readWord, shuffleDice, swapDice } from '../dice.ts'
import { mulberry32 } from '../rng.ts'

describe('dice helpers', () => {
  it('creates 5 dice from a word', () => {
    const rng = mulberry32(42)
    const dice = createDiceFromWord('crane', rng)
    expect(dice).toHaveLength(5)
    expect(dice.every((die) => /^[A-Z]$/.test(die.letter))).toBe(true)
  })

  it('creates dice from explicit letters', () => {
    const dice = createDiceFromLetters(['H', 'E', 'A', 'T', 'S'])
    expect(readWord(dice)).toBe('HEATS')
  })

  it('swaps two dice positions', () => {
    const dice = createDiceFromLetters(['A', 'B', 'C', 'D', 'E'])
    const swapped = swapDice(dice, 1, 3)
    expect(readWord(swapped)).toBe('ADCBE')
  })

  it('shuffles deterministically with same seed', () => {
    const dice = createDiceFromLetters(['A', 'B', 'C', 'D', 'E'])
    const a = shuffleDice(dice, mulberry32(10))
    const b = shuffleDice(dice, mulberry32(10))
    expect(readWord(a)).toBe(readWord(b))
  })
})
