'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Link2, 
  Unlink,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UAEPassCardProps {
  isConnected: boolean
  connectedAt?: Date | null
  permissions?: string[]
  onUnlink?: () => void
}

export function UAEPassCard({ isConnected, connectedAt, permissions = [], onUnlink }: UAEPassCardProps) {
  const router = useRouter()
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const handleUnlink = async () => {
    setIsUnlinking(true)
    try {
      const response = await fetch('/api/uaepass/link', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onUnlink?.()
        setShowUnlinkDialog(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to unlink UAE Pass:', error)
    } finally {
      setIsUnlinking(false)
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card className={`border-2 transition-colors ${isConnected ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isConnected ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <Shield className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">UAE Pass</CardTitle>
                <CardDescription>
                  {isConnected ? 'Connected & Active' : 'Not connected'}
                </CardDescription>
              </div>
            </div>
            <Badge className={isConnected ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
              {isConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">
                <p>Connected on {formatDate(connectedAt)}</p>
                {permissions.length > 0 && (
                  <p className="mt-1">Permissions: {permissions.map(p => p.replace('_', ' ')).join(', ')}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowUnlinkDialog(true)}
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  Unlink
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/auth/uaepass')}
                >
                  Manage Permissions
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Link your UAE Pass to access all government services automatically. 
                Your data is secure and encrypted.
              </p>
              <Button 
                onClick={() => router.push('/auth/uaepass')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Link UAE Pass
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink UAE Pass?</DialogTitle>
            <DialogDescription>
              This will remove access to your UAE Pass data. You can link it again anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Warning</p>
                  <p>You will lose access to:</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Automatic form filling</li>
                    <li>Real-time document alerts</li>
                    <li>Quick government service access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUnlinkDialog(false)}
              disabled={isUnlinking}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleUnlink}
              disabled={isUnlinking}
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink UAE Pass
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
