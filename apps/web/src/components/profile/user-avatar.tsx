import { User } from 'lucide-react'
import { cn, getAssetUrl } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface UserAvatarProps {
  avatarUrl?: string | null
  displayName?: string | null
  username: string
  size?: Size
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
} satisfies Record<Size, string>

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
} satisfies Record<Size, string>

export function UserAvatar({
  avatarUrl,
  displayName,
  username,
  size = 'lg',
  className,
}: UserAvatarProps) {
  const imageUrl = getAssetUrl(avatarUrl)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={displayName || username}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 flex items-center justify-center',
        sizeClasses[size],
        className,
      )}
    >
      <User className={cn('text-primary', iconSizes[size])} />
    </div>
  )
}
