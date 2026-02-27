import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl
        
        // Always allow these paths without authentication
        if (
          pathname === '/' ||
          pathname.startsWith('/auth/signin') ||
          pathname.startsWith('/auth/signup') ||
          pathname.startsWith('/auth/uaepass') ||
          pathname.startsWith('/auth/unauthorized') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/uaepass') ||
          pathname.startsWith('/api/register') ||
          pathname.startsWith('/_next') ||
          pathname.includes('.')
        ) {
          return true
        }
        
        // Admin routes require authentication AND admin role
        if (pathname.startsWith('/admin')) {
          return !!token && (token.role === 'ADMIN' || token.role === 'OPERATOR')
        }
        
        // All other routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
