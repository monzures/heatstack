import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createMemoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value) },
    removeItem: (key: string) => { map.delete(key) },
    clear: () => { map.clear() },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() { return map.size },
  } satisfies Storage
}

describe('game store', () => {
  beforeEach(() => {
    vi.resetModules()
    const storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', { localStorage: storage } as unknown as Window & typeof globalThis)
  })

  afterEach(async () => {
    const words = await import('../words.ts')
    words.__resetWordListsForTests()
    vi.unstubAllGlobals()
  })

  it('finishes a blitz run when timer reaches zero', async () => {
    const words = await import('../words.ts')
    words.__setPlayableWordsForTests(['crane', 'trace', 'caper', 'clear'])

    const { useGameStore } = await import('../../store/gameStore.ts')
    useGameStore.getState().startGame('blitz')

    expect(useGameStore.getState().status).toBe('playing')
    useGameStore.getState().tick(60_000)
    expect(useGameStore.getState().status).toBe('finished')
    expect(useGameStore.getState().result).not.toBeNull()
  })

  it('does not score duplicate submitted words', async () => {
    const words = await import('../words.ts')
    words.__setPlayableWordsForTests(['crane', 'trace', 'caper', 'clear'])

    const { createDiceFromLetters } = await import('../dice.ts')
    const { useGameStore } = await import('../../store/gameStore.ts')
    useGameStore.getState().startGame('blitz')

    useGameStore.setState({ dice: createDiceFromLetters(['C', 'R', 'A', 'N', 'E']) })
    useGameStore.setState({ stageIds: ['die-0', 'die-1', 'die-2', 'die-3', 'die-4'] })
    useGameStore.getState().submitWord()
    const scoreAfterFirst = useGameStore.getState().score
    const wordsAfterFirst = useGameStore.getState().wordHistory.length

    useGameStore.setState({ dice: createDiceFromLetters(['C', 'R', 'A', 'N', 'E']) })
    useGameStore.setState({ stageIds: ['die-0', 'die-1', 'die-2', 'die-3', 'die-4'] })
    useGameStore.getState().submitWord()

    expect(useGameStore.getState().score).toBe(scoreAfterFirst)
    expect(useGameStore.getState().wordHistory.length).toBe(wordsAfterFirst)
  })

  it('uses deterministic daily seed for initial rack', async () => {
    const words = await import('../words.ts')
    words.__setPlayableWordsForTests(['crane', 'trace', 'caper', 'clear'])

    const { readWord } = await import('../dice.ts')
    const { useGameStore } = await import('../../store/gameStore.ts')

    useGameStore.getState().startGame('daily')
    const firstRack = readWord(useGameStore.getState().dice)

    localStorage.removeItem('heatstack-daily-lock-v1')
    useGameStore.setState({ dailyLockedToday: false })
    useGameStore.getState().goToMenu()
    useGameStore.getState().startGame('daily')
    const secondRack = readWord(useGameStore.getState().dice)

    expect(firstRack).toBe(secondRack)
  })

  it('stages letters from keyboard input order and accepts valid rack word', async () => {
    const words = await import('../words.ts')
    words.__setPlayableWordsForTests(['forth', 'trace', 'caper', 'clear'])

    const { createDiceFromLetters } = await import('../dice.ts')
    const { useGameStore } = await import('../../store/gameStore.ts')
    useGameStore.getState().startGame('blitz')
    useGameStore.setState({ dice: createDiceFromLetters(['R', 'T', 'H', 'O', 'F']) })

    useGameStore.getState().stageLetter('f')
    useGameStore.getState().stageLetter('o')
    useGameStore.getState().stageLetter('r')
    useGameStore.getState().stageLetter('t')
    useGameStore.getState().stageLetter('h')

    const state = useGameStore.getState()
    const byId = new Map(state.dice.map((die) => [die.id, die.letter]))
    const stagedWord = state.stageIds.map((id) => byId.get(id) ?? '').join('')
    expect(stagedWord).toBe('FORTH')

    useGameStore.getState().submitWord()
    expect(useGameStore.getState().wordHistory.at(-1)?.word).toBe('FORTH')
  })

  it('does not refill reroll charges after a successful submit', async () => {
    const words = await import('../words.ts')
    words.__setPlayableWordsForTests(['crane', 'trace', 'caper', 'clear'])

    const { createDiceFromLetters } = await import('../dice.ts')
    const { useGameStore } = await import('../../store/gameStore.ts')
    useGameStore.getState().startGame('blitz')

    useGameStore.setState({
      rerollsLeft: 1,
      dice: createDiceFromLetters(['C', 'R', 'A', 'N', 'E']),
      stageIds: ['die-0', 'die-1', 'die-2', 'die-3', 'die-4'],
    })

    useGameStore.getState().submitWord()
    expect(useGameStore.getState().rerollsLeft).toBe(1)
  })

  it('blocks reroll actions when daily modifier is no_rerolls', async () => {
    const words = await import('../words.ts')
    words.__setPlayableWordsForTests(['crane', 'trace', 'caper', 'clear'])

    const { createDiceFromLetters, readWord } = await import('../dice.ts')
    const { useGameStore } = await import('../../store/gameStore.ts')
    useGameStore.getState().startGame('blitz')
    useGameStore.setState({
      dailyModifierId: 'no_rerolls',
      rerollsLeft: 4,
      dice: createDiceFromLetters(['C', 'R', 'A', 'N', 'E']),
      stageIds: [],
    })

    const beforeRack = readWord(useGameStore.getState().dice)
    useGameStore.getState().autoFillStage()
    useGameStore.getState().rerollRack()
    const after = useGameStore.getState()

    expect(after.rerollsLeft).toBe(4)
    expect(readWord(after.dice)).toBe(beforeRack)
    expect(after.stageIds).toHaveLength(0)
  })
})
