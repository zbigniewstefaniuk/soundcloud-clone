import { Link } from '@tanstack/react-router'

type Collaborator = {
  id: string
  username: string
  role: string | null
}

interface ArtistNameProps {
  user: { id: string; username: string } | null
  collaborators?: Collaborator[]
  className?: string
}

export function ArtistName({ user, collaborators, className }: ArtistNameProps) {
  const featured = collaborators?.filter((c) => c.role === 'featured') ?? []

  return (
    <p className={className}>
      <Link
        to="/profile/$profileId"
        params={{ profileId: user?.id ?? '' }}
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {user?.username || 'Unknown Artist'}
      </Link>
      {featured.length > 0 && (
        <span>
          {' ft. '}
          {featured.map((c, i, arr) => (
            <span key={c.id}>
              <Link
                to="/profile/$profileId"
                params={{ profileId: c.id }}
                className="hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {c.username}
              </Link>
              {i < arr.length - 1 && ', '}
            </span>
          ))}
        </span>
      )}
    </p>
  )
}
