import { createFileRoute, Navigate } from '@tanstack/react-router'
import { FullPlayer } from '@/components/player/full-player'
import { usePlayer } from '@/contexts/player-context'

export const Route = createFileRoute('/player/')({
  component: PlayerPage,
})

function PlayerPage() {
  const { currentTrack } = usePlayer()

  if (!currentTrack) {
    return <Navigate to="/" />
  }

  return <FullPlayer />
}
