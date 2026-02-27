import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN' && token?.role !== 'OPERATOR') {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, pathname }) => {
        // Public routes
        const publicPaths = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/api/auth']
        
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true
        }
        
        // Admin routes require authentication
        if (pathname.startsWith('/admin')) {
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
