export interface Track {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  mainArtist?: string | null;
  audioUrl: string;
  coverArtUrl?: string | null;
  duration?: number | null;
  fileSize: number;
  mimeType: string;
  playCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrackInput {
  title: string;
  description?: string;
  genre?: string;
  mainArtist?: string;
  isPublic?: boolean;
}

export interface UpdateTrackInput {
  title?: string;
  description?: string;
  genre?: string;
  mainArtist?: string;
  isPublic?: boolean;
}

export interface TrackQueryParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'playCount';
  order?: 'asc' | 'desc';
}

export interface TrackWithUser extends Track {
  user: {
    id: string;
    username: string;
  };
  likeCount?: number;
  isLiked?: boolean;
}
