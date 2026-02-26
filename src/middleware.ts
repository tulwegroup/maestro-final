// MAESTRO - Next.js Middleware (Simplified for development)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Continue with the request
  const response = NextResponse.next();
  
  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
