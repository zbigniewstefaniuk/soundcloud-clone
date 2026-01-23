import { createContext, use, useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TrackWithUser } from '@/api/tracks'
import { fetchStreamToken } from '@/api/tracks'
import { useBroadcastChannel } from '@/hooks/use-broadcast-channel'

interface PlayerState {
  currentTrack: TrackWithUser | null
  queue: TrackWithUser[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  currentTime: number
  duration: number
}

type PlayerMessage =
  | { type: 'STATE_UPDATE'; state: PlayerState }
  | { type: 'CMD_PLAY_TRACK'; track: TrackWithUser; queue: TrackWithUser[]; queueIndex: number }
  | { type: 'CMD_TOGGLE_PLAY' }
  | { type: 'CMD_NEXT' }
  | { type: 'CMD_PREVIOUS' }
  | { type: 'CMD_SEEK'; time: number }
  | { type: 'CMD_VOLUME'; volume: number }
  | { type: 'CMD_ADD_TO_QUEUE'; track: TrackWithUser }
  | { type: 'SYNC_REQUEST' }
  | { type: 'SYNC_RESPONSE'; state: PlayerState }

interface PlayerContextValue extends PlayerState {
  playTrack: (track: TrackWithUser, queue?: TrackWithUser[]) => void
  addToQueue: (track: TrackWithUser) => void
  next: () => void
  previous: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  hasNext: boolean
  hasPrevious: boolean
  toggleMute: () => void
  mute: () => void
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const audioRef = useRef<HTMLAudioElement>(null)
  const isActivePlayerRef = useRef(false)
  const previousVolumeRef = useRef(1)
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    isMuted: false,
  })

  const broadcastRef = useRef<(msg: PlayerMessage) => void>(() => {})
  const stateRef = useRef(state)
  stateRef.current = state

  // Helper to update state and broadcast
  const updateState = (newState: PlayerState) => {
    setState(newState)
    stateRef.current = newState
    if (isActivePlayerRef.current) {
      broadcastRef.current({ type: 'STATE_UPDATE', state: newState })
    }
  }

  // Execute functions (only active tab runs these)
  const executePlayTrack = async (
    track: TrackWithUser,
    queue: TrackWithUser[],
    queueIndex: number,
  ) => {
    updateState({
      ...stateRef.current,
      currentTrack: track,
      queue,
      queueIndex,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    })

    if (audioRef.current) {
      try {
        const streamUrl = await queryClient.fetchQuery({
          queryKey: ['stream-url', track.id],
          queryFn: () => fetchStreamToken(track.id),
          staleTime: 1000 * 60 * 4, // 4 min (tokens expire in 5 min)
        })
        audioRef.current.src = streamUrl
        audioRef.current.play()
      } catch (error) {
        console.error('Failed to get stream URL:', error)
        updateState({ ...stateRef.current, isPlaying: false })
      }
    }
  }

  const executeTogglePlay = () => {
    if (!audioRef.current) return
    if (stateRef.current.isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const executeNext = async () => {
    const { queueIndex, queue } = stateRef.current
    if (queueIndex < queue.length - 1) {
      await executePlayTrack(queue[queueIndex + 1], queue, queueIndex + 1)
    }
  }

  const executePrevious = async () => {
    const { queueIndex, queue } = stateRef.current
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      updateState({ ...stateRef.current, currentTime: 0 })
      return
    }
    if (queueIndex > 0) {
      await executePlayTrack(queue[queueIndex - 1], queue, queueIndex - 1)
    }
  }

  const executeSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
    updateState({ ...stateRef.current, currentTime: time })
  }

  const executeVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    if (volume > 0) {
      previousVolumeRef.current = volume
    }
    updateState({ ...stateRef.current, volume, isMuted: volume === 0 })
  }

  const executeAddToQueue = (track: TrackWithUser) => {
    updateState({ ...stateRef.current, queue: [...stateRef.current.queue, track] })
  }

  const handleBroadcastMessage = (msg: PlayerMessage) => {
    switch (msg.type) {
      case 'STATE_UPDATE':
        if (!isActivePlayerRef.current) {
          setState(msg.state)
          stateRef.current = msg.state
        }
        break

      case 'CMD_PLAY_TRACK':
        if (isActivePlayerRef.current && audioRef.current) {
          audioRef.current.pause()
        }
        isActivePlayerRef.current = false
        setState({
          ...stateRef.current,
          currentTrack: msg.track,
          queue: msg.queue,
          queueIndex: msg.queueIndex,
          isPlaying: true,
          currentTime: 0,
          duration: 0,
        })
        break

      case 'CMD_TOGGLE_PLAY':
        if (isActivePlayerRef.current) executeTogglePlay()
        break

      case 'CMD_NEXT':
        if (isActivePlayerRef.current) executeNext()
        break

      case 'CMD_PREVIOUS':
        if (isActivePlayerRef.current) executePrevious()
        break

      case 'CMD_SEEK':
        if (isActivePlayerRef.current) executeSeek(msg.time)
        break

      case 'CMD_VOLUME':
        if (isActivePlayerRef.current) executeVolume(msg.volume)
        break

      case 'CMD_ADD_TO_QUEUE':
        if (isActivePlayerRef.current) executeAddToQueue(msg.track)
        break

      case 'SYNC_REQUEST':
        if (isActivePlayerRef.current && audioRef.current) {
          broadcastRef.current({
            type: 'SYNC_RESPONSE',
            state: {
              ...stateRef.current,
              currentTime: audioRef.current.currentTime,
              duration: audioRef.current.duration || 0,
            },
          })
        }
        break

      case 'SYNC_RESPONSE':
        if (!isActivePlayerRef.current) {
          setState(msg.state)
          stateRef.current = msg.state
        }
        break
    }
  }

  const { broadcast } = useBroadcastChannel<PlayerMessage>('player-sync', handleBroadcastMessage)
  broadcastRef.current = broadcast

  useEffect(() => {
    broadcast({ type: 'SYNC_REQUEST' })
  }, [broadcast])

  useEffect(() => {
    const savedState = localStorage.getItem('playerState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setState((prev) => ({
          ...prev,
          volume: parsed.volume ?? 1,
          queue: parsed.queue ?? [],
          queueIndex: parsed.queueIndex ?? 0,
        }))
        previousVolumeRef.current = parsed.volume ?? 1
      } catch {
        // Ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'playerState',
      JSON.stringify({
        volume: state.volume,
        queue: state.queue,
        queueIndex: state.queueIndex,
      }),
    )
  }, [state.volume, state.queue, state.queueIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const controller = new AbortController()
    const signal = controller.signal

    let lastBroadcastTime = 0

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime
      const duration = audio.duration || 0
      const newState = { ...stateRef.current, currentTime, duration }

      setState(newState)
      stateRef.current = newState

      if (isActivePlayerRef.current && Math.abs(currentTime - lastBroadcastTime) >= 1) {
        lastBroadcastTime = currentTime
        broadcastRef.current({ type: 'STATE_UPDATE', state: newState })
      }
    }

    const handleEnded = async () => {
      if (stateRef.current.queueIndex < stateRef.current.queue.length - 1) {
        await executeNext()
      } else {
        updateState({ ...stateRef.current, isPlaying: false })
      }
    }

    const handlePlay = () => updateState({ ...stateRef.current, isPlaying: true })
    const handlePause = () => updateState({ ...stateRef.current, isPlaying: false })

    // Handle stream errors (e.g., expired token) by refreshing the URL
    const handleError = async () => {
      const currentTrack = stateRef.current.currentTrack
      if (!currentTrack || !isActivePlayerRef.current) return

      try {
        // Invalidate cached token and fetch a fresh one
        await queryClient.invalidateQueries({ queryKey: ['stream-url', currentTrack.id] })
        const currentTime = audio.currentTime
        const newUrl = await queryClient.fetchQuery({
          queryKey: ['stream-url', currentTrack.id],
          queryFn: () => fetchStreamToken(currentTrack.id),
          staleTime: 0, // Force fresh fetch
        })
        audio.src = newUrl
        audio.currentTime = currentTime
        audio.play()
      } catch {
        console.error('Failed to refresh stream URL')
        updateState({ ...stateRef.current, isPlaying: false })
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate, { signal })
    audio.addEventListener('ended', handleEnded, { signal })
    audio.addEventListener('play', handlePlay, { signal })
    audio.addEventListener('pause', handlePause, { signal })
    audio.addEventListener('error', handleError, { signal })

    return () => controller.abort()
  }, [])

  // Public API
  const playTrack = async (track: TrackWithUser, queue?: TrackWithUser[]) => {
    const newQueue = queue || [track]
    const index = newQueue.findIndex((t) => t.id === track.id)
    const queueIndex = index >= 0 ? index : 0

    isActivePlayerRef.current = true
    await executePlayTrack(track, newQueue, queueIndex)
    broadcast({ type: 'CMD_PLAY_TRACK', track, queue: newQueue, queueIndex })
  }

  const togglePlay = () => {
    if (isActivePlayerRef.current) {
      executeTogglePlay()
    } else {
      broadcast({ type: 'CMD_TOGGLE_PLAY' })
    }
  }

  const next = () => {
    if (isActivePlayerRef.current) {
      executeNext()
    } else {
      broadcast({ type: 'CMD_NEXT' })
    }
  }

  const previous = () => {
    if (isActivePlayerRef.current) {
      executePrevious()
    } else {
      broadcast({ type: 'CMD_PREVIOUS' })
    }
  }

  const seek = (time: number) => {
    if (isActivePlayerRef.current) {
      executeSeek(time)
    } else {
      broadcast({ type: 'CMD_SEEK', time })
    }
  }

  const setVolume = (volume: number) => {
    if (isActivePlayerRef.current) {
      executeVolume(volume)
    } else {
      broadcast({ type: 'CMD_VOLUME', volume })
    }
  }

  const addToQueue = (track: TrackWithUser) => {
    if (isActivePlayerRef.current) {
      executeAddToQueue(track)
    } else {
      broadcast({ type: 'CMD_ADD_TO_QUEUE', track })
    }
  }

  const toggleMute = () => {
    if (state.isMuted) {
      setVolume(previousVolumeRef.current)
    } else {
      setVolume(0)
    }
  }

  const mute = () => setVolume(0)

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playTrack,
        addToQueue,
        next,
        previous,
        togglePlay,
        seek,
        setVolume,
        hasNext: state.queueIndex < state.queue.length - 1,
        hasPrevious: state.queueIndex > 0,
        toggleMute,
        mute,
        audioRef,
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata">
        <track kind="captions" />
      </audio>
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = use(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}
