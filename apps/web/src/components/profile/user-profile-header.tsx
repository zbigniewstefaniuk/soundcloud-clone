import { Calendar, MapPin, Globe } from 'lucide-react'
import { UserAvatar } from './user-avatar'
import type { UserProfile } from '@/api/users'

interface UserProfileHeaderProps {
  user: UserProfile
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const { username, createdAt, profile } = user
  const displayName = profile?.displayName || username
  const joinDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <UserAvatar
        avatarUrl={profile?.avatarUrl}
        displayName={displayName}
        username={username}
        size="xl"
      />

      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <p className="text-muted-foreground">@{username}</p>

        {profile?.bio && <p className="mt-3 text-sm text-foreground max-w-xl">{profile.bio}</p>}

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
          {profile?.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          )}

          {profile?.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}

          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {joinDate}
          </span>
        </div>
      </div>
    </div>
  )
}
