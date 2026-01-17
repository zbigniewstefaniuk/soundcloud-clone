// Application constants

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/ogg', // .ogg
  'audio/aac', // .aac
  'audio/mp4', // .m4a
  'audio/x-m4a', // .m4a
];

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', // .jpg, .jpeg
  'image/png', // .png
  'image/webp', // .webp
];

export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const BCRYPT_SALT_ROUNDS = 12;

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
};

export const UPLOAD_PATHS = {
  tracks: 'uploads/tracks',
  avatars: 'uploads/avatars',
  covers: 'uploads/covers',
};
