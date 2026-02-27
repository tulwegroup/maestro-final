'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Zap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link 
              href="/auth/signup" 
              className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SignInLoading() {
  return (
    <Card className="border-slate-200 shadow-xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </CardContent>
    </Card>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-2xl text-slate-900">MAESTRO</h1>
              <p className="text-xs text-slate-500">UAE Life Automation</p>
            </div>
          </Link>
        </div>

        <Suspense fallback={<SignInLoading />}>
          <SignInForm />
        </Suspense>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Secured with 256-bit encryption</span>
        </div>
      </div>
    </div>
  )
}
