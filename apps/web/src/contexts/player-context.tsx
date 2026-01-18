import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import type { TrackWithUser } from '@/api/tracks'
import { getStreamUrl } from '@/api/tracks'
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
  // State updates (sent by active tab to update other tabs' UI)
  | { type: 'STATE_UPDATE'; state: PlayerState }
  // Commands (sent by any tab, executed by active tab)
  | { type: 'CMD_PLAY_TRACK'; track: TrackWithUser; queue: TrackWithUser[]; queueIndex: number }
  | { type: 'CMD_TOGGLE_PLAY' }
  | { type: 'CMD_NEXT' }
  | { type: 'CMD_PREVIOUS' }
  | { type: 'CMD_SEEK'; time: number }
  | { type: 'CMD_VOLUME'; volume: number }
  | { type: 'CMD_ADD_TO_QUEUE'; track: TrackWithUser }
  // Sync (for new tabs)
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
  const audioRef = useRef<HTMLAudioElement>(null)
  const isActivePlayerRef = useRef(false)
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

  // Broadcast state to other tabs (only active player does this)
  const broadcastState = (newState: PlayerState) => {
    if (isActivePlayerRef.current) {
      broadcastRef.current({ type: 'STATE_UPDATE', state: newState })
    }
  }

  // Internal functions that actually control the audio (only called by active tab)
  const executePlayTrack = (track: TrackWithUser, queue: TrackWithUser[], queueIndex: number) => {
    const newState: PlayerState = {
      ...stateRef.current,
      currentTrack: track,
      queue,
      queueIndex,
      isPlaying: true,
    }
    setState(newState)

    if (audioRef.current) {
      audioRef.current.src = getStreamUrl(track.id)
      audioRef.current.play()
    }

    broadcastState(newState)
  }

  const executeTogglePlay = () => {
    if (!audioRef.current) return

    if (stateRef.current.isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const executeNext = () => {
    const { queueIndex, queue } = stateRef.current
    if (queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1]
      executePlayTrack(nextTrack, queue, queueIndex + 1)
    }
  }

  const executePrevious = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      return
    }

    const { queueIndex, queue } = stateRef.current
    if (queueIndex > 0) {
      const prevTrack = queue[queueIndex - 1]
      executePlayTrack(prevTrack, queue, queueIndex - 1)
    }
  }

  const executeSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
    const newState = { ...stateRef.current, currentTime: time }
    setState(newState)
    broadcastState(newState)
  }

  const executeVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    const newState = { ...stateRef.current, volume, isMuted: volume === 0 }
    setState(newState)
    broadcastState(newState)
  }

  const executeAddToQueue = (track: TrackWithUser) => {
    const newState = { ...stateRef.current, queue: [...stateRef.current.queue, track] }
    setState(newState)
    broadcastState(newState)
  }

  const handleBroadcastMessage = (msg: PlayerMessage) => {
    switch (msg.type) {
      // State update from active tab - just update UI
      case 'STATE_UPDATE':
        if (!isActivePlayerRef.current) {
          setState(msg.state)
        }
        break

      // CMD_PLAY_TRACK - another tab is taking over as active player
      case 'CMD_PLAY_TRACK':
        // Stop our audio if we were playing
        if (isActivePlayerRef.current && audioRef.current) {
          audioRef.current.pause()
        }
        // We are no longer the active player
        isActivePlayerRef.current = false
        // Update our state to match
        setState((prev) => ({
          ...prev,
          currentTrack: msg.track,
          queue: msg.queue,
          queueIndex: msg.queueIndex,
          isPlaying: true,
        }))
        break

      case 'CMD_TOGGLE_PLAY':
        if (isActivePlayerRef.current) {
          executeTogglePlay()
        }
        break

      case 'CMD_NEXT':
        if (isActivePlayerRef.current) {
          executeNext()
        }
        break

      case 'CMD_PREVIOUS':
        if (isActivePlayerRef.current) {
          executePrevious()
        }
        break

      case 'CMD_SEEK':
        if (isActivePlayerRef.current) {
          executeSeek(msg.time)
        }
        break

      case 'CMD_VOLUME':
        if (isActivePlayerRef.current) {
          executeVolume(msg.volume)
        }
        break

      case 'CMD_ADD_TO_QUEUE':
        if (isActivePlayerRef.current) {
          executeAddToQueue(msg.track)
        }
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
        }
        break
    }
  }

  const { broadcast } = useBroadcastChannel<PlayerMessage>('player-sync', handleBroadcastMessage)
  broadcastRef.current = broadcast

  // Request sync from other tabs on mount
  useEffect(() => {
    broadcast({ type: 'SYNC_REQUEST' })
  }, [broadcast])

  // Load state from localStorage on mount
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
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(
      'playerState',
      JSON.stringify({
        volume: state.volume,
        queue: state.queue,
        queueIndex: state.queueIndex,
      })
    )
  }, [state.volume, state.queue, state.queueIndex])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const controller = new AbortController()
    const signal = controller.signal

    let lastBroadcastTime = 0
    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime
      const duration = audio.duration || 0

      setState((prev) => ({ ...prev, currentTime, duration }))

      // Broadcast time updates every second to other tabs
      if (isActivePlayerRef.current && currentTime - lastBroadcastTime >= 1) {
        lastBroadcastTime = currentTime
        broadcastRef.current({
          type: 'STATE_UPDATE',
          state: { ...stateRef.current, currentTime, duration },
        })
      }
    }

    const handleDurationChange = () => {
      setState((prev) => ({ ...prev, duration: audio.duration }))
    }

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }))
      if (stateRef.current.queueIndex < stateRef.current.queue.length - 1) {
        executeNext()
      }
    }

    const handlePlay = () => {
      const newState = { ...stateRef.current, isPlaying: true }
      setState(newState)
      broadcastState(newState)
    }

    const handlePause = () => {
      const newState = { ...stateRef.current, isPlaying: false }
      setState(newState)
      broadcastState(newState)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate, { signal })
    audio.addEventListener('durationchange', handleDurationChange, { signal })
    audio.addEventListener('ended', handleEnded, { signal })
    audio.addEventListener('play', handlePlay, { signal })
    audio.addEventListener('pause', handlePause, { signal })

    return () => {
      controller.abort()
    }
  }, [])

  // Public API - these broadcast commands that the active tab executes
  const playTrack = (track: TrackWithUser, queue?: TrackWithUser[]) => {
    const newQueue = queue || [track]
    const index = newQueue.findIndex((t) => t.id === track.id)
    const queueIndex = index >= 0 ? index : 0

    // This tab becomes the active player
    isActivePlayerRef.current = true
    executePlayTrack(track, newQueue, queueIndex)

    // Tell other tabs to stop being active
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
      setVolume(state.volume || 1)
    } else {
      setVolume(0)
    }
  }

  const mute = () => {
    setVolume(0)
  }

  const hasNext = state.queueIndex < state.queue.length - 1
  const hasPrevious = state.queueIndex > 0

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
        hasNext,
        hasPrevious,
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
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}
