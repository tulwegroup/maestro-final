'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isUnauthenticated = status === 'unauthenticated'
  
  const isAdmin = session?.user?.role === 'ADMIN'
  const isOperator = session?.user?.role === 'OPERATOR'
  const isAdminOrOperator = isAdmin || isOperator
  
  const requireAuth = useCallback(() => {
    if (isUnauthenticated) {
      router.push('/auth/signin')
    }
  }, [isUnauthenticated, router])
  
  const requireAdmin = useCallback(() => {
    if (!isAdminOrOperator) {
      router.push('/auth/unauthorized')
    }
  }, [isAdminOrOperator, router])
  
  return {
    session,
    user: session?.user,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    isAdmin,
    isOperator,
    isAdminOrOperator,
    requireAuth,
    requireAdmin,
    updateSession: update
  }
}
