import { z } from 'zod'
import { Button } from '../ui/button'
import { useAppForm } from '@/hooks/form'
import { Suspense } from 'react'
import { useLogin } from '@/hooks/use-auth'

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginForm() {
  const loginMutation = useLogin()

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
      onChange: loginSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      loginMutation.mutate(value)
      formApi.reset()
    },
  })

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">Enter your credentials to sign in</p>
      </div>
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Email" placeholder="Enter your email" type="email" />
            )}
          </form.AppField>

          <form.AppField name="password">
            {(field) => <field.TextField label="Password" type="password" placeholder="••••••••" />}
          </form.AppField>

          {loginMutation.error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : 'Login failed. Please check your credentials.'}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Suspense>
    </div>
  )
}
