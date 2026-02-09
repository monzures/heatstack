import { describe, it, expect } from 'vitest'
import { drawTile } from '../letters.ts'
import { mulberry32 } from '../rng.ts'

describe('drawTile', () => {
  it('returns a single uppercase letter', () => {
    const rng = mulberry32(42)
    const tile = drawTile(rng)
    expect(tile).toMatch(/^[A-Z]$/)
  })

  it('returns consistent results for same seed', () => {
    const rng1 = mulberry32(42)
    const rng2 = mulberry32(42)
    expect(drawTile(rng1)).toBe(drawTile(rng2))
  })

  it('returns different results for different seeds', () => {
    const tiles = new Set<string>()
    for (let seed = 0; seed < 100; seed++) {
      tiles.add(drawTile(mulberry32(seed)))
    }
    expect(tiles.size).toBeGreaterThan(5)
  })

  it('produces weighted distribution (E should be common)', () => {
    const rng = mulberry32(42)
    const counts: Record<string, number> = {}
    for (let i = 0; i < 1000; i++) {
      const letter = drawTile(rng)
      counts[letter] = (counts[letter] || 0) + 1
    }
    // E has the highest weight (11.0), so it should appear frequently
    expect(counts['E']).toBeGreaterThan(50)
  })
})
