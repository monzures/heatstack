import { Toaster } from 'sonner'
import { MenuScreen } from '@/components/MenuScreen'
import { GameScreen } from '@/components/GameScreen'
import { useGameStore } from '@/store/gameStore'

export default function App() {
  const status = useGameStore((s) => s.status)

  return (
    <div className="w-full max-w-[760px] h-dvh flex flex-col relative">
      {status === 'menu' ? <MenuScreen /> : <GameScreen />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 16, 23, 0.95)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: '700',
          },
        }}
      />
    </div>
  )
}
