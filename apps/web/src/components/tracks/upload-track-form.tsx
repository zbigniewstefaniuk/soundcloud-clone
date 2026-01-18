import { z } from 'zod'
import { useUploadTrack } from '@/hooks/use-tracks'
import { Button } from '@/components/ui/button'
import { useAppForm } from '@/hooks/form'
import { Suspense } from 'react'
import { Spinner } from '../ui/spinner';

const MAX_AUDIO_SIZE = 100 * 1024 * 1024
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const uploadTrackSchema = z.object({
  file: z
    .instanceof(File, { message: 'Audio file is required' })
    .refine((file) => file.size <= MAX_AUDIO_SIZE, 'Audio file must be less than 100MB')
    .refine(
      (file) =>
        ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/flac', 'audio/x-wav'].includes(file.type),
      'Must be MP3, WAV, FLAC, AAC or M4A'
    ),
  coverArt: z
    .instanceof(File)
    .optional()
    .nullable()
    .refine(
      (file) => !file || file.size <= MAX_IMAGE_SIZE,
      'Image must be less than 5MB'
    )
    .refine(
      (file) =>
        !file || ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type),
      'Must be PNG or JPG'
    ),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  genre: z.string().max(50, 'Genre too long').optional(),
  mainArtist: z.string().max(100, 'Artist name too long').optional(),
  isPublic: z.boolean(),
})

export function UploadTrackForm() {
  const uploadMutation = useUploadTrack()

  const form = useAppForm({
    defaultValues: {
      file: null as File | null,
      coverArt: null as File | null,
      title: '',
      description: '',
      genre: '',
      mainArtist: '',
      isPublic: true,
    },
    validators: {
      onSubmit: uploadTrackSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      if (!value.file) return

      uploadMutation.mutate({
        file: value.file,
        coverArt: value.coverArt ?? undefined,
        title: value.title,
        description: value.description || undefined,
        genre: value.genre || undefined,
        mainArtist: value.mainArtist || undefined,
        isPublic: value.isPublic,
      })

      // formApi.reset()
    },
  })

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Upload Track</h1>
        <p className="text-muted-foreground">Share your music with the world</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <div className='flex gap-10 justify-between'>
            <form.AppField name="file">
              {(field) => <field.AudioFileField label="Audio File" />}
            </form.AppField>

            <form.AppField name="coverArt">
              {(field) => <field.ImageFileField label="Cover Art (Optional)" />}
            </form.AppField>
          </div>

          <form.AppField name="title">
            {(field) => (
              <field.TextField
                label="Title"
                placeholder="Enter track title"
                type="text"
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextArea label="Description (Optional)" rows={4} />
            )}
          </form.AppField>

          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="genre">
              {(field) => (
                <field.TextField
                  label="Genre"
                  placeholder="e.g., Electronic"
                  type="text"
                />
              )}
            </form.AppField>

            <form.AppField name="mainArtist">
              {(field) => (
                <field.TextField
                  label="Artist"
                  placeholder="Artist name"
                  type="text"
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="isPublic">
            {(field) => <field.Switch label="Make track public" />}
          </form.AppField>

          {uploadMutation.error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : 'Upload failed. Please try again.'}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? <Spinner /> : 'Upload Track'}
          </Button>
        </form>
      </Suspense>
    </div>
  )
}
