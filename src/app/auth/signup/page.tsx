'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Zap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUpPage() {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validatePassword = (pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd)
    }
    return checks
  }

  const passwordChecks = validatePassword(password)
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!allPasswordChecksPassed) {
      setError('Password does not meet requirements')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin?registered=true')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <Card className="border-slate-200 shadow-xl max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
              <p className="text-slate-600">Redirecting you to sign in...</p>
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
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

        {/* Sign Up Card */}
        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
            <CardDescription className="text-center">
              Get started with your free account
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
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

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
                <Label htmlFor="phone">Mobile Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+971 50 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
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
                {/* Password requirements */}
                {password && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <div className={`flex items-center gap-1 text-xs ${passwordChecks.length ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordChecks.length ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      8+ characters
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${passwordChecks.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordChecks.uppercase ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      Uppercase
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${passwordChecks.lowercase ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordChecks.lowercase ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      Lowercase
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${passwordChecks.number ? 'text-green-600' : 'text-slate-400'}`}>
                      {passwordChecks.number ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                      Number
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                disabled={isLoading || !allPasswordChecksPassed || password !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>
              </p>
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
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Secured with 256-bit encryption</span>
        </div>
      </div>
    </div>
  )
}
