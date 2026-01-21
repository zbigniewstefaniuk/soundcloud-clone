import { mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_AUDIO_SIZE,
  MAX_IMAGE_SIZE,
  UPLOAD_PATHS,
} from '../config/constants'
import { ValidationError } from '../middleware/error'

export class FileService {
  async initializeDirectories() {
    const dirs = Object.values(UPLOAD_PATHS)

    await Promise.all(dirs.map((dir) => mkdir(dir, { recursive: true })))
  }

  validateAudioFile(file: File) {
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      throw new ValidationError(`Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}`)
    }

    if (file.size > MAX_AUDIO_SIZE) {
      throw new ValidationError(`Audio file too large. Max size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`)
    }
  }

  validateImageFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ValidationError(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new ValidationError(`Image file too large. Max size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`)
    }
  }

  async uploadAudio(file: File, userId: string): Promise<string> {
    this.validateAudioFile(file)

    const ext = file.name.split('.').pop()
    const filename = `${createId()}.${ext}`
    const userDir = join(UPLOAD_PATHS.tracks, userId)

    await mkdir(userDir, { recursive: true })

    const filePath = join(userDir, filename)
    await Bun.write(filePath, file)

    return filePath.replace(/\\/g, '/')
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    this.validateImageFile(file)

    const ext = file.name.split('.').pop()
    const filename = `${userId}.${ext}`
    const filePath = join(UPLOAD_PATHS.avatars, filename)

    await Bun.write(filePath, file)

    return filePath.replace(/\\/g, '/')
  }

  async uploadCover(file: File, trackId: string): Promise<string> {
    this.validateImageFile(file)

    const ext = file.name.split('.').pop()
    const filename = `${trackId}.${ext}`
    const filePath = join(UPLOAD_PATHS.covers, filename)

    await Bun.write(filePath, file)

    return filePath.replace(/\\/g, '/')
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath)
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error)
    }
  }
}

export const fileService = new FileService()
