import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Home, LogIn, LogOut, Menu, UserPlus, X, Music2, Sun, Moon, ListMusic } from 'lucide-react'
import { Button } from '../ui/button'
import { useAccount } from '@/hooks/use-auth'
import { useTheme } from '@/contexts/theme-context'
import { usePlayer } from '@/contexts/player-context'
import { QueueSidebar } from '@/components/player/queue-sidebar'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const { user, isLoading, logout } = useAccount()
  const { theme, toggleTheme } = useTheme()
  const { queue } = usePlayer()

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <Music2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">MusicApp</span>
          </Link>

          <div className="flex-1" />

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
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/register">Sign up</Link>
              </Button>
            </div>
          )}

          {!isLoading && user && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Menu Sidebar (left) */}
      {isMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 cursor-default"
          onClick={() => setIsMenuOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-50 transform transition-transform duration-200 ease-out flex flex-col ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <span className="font-semibold">Menu</span>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <NavLink to="/" icon={<Home className="h-5 w-5" />} onClick={() => setIsMenuOpen(false)}>
            Home
          </NavLink>

          {!isLoading && user && (
            <NavLink to="/profile/tracks" icon={<Music2 className="h-5 w-5" />} onClick={() => setIsMenuOpen(false)}>
              My Tracks
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          {!isLoading && user ? (
            <div className="space-y-3">
              <div className="px-3 py-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button
                onClick={() => {
                  logout()
                  setIsMenuOpen(false)
                }}
                variant="outline"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" asChild>
                <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create account
                </Link>
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Queue Sidebar (right) */}
      <QueueSidebar isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </>
  )
}

function NavLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-1"
      activeProps={{
        className: 'flex items-center gap-3 px-3 py-2 rounded-md bg-primary text-primary-foreground mb-1',
      }}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  )
}
