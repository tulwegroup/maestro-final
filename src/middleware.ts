import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl?.pathname
    const token = req.nextauth?.token
    
    // Admin routes protection
    if (pathname?.startsWith('/admin')) {
      if (token?.role !== 'ADMIN' && token?.role !== 'OPERATOR') {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, pathname }) => {
        // Handle undefined pathname
        const path = pathname || ''
        
        // Public routes that don't require authentication
        const publicPaths = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/auth/uaepass', '/auth/unauthorized']
        const publicPrefixes = ['/api/auth', '/_next', '/favicon']
        
        // Allow public paths
        if (publicPaths.includes(path)) {
          return true
        }
        
        // Allow public prefixes
        if (publicPrefixes.some(prefix => path.startsWith(prefix))) {
          return true
        }
        
        // Static files
        if (path.includes('.') || path.startsWith('/_next')) {
          return true
        }
        
        // Admin routes require authentication
        if (path.startsWith('/admin')) {
          return !!token
        }
        
        // Protected routes require authentication
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
