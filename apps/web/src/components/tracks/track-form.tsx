import { z } from 'zod'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAppForm } from '@/hooks/form'
import { useUploadTrack, useUpdateTrack } from '@/hooks/use-tracks'

const MAX_AUDIO_SIZE = 100 * 1024 * 1024
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/x-wav',
] as const

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const

const coverArtSchema = z
  .instanceof(File)
  .optional()
  .nullable()
  .refine((file) => !file || file.size <= MAX_IMAGE_SIZE, 'Image must be less than 5MB')
  .refine(
    (file) =>
      !file || ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]),
    'Must be PNG or JPG',
  )

const trackMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  genre: z.string().max(50, 'Genre too long').optional(),
  mainArtist: z.string().max(100, 'Artist name too long').optional(),
  isPublic: z.boolean(),
})

const createTrackSchema = trackMetadataSchema.extend({
  file: z
    .instanceof(File, { message: 'Audio file is required' })
    .refine((file) => file.size <= MAX_AUDIO_SIZE, 'Audio file must be less than 100MB')
    .refine(
      (file) => ALLOWED_AUDIO_TYPES.includes(file.type as (typeof ALLOWED_AUDIO_TYPES)[number]),
      'Must be MP3, WAV, FLAC, AAC or M4A',
    ),
  coverArt: coverArtSchema,
})

const editTrackSchema = trackMetadataSchema.extend({
  coverArt: coverArtSchema,
})

type TrackMetadata = z.infer<typeof trackMetadataSchema>

interface CreateModeProps {
  mode: 'create'
}

interface EditModeProps {
  mode: 'edit'
  trackId: string
  initialData: TrackMetadata
  existingCoverArtUrl?: string
}

type TrackFormProps = CreateModeProps | EditModeProps

export function TrackForm(props: TrackFormProps) {
  if (props.mode === 'create') {
    return <CreateTrackForm />
  }

  return (
    <EditTrackForm
      trackId={props.trackId}
      initialData={props.initialData}
      existingCoverArtUrl={props.existingCoverArtUrl}
    />
  )
}

function CreateTrackForm() {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSubmit: createTrackSchema as any,
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

      formApi.reset()
    },
  })

  return (
    <div className="w-full max-w-4xl mx-auto px-8 md:px-12 lg:px-16 py-6 space-y-6">
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
          className="space-y-5"
        >
          <div className="flex gap-10 justify-between">
            <form.AppField name="file">
              {(field) => <field.AudioFileField label="Audio File" />}
            </form.AppField>

            <form.AppField name="coverArt">
              {(field) => <field.ImageFileField label="Cover Art (Optional)" />}
            </form.AppField>
          </div>

          <form.AppField name="title">
            {(field) => (
              <field.TextField label="Title" placeholder="Enter track title" type="text" />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => <field.TextArea label="Description (Optional)" rows={4} />}
          </form.AppField>

          <div className="grid grid-cols-2 gap-6">
            <form.AppField name="genre">
              {(field) => (
                <field.TextField label="Genre" placeholder="e.g., Electronic" type="text" />
              )}
            </form.AppField>

            <form.AppField name="mainArtist">
              {(field) => <field.TextField label="Artist" placeholder="Artist name" type="text" />}
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

          <Button type="submit" className="w-full" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? <Spinner /> : 'Upload Track'}
          </Button>
        </form>
      </Suspense>
    </div>
  )
}

interface EditTrackFormProps {
  trackId: string
  initialData: TrackMetadata
  existingCoverArtUrl?: string
}

function EditTrackForm({ trackId, initialData, existingCoverArtUrl }: EditTrackFormProps) {
  const updateMutation = useUpdateTrack(trackId)

  const form = useAppForm({
    defaultValues: {
      title: initialData.title,
      description: initialData.description ?? '',
      genre: initialData.genre ?? '',
      mainArtist: initialData.mainArtist ?? '',
      isPublic: initialData.isPublic,
      coverArt: null as File | null,
    },
    validators: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSubmit: editTrackSchema as any,
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate({
        title: value.title,
        description: value.description || undefined,
        genre: value.genre || undefined,
        mainArtist: value.mainArtist || undefined,
        isPublic: value.isPublic,
        coverArt: value.coverArt ?? undefined,
      })
    },
  })

  return (
    <div className="w-full max-w-4xl mx-auto px-8 md:px-12 lg:px-16 py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Edit Track</h1>
        <p className="text-muted-foreground">Update your track information</p>
        {existingCoverArtUrl && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Current cover art:</p>
            <img
              src={existingCoverArtUrl}
              alt="Current cover art"
              className="w-full max-w-md h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-5"
        >
          <form.AppField name="title">
            {(field) => (
              <field.TextField label="Title" placeholder="Enter track title" type="text" />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => <field.TextArea label="Description (Optional)" rows={4} />}
          </form.AppField>

          <div className="grid grid-cols-2 gap-6">
            <form.AppField name="genre">
              {(field) => (
                <field.TextField label="Genre" placeholder="e.g., Electronic" type="text" />
              )}
            </form.AppField>

            <form.AppField name="mainArtist">
              {(field) => <field.TextField label="Artist" placeholder="Artist name" type="text" />}
            </form.AppField>
          </div>

          <form.AppField name="coverArt">
            {(field) => <field.ImageFileField label="Update Cover Art (Optional)" />}
          </form.AppField>

          <form.AppField name="isPublic">
            {(field) => <field.Switch label="Make track public" />}
          </form.AppField>

          {updateMutation.error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : 'Update failed. Please try again.'}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Spinner /> : 'Update Track'}
          </Button>
        </form>
      </Suspense>
    </div>
  )
}
