import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { LogOut, Music2, Sun, Moon, ListMusic, User, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { useAccount } from '@/hooks/use-auth'
import { useTheme } from '@/contexts/theme-context'
import { usePlayer } from '@/contexts/player-context'
import { QueueSidebar } from '@/components/player/queue-sidebar'
import { HeaderSearch } from './header-search'

export default function Header() {
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const { user, isLoading, logout } = useAccount()
  const { theme, toggleTheme } = useTheme()
  const { queue } = usePlayer()

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Music2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg hidden sm:inline">MusicApp</span>
          </Link>

          <div className="flex-1 flex justify-center mx-4">
            <HeaderSearch />
          </div>

          <button
            onClick={() => setIsQueueOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors relative"
            aria-label="Open queue"
          >
            <ListMusic className="h-5 w-5" />
            {queue.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                {queue.length > 9 ? '9+' : queue.length}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {!isLoading && !user && (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" render={<Link to="/auth/login">Sign in</Link>} />
              <Button size="sm" render={<Link to="/auth/register">Sign up</Link>} />
            </div>
          )}

          {!isLoading && user && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{user.username}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="border-t border-border pt-2 space-y-1">
                  <Link
                    to="/profile/tracks"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    to="/tracks/upload"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                  >
                    <Music2 className="h-4 w-4" />
                    Upload Track
                  </Link>
                </div>
                <div className="border-t border-border mt-2 pt-2">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors w-full text-left text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>

      <QueueSidebar isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  )
}
