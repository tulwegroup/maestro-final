import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
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
          where: { email: credentials.email }
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
          return null
        }

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
        
        try {
          const userProfile = await db.userProfile.findUnique({
            where: { userId: token.id },
            select: { uaePassConnected: true }
          })
          session.user.uaePassConnected = userProfile?.uaePassConnected || false
        } catch {
          session.user.uaePassConnected = false
        }
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
