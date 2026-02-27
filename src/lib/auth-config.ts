import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'
import * as bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      uaePassConnected?: boolean
    }
  }
  
  interface User {
    id: string
    email: string
    name?: string | null
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true }
        })

        if (!user || !user.isActive) {
          return null
        }

        // For users with password (admin/operator)
        if (user.passwordHash) {
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )
          
          if (!passwordMatch) {
            return null
          }
        } else {
          // For regular users, check if they have a password set
          // If not, they need to set one first
          return null
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        
        // Fetch UAE Pass status
        const userProfile = await db.userProfile.findUnique({
          where: { userId: token.id },
          select: { uaePassConnected: true }
        })
        session.user.uaePassConnected = userProfile?.uaePassConnected || false
      }
      return session
    }
  },
  events: {
    async signIn({ user }) {
      // Log the sign in
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          resource: 'auth',
          resourceId: user.id
        }
      })
    }
  }
}
