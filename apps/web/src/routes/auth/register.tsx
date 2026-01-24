import { createFileRoute, Link } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/register-form'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <RegisterForm />
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/auth/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
