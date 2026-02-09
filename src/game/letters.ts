import type { RNG } from './rng.ts'

export const VOWELS = ['A', 'E', 'I', 'O', 'U']

// Weights tuned for 5-letter English word frequency
export const LETTER_WEIGHTS: Record<string, number> = {
  A: 8.5, B: 2.0, C: 4.5, D: 3.4, E: 11.0, F: 1.8, G: 2.5,
  H: 3.0, I: 7.5, J: 0.2, K: 1.1, L: 5.5, M: 3.0, N: 6.7,
  O: 7.2, P: 3.2, Q: 0.1, R: 7.6, S: 6.3, T: 7.0, U: 3.6,
  V: 1.0, W: 1.5, X: 0.2, Y: 2.0, Z: 0.3,
}

const LETTERS = Object.keys(LETTER_WEIGHTS)
const TOTAL_WEIGHT = Object.values(LETTER_WEIGHTS).reduce((a, b) => a + b, 0)

export function drawTile(rng: RNG): string {
  let roll = rng() * TOTAL_WEIGHT
  for (const letter of LETTERS) {
    roll -= LETTER_WEIGHTS[letter]
    if (roll <= 0) return letter
  }
  return 'E'
}
