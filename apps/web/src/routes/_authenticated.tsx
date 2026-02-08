import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Spinner } from '@/components/ui/spinner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAccount, useLogin } from '@/hooks/use-auth'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAccount()
  const { mutate: login, isPending: isLoggingIn, error: loginError } = useLogin()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">
          <Spinner className="size-8 text-foreground" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)

      await login({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      })
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-lg text-muted-foreground bg-card p-8 shadow-lg shadow-primary/10">
          <h2 className="mb-6 text-2xl font-bold">Sign In Required</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required className="mt-2 w-full" />
            </div>

            <div>
              <Label>Password</Label>
              <Input name="password" type="password" required className="mt-2 w-full" />
            </div>

            {loginError && <p className="text-sm text-error">{loginError.message}</p>}

            <Button type="submit" disabled={isLoggingIn} className="w-full">
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <main className="flex justify-center-safe min-h-[calc(100dvh-56px)] max-h-dvh w-full px-8">
      <Outlet />
    </main>
  )
}
