import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import type { TrackWithUser } from '@/api/tracks'
import { getStreamUrl } from '@/api/tracks'

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

interface PlayerContextValue extends PlayerState {
  playTrack: (track: TrackWithUser, queue?: TrackWithUser[]) => void
  addToQueue: (track: TrackWithUser) => void
  next: () => void
  previous: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  audioRef: React.RefObject<HTMLAudioElement>
  hasNext: boolean
  hasPrevious: boolean
  toggleMute: () => void
  mute: () => void
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    isMuted: false
  })

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
      } catch (e) {
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

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }))
    }

    const handleDurationChange = () => {
      setState((prev) => ({ ...prev, duration: audio.duration }))
    }

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }))
      // Auto-play next track
      if (state.queueIndex < state.queue.length - 1) {
        next()
      }
    }

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }))
    }

    audio.addEventListener('timeupdate', handleTimeUpdate, { signal })
    audio.addEventListener('durationchange', handleDurationChange, { signal })
    audio.addEventListener('ended', handleEnded, { signal })
    audio.addEventListener('play', handlePlay, { signal })
    audio.addEventListener('pause', handlePause, { signal })

    return () => {
      controller.abort()

    }
  }, [state.queueIndex, state.queue.length])

  const playTrack = useCallback((track: TrackWithUser, queue?: TrackWithUser[]) => {
    const newQueue = queue || [track]
    const index = newQueue.findIndex((t) => t.id === track.id)

    setState((prev) => ({
      ...prev,
      currentTrack: track,
      queue: newQueue,
      queueIndex: index >= 0 ? index : 0,
      isPlaying: true,
    }))

    if (audioRef.current) {
      audioRef.current.src = getStreamUrl(track.id)
      audioRef.current.play()
    }
  }, [])

  const addToQueue = useCallback((track: TrackWithUser) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, track],
    }))
  }, [])

  const next = useCallback(() => {
    if (state.queueIndex < state.queue.length - 1) {
      const nextTrack = state.queue[state.queueIndex + 1]
      setState((prev) => ({
        ...prev,
        currentTrack: nextTrack,
        queueIndex: prev.queueIndex + 1,
        isPlaying: true,
      }))

      if (audioRef.current) {
        audioRef.current.src = getStreamUrl(nextTrack.id)
        audioRef.current.play()
      }
    }
  }, [state.queueIndex, state.queue])

  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
    } else if (state.queueIndex > 0) {
      const prevTrack = state.queue[state.queueIndex - 1]
      setState((prev) => ({
        ...prev,
        currentTrack: prevTrack,
        queueIndex: prev.queueIndex - 1,
        isPlaying: true,
      }))

      if (audioRef.current) {
        audioRef.current.src = getStreamUrl(prevTrack.id)
        audioRef.current.play()
      }
    }
  }, [state.queueIndex, state.queue])

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }, [state.isPlaying])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      setState((prev) => ({ ...prev, volume }))
    }
  }, [])



  const toggleMute = () => {
    if (state.isMuted) {
      setVolume(state.volume || 1)
      setState((prev) => ({ ...prev, isMuted: false }))
    } else {
      setVolume(0)
      setState((prev) => ({ ...prev, isMuted: true }))
    }
  }

  const mute = () => {
    if (audioRef.current) {
      audioRef.current.muted = true
      setState((prev) => ({ ...prev, isMuted: true, volume: 0 }))
    }
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
