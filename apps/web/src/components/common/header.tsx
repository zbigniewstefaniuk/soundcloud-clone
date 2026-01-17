import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import { ClipboardType, Home, LogIn, LogOut, Menu, Network, UserPlus, X } from 'lucide-react'
import { useCurrentUser, useLogout } from '../hooks/use-auth'
import { Button } from './ui/button'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: user, isLoading } = useCurrentUser()
  const logout = useLogout()

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/">
            <img
              src="/tanstack-word-logo-white.svg"
              alt="TanStack Logo"
              className="h-10"
            />
          </Link>
        </h1>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Demo Links Start */}

          <Link
            to="/demo/form/simple"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <ClipboardType size={20} />
            <span className="font-medium">Simple Form</span>
          </Link>

          <Link
            to="/demo/form/address"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <ClipboardType size={20} />
            <span className="font-medium">Address Form</span>
          </Link>

          <Link
            to="/demo/tanstack-query"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Network size={20} />
            <span className="font-medium">TanStack Query</span>
          </Link>

          {/* Demo Links End */}
        </nav>

        <div className="p-4 border-t border-gray-700">
          {!isLoading && user ? (
            <div className="space-y-3">
              <div className="px-3 py-2 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
              <Button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                variant="outline"
                className="w-full"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/auth/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors font-medium"
              >
                <LogIn size={16} />
                Sign in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full p-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors font-medium"
              >
                <UserPlus size={16} />
                Create account
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
