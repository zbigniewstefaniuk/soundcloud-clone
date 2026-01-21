import { z } from 'zod'
import { Button } from '../ui/button'
import { useAppForm } from '@/hooks/form'
import { useRegister } from '@/hooks/use-auth'

const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(30, 'Username must be 30 characters or less'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export function RegisterForm() {
  const registerMutation = useRegister()

  const form = useAppForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      registerMutation.mutate(value)
    },
  })

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-gray-500">Enter your information to get started</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.AppField name="username">
          {(field) => <field.TextField label="Username" placeholder="john_doe" />}
        </form.AppField>

        <form.AppField name="email">
          {(field) => <field.TextField label="Email" placeholder="sBw0l@example.com" />}
        </form.AppField>

        <form.AppField name="password">
          {(field) => <field.TextField label="Password" type="password" placeholder="••••••••" />}
        </form.AppField>

        {registerMutation.error && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">
              {registerMutation.error instanceof Error
                ? registerMutation.error.message
                : 'Registration failed. Please try again.'}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </div>
  )
}
