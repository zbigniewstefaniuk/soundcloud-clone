import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import * as ShadcnSelect from '@/components/ui/select'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { ZodError } from 'zod'
import { useRef, useState, type ComponentProps } from 'react'
import { useFieldContext, useFormContext } from '@/hooks/form-context'
import { ImageIcon, Music, X } from 'lucide-react'

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}

function ErrorMessages({ errors }: { errors: (string | ZodError)[] }) {
  return (
    <>
      {errors.map((error, index) => (
        <div
          key={typeof error === 'string' ? `${error}_${index}` : `${error.message}_${index}`}
          className="mt-1 text-sm text-red-600"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  )
}

export function TextField({
  label,
  placeholder,
  ...rest
}: {
  label: string
  placeholder?: string
} & ComponentProps<typeof Input>) {
  const field = useFieldContext<string>()
  const errors = field.state.meta.errors as (string | ZodError)[]

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Input
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        {...rest}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function TextArea({ label, rows = 3 }: { label: string; rows?: number }) {
  const field = useFieldContext<string>()
  const errors = field.state.meta.errors as (string | ZodError)[]

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Select({
  label,
  values,
  placeholder,
}: {
  label: string
  values: Array<{ label: string; value: string }>
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = field.state.meta.errors as (string | ZodError)[]

  return (
    <div>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => value && field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            <ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Slider({ label }: { label: string }) {
  const field = useFieldContext<number>()
  const errors = field.state.meta.errors as (string | ZodError)[]

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Switch({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  const errors = field.state.meta.errors as (string | ZodError)[]

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/x-wav',
]

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

export function AudioFileField({ label }: { label: string }) {
  const field = useFieldContext<File | null>()
  const errors = field.state.meta.errors as (string | ZodError)[]
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)

  const validateAndSetFile = (file: File) => {
    setDragError(null)

    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      setDragError('Invalid file type. Please upload MP3, WAV, FLAC, AAC or M4A.')
      return
    }

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      setDragError('File too large. Maximum size is 100MB.')
      return
    }

    field.handleChange(file)
    setFileName(file.name)
    setFileSize(file.size)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleRemove = () => {
    field.handleChange(null)
    setFileName('')
    setFileSize(0)
    setDragError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>

      <div className="mt-2">
        {!fileName ? (
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            type="button"
            className={`
              w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${
                isDragOver
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 scale-[1.02]'
                  : 'border-gray-300 hover:border-cyan-500 dark:border-gray-600'
              }
              ${dragError ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : ''}
            `}
          >
            <Music
              className={`mx-auto h-12 w-12 transition-colors ${
                isDragOver ? 'text-cyan-500' : 'text-gray-400'
              }`}
            />
            <p
              className={`mt-2 text-sm ${isDragOver ? 'text-cyan-600' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {isDragOver ? 'Drop your audio file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              MP3, WAV, FLAC, AAC, M4A up to 100MB
            </p>
            {dragError && <p className="mt-2 text-sm text-red-600 font-medium">{dragError}</p>}
          </button>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Music className="h-8 w-8 text-cyan-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-50">
                  {fileName}
                </p>
                <p className="text-xs text-gray-500">{(fileSize / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_AUDIO_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function ImageFileField({ label }: { label: string }) {
  const field = useFieldContext<File | null>()
  const errors = field.state.meta.errors as (string | ZodError)[]
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)

  const validateAndSetFile = (file: File) => {
    setDragError(null)

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setDragError('Invalid file type. Please upload PNG or JPG.')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setDragError('File too large. Maximum size is 5MB.')
      return
    }

    field.handleChange(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleRemove = () => {
    field.handleChange(null)
    setPreview('')
    setDragError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>

      <div className="mt-2">
        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            type="button"
            className={`
              w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${
                isDragOver
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 scale-[1.02]'
                  : 'border-gray-300 hover:border-cyan-500 dark:border-gray-600'
              }
              ${dragError ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : ''}
            `}
          >
            <ImageIcon
              className={`mx-auto h-12 w-12 transition-colors ${
                isDragOver ? 'text-cyan-500' : 'text-gray-400'
              }`}
            />
            <p
              className={`mt-2 text-sm ${isDragOver ? 'text-cyan-600' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {isDragOver ? 'Drop your image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              PNG, JPG up to 5MB (Optional)
            </p>
            {dragError && <p className="mt-2 text-sm text-red-600 font-medium">{dragError}</p>}
          </button>
        ) : (
          <div className="relative group">
            <img
              src={preview}
              alt="Cover art preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
