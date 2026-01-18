import { createFileRoute } from '@tanstack/react-router'
import { useTrack, useUpdateTrack } from '@/hooks/use-tracks'
import { Button } from '@/components/ui/button'
import { useAppForm } from '@/hooks/form'
import { z } from 'zod'
import { Spinner } from '@/components/ui/spinner'
import { Suspense } from 'react'
import { getAssetUrl } from '@/lib/utils';

export const Route = createFileRoute('/tracks/$trackId/edit')({
  component: EditTrackPage,
})

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const updateTrackSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  genre: z.string().max(50, 'Genre too long').optional(),
  mainArtist: z.string().max(100, 'Artist name too long').optional(),
  isPublic: z.boolean().default(true),
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
})

function EditTrackPage() {
  const { trackId } = Route.useParams()
  const { track, isLoading, isError } = useTrack(trackId)
  const updateMutation = useUpdateTrack(trackId)

  const form = useAppForm({
    defaultValues: {
      title: track?.title ?? '',
      description: track?.description ?? '',
      genre: track?.genre ?? '',
      mainArtist: track?.mainArtist ?? '',
      isPublic: track?.isPublic ?? true,
      coverArt: undefined as File | undefined,
    } satisfies z.input<typeof updateTrackSchema>,
    validators: {
      onSubmit: updateTrackSchema,
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate(value)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (isError || !track) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground mt-2">Track not found</p>
        </div>
      </div>
    )
  }

  const coverArtURL = getAssetUrl(track.coverArtUrl);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Edit Track</h1>
          <p className="text-muted-foreground">Update your track information</p>
          {coverArtURL && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Current cover art:</p>
              <img
                src={coverArtURL}
                alt={track.title}
                className="w-32 h-32 object-cover rounded-lg"
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
            className="space-y-6"
          >
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

            <form.AppField name="coverArt">
              {(field) => (
                <field.ImageFileField label="Update Cover Art (Optional)" />
              )}
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

            {updateMutation.isSuccess && (
              <div className="rounded-md bg-primary/10 p-3">
                <p className="text-sm text-primary">Track updated successfully!</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Spinner /> : 'Update Track'}
            </Button>
          </form>
        </Suspense>
      </div>
    </div>
  )
}
