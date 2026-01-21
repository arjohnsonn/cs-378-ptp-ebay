'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithOtp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error === 'auth' ? 'Authentication failed. Please try again.' : null
  )
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.set('email', email)

    const result = await signInWithOtp(formData)
    setPending(false)

    if (result.error) {
      setErrorMessage(result.error)
    } else {
      setEmailSent(true)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Shortlist
            </Link>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Sell faster with<br />
              <span className="text-accent-foreground/90">short-form video</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              The marketplace where products come alive. Create engaging shorts, reach more buyers, and close deals faster.
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm text-primary-foreground/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>10k+ sellers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>50k+ listings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>$2M+ sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              Shortlist
            </Link>
          </div>

          {emailSent ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
                <p className="text-muted-foreground mt-2">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Click the link in the email to sign in. The link will expire in 1 hour.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                className="rounded-full"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Welcome</h2>
                <p className="text-muted-foreground">
                  Enter your email to sign in or create an account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 animate-in">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={pending}
                    className="h-12 px-4 bg-secondary/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                >
                  {pending ? 'Sending...' : 'Continue with Email'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                We&apos;ll send you a magic link to sign in instantly.
                <br />No password needed.
              </p>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link href="#" className="underline hover:text-foreground">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
