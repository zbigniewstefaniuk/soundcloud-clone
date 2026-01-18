import { useEffect, useRef } from 'react'

export function useBroadcastChannel<T>(
  channelName: string,
  onMessage: (message: T) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    channelRef.current = new BroadcastChannel(channelName)

    const handleMessage = (event: MessageEvent<T>) => {
      onMessage(event.data)
    }

    channelRef.current.addEventListener('message', handleMessage)

    return () => {
      channelRef.current?.removeEventListener('message', handleMessage)
      channelRef.current?.close()
    }
  }, [channelName, onMessage])

  const broadcast = (message: T) => {
    channelRef.current?.postMessage(message)
  }

  return { broadcast }
}
