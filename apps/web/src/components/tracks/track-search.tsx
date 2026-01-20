import { useState, useEffect } from 'react'
import { Search, Music2, Play } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { TrackCover } from './track-cover'
import { cn } from '@/lib/utils'
import type { TrackWithUser } from '@/api/tracks'
import { useDebouncedValue } from '@tanstack/react-pacer';

interface TrackSearchProps {
  tracks: TrackWithUser[]
  onSelect?: (track: TrackWithUser) => void
  onSearchChange?: (query: string) => void
  placeholder?: string
  className?: string
}

export function TrackSearch({
  tracks,
  onSelect,
  onSearchChange,
  placeholder = 'Search tracks...',
  className,
}: TrackSearchProps) {
  const [query, setQuery] = useState('')
  const [filteredTracks, setFilteredTracks] = useState<TrackWithUser[]>(tracks)

  useEffect(() => {
    if (!query.trim()) {
      setFilteredTracks(tracks)
      return
    }

    const lowerQuery = query.toLowerCase()
    const filtered = tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(lowerQuery) ||
        track.mainArtist?.toLowerCase().includes(lowerQuery) ||
        track.user?.username?.toLowerCase().includes(lowerQuery) ||
        track.genre?.toLowerCase().includes(lowerQuery)
    )
    setFilteredTracks(filtered)
  }, [query, tracks])

  const handleValueChange = (value: string) => {
    setQuery(value)
    onSearchChange?.(value)
  }

  return (
    <Command
      className={cn('rounded-lg border bg-background shadow-sm', className)}
      shouldFilter={false}
    >
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={handleValueChange}
      />
      <CommandList>
        {query && filteredTracks.length === 0 && (
          <CommandEmpty>
            <div className="flex flex-col items-center py-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tracks found</p>
            </div>
          </CommandEmpty>
        )}
        {filteredTracks.length > 0 && (
          <CommandGroup heading={query ? `Results (${filteredTracks.length})` : undefined}>
            {filteredTracks.slice(0, 10).map((track) => (
              <CommandItem
                key={track.id}
                value={track.id}
                onSelect={() => onSelect?.(track)}
                className="flex items-center gap-3 p-2 cursor-pointer"
              >
                <TrackCover
                  coverArtUrl={track.coverArtUrl}
                  title={track.title}
                  size="sm"
                  className="w-10 h-10 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.mainArtist || track.user?.username}
                  </p>
                </div>
                {track.genre && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {track.genre}
                  </span>
                )}
              </CommandItem>
            ))}
            {filteredTracks.length > 10 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                +{filteredTracks.length - 10} more results
              </div>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}

interface TrackSearchInputProps {
  tracks: TrackWithUser[]
  onFilteredTracksChange: (tracks: TrackWithUser[]) => void
  placeholder?: string
  className?: string
}

export function TrackSearchInput({
  tracks,
  onFilteredTracksChange,
  placeholder = 'Search your tracks...',
  className,
}: TrackSearchInputProps) {
  const [query, setQuery] = useState('')

  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 300
  });

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      onFilteredTracksChange(tracks)
      return
    }

    const lowerQuery = debouncedQuery.toLowerCase()
    const filtered = tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(lowerQuery) ||
        track.mainArtist?.toLowerCase().includes(lowerQuery) ||
        track.user?.username?.toLowerCase().includes(lowerQuery) ||
        track.genre?.toLowerCase().includes(lowerQuery)
    )
    onFilteredTracksChange(filtered)
  }, [debouncedQuery, tracks, onFilteredTracksChange])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <span className="sr-only">Clear</span>
          <span className="text-xs">Clear</span>
        </button>
      )}
    </div>
  )
}
