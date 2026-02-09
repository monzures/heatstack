import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function useKeyboard() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const state = useGameStore.getState()
      if (state.status !== 'playing') return
      if (state.showCoachmarks) return
      if (e.repeat) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      // A-Z: stage matching letter from rack
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        state.stageLetter(e.key)
        return
      }

      // 1-5: stage die at position
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        state.toggleStageDie(parseInt(e.key) - 1)
        return
      }

      // Backspace: remove last staged letter
      if (e.key === 'Backspace') {
        e.preventDefault()
        state.popStage()
        return
      }

      // Enter: guess
      if (e.key === 'Enter') {
        e.preventDefault()
        state.submitWord()
        return
      }

      // Escape: clear stage
      if (e.key === 'Escape') {
        state.clearStage()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
