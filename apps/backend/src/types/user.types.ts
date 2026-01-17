export interface UserProfile {
  id: string;
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileInput {
  bio?: string;
  displayName?: string;
  location?: string;
  website?: string;
}

export interface UserWithProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  profile?: UserProfile;
}
