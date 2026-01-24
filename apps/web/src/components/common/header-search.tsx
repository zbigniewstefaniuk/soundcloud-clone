import { useState, useEffect, useRef } from 'react'
import { Search, X, Music2, Play, Loader2 } from 'lucide-react'
import { useTrackSearch } from '@/hooks/use-search'
import { usePlayer } from '@/contexts/player-context'
import { TrackCover } from '@/components/tracks/track-cover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@/api/search'
import type { TrackWithUser } from '@/api/tracks'

const MIN_QUERY_LENGTH = 2

function toPlayableTrack(result: SearchResult): TrackWithUser {
  return {
    id: result.id,
    title: result.title,
    description: result.description,
    genre: result.genre,
    mainArtist: result.mainArtist,
    coverArtUrl: result.coverArtUrl,
    playCount: result.playCount,
    likeCount: result.likeCount,
    user: result.user,
    userId: result.user?.id ?? '',
    audioUrl: '',
    fileSize: 0,
    mimeType: 'audio/mpeg',
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { results, isLoading, isFetching, isDebouncing } = useTrackSearch(query)
  const { playTrack } = usePlayer()

  const tracks = results.map(toPlayableTrack)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
    }
  }, [open])

  const handleSelect = (index: number) => {
    playTrack(tracks[index], tracks)
    setOpen(false)
    setQuery('')
  }

  const isValidQuery = query.trim().length >= MIN_QUERY_LENGTH
  const showLoading = (isLoading || isFetching || isDebouncing) && isValidQuery

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              'bg-muted/50 hover:bg-muted transition-colors',
              'text-sm text-muted-foreground',
              'w-64 justify-between',
            )}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search tracks...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background rounded border">
              <span className="text-xs">Ctrl</span>K
            </kbd>
          </button>
        }
      />
      <PopoverContent className="w-100 p-0" align="start" sideOffset={8}>
        <Command shouldFilter={false} className="rounded-lg">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, genres..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {showLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />}
            {query && !showLoading && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-accent rounded">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <CommandList className="max-h-100">
            {isValidQuery && !isLoading && !isDebouncing && results.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center py-6">
                  <Music2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No tracks found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                </div>
              </CommandEmpty>
            )}
            {!isValidQuery && (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Type at least {MIN_QUERY_LENGTH} characters to search
                </p>
              </div>
            )}
            {results.length > 0 && (
              <CommandGroup heading={`Results (${results.length})`}>
                {results.map((result, index) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelect(index)}
                    className="flex items-center gap-3 p-2 cursor-pointer"
                  >
                    <TrackCover
                      coverArtUrl={result.coverArtUrl}
                      title={result.title}
                      size="sm"
                      className="w-12 h-12 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.mainArtist || result.user?.username}
                      </p>
                      {result.genre && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                          {result.genre}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Play className="h-3 w-3" />
                      {result.playCount}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
