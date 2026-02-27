'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Zap, 
  Shield, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  User,
  CreditCard,
  FileText,
  Car
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

// UAE Pass scopes/permissions
const UAE_PASS_PERMISSIONS = [
  { id: 'profile', label: 'Personal Profile', description: 'Name, photo, contact details', icon: User, required: true },
  { id: 'emirates_id', label: 'Emirates ID', description: 'National ID number and details', icon: CreditCard, required: true },
  { id: 'vehicle', label: 'Vehicle Information', description: 'Registered vehicles, fines, and registration', icon: Car, required: false },
  { id: 'license', label: 'Driving License', description: 'License status, expiry, and violations', icon: FileText, required: false },
]

function UAEPassLinkContent() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [permissions, setPermissions] = useState<string[]>(UAE_PASS_PERMISSIONS.map(p => p.id))
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/auth/uaepass')
    }
  }, [status, router])

  const handleStartLinking = () => {
    setShowConsent(true)
  }

  const handleTogglePermission = (permId: string, required: boolean) => {
    if (required) return
    setPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    )
  }

  const handleLinkUAEPass = async () => {
    setIsLinking(true)
    setError(null)

    try {
      const response = await fetch('/api/uaepass/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link UAE Pass')
      }

      setSuccess(true)
      await update()
      
      setTimeout(() => {
        router.push(callbackUrl)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLinking(false)
    }
  }

  if (status === 'loading') {
    return (
      <Card className="border-slate-200 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="border-slate-200 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">UAE Pass Linked!</h2>
            <p className="text-slate-600 mb-4">Your UAE Pass has been successfully linked to your MAESTRO account.</p>
            <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mt-4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200 shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Link UAE Pass</CardTitle>
        <CardDescription>
          Connect your UAE Pass for seamless government services access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showConsent ? (
          <>
            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-900">Benefits of linking UAE Pass:</h4>
              <div className="grid gap-2">
                {[
                  'Auto-fill personal details across all services',
                  'Instant access to government portals',
                  'Real-time document expiry alerts',
                  'Secure digital identity verification',
                  'One-click service applications'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleStartLinking}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Link UAE Pass
            </Button>

            <p className="text-xs text-center text-slate-500 mt-4">
              You can link UAE Pass later from your profile settings
            </p>
          </>
        ) : (
          <>
            {/* Consent Screen */}
            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-600">
                MAESTRO requests access to the following information from your UAE Pass:
              </p>

              <div className="space-y-3">
                {UAE_PASS_PERMISSIONS.map((perm) => {
                  const Icon = perm.icon
                  const isChecked = permissions.includes(perm.id)
                  return (
                    <div 
                      key={perm.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isChecked ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'
                      } ${!perm.required ? 'cursor-pointer hover:bg-teal-100' : ''}`}
                      onClick={() => handleTogglePermission(perm.id, perm.required)}
                    >
                      <Checkbox 
                        id={perm.id}
                        checked={isChecked}
                        disabled={perm.required}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-600" />
                          <label htmlFor={perm.id} className="font-medium text-slate-900 cursor-pointer">
                            {perm.label}
                          </label>
                          {perm.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">Your data is secure</p>
                    <p>MAESTRO complies with UAE data protection laws. Your information is encrypted and stored only in UAE-based servers.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowConsent(false)}
                className="flex-1"
                disabled={isLinking}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLinkUAEPass}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={isLinking || permissions.length < 2}
              >
                {isLinking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Allow & Link'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingFallback() {
  return (
    <Card className="border-slate-200 shadow-xl">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </CardContent>
    </Card>
  )
}

export default function UAEPassLinkPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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

        <Suspense fallback={<LoadingFallback />}>
          <UAEPassLinkContent />
        </Suspense>

        {/* Skip Link */}
        <div className="text-center mt-4">
          <Link 
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  )
}
