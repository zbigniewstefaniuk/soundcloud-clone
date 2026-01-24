import { createFileRoute, Link } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/login-form'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <LoginForm />
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/auth/register" className="font-medium text-primary hover:text-primary/80">
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}
