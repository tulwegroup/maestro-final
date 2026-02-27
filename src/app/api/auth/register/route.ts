import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)
    
    // Create user with profile
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: 'USER',
        isActive: true,
        profile: {
          create: {
            fullNameEnglish: validatedData.name,
            mobile: validatedData.phone || null,
            lifeScore: 88,
            walletBalance: 0,
            btcBalance: 0,
            usdtTrc20Balance: 0,
          }
        }
      },
      include: {
        profile: true
      }
    })
    
    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'user',
        resourceId: user.id
      }
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
