'use client'

import Link from 'next/link'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <Card className="border-slate-200 shadow-xl max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 text-center">
            The Admin Portal is restricted to authorized administrators only. 
            If you believe you should have access, please contact your system administrator.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
              asChild
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
