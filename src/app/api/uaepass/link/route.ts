import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'

// Simulated UAE Pass data for demo
const SIMULATED_UAE_PASS_DATA = {
  emiratesId: '784-1990-1234567-1',
  fullNameArabic: 'محمد أحمد الخالدي',
  fullNameEnglish: 'Mohammed Ahmed Al-Khalidi',
  nationality: 'UAE',
  dateOfBirth: '1990-01-15',
  mobile: '+971501234567',
  email: 'mohammed.khalidi@email.com',
  gender: 'Male',
  passportNumber: 'A12345678',
  visaExpiry: '2027-01-15',
  licenseNumber: 'DXB-12345-2020',
  licenseExpiry: '2026-06-20',
  licenseType: 'Light Vehicle',
  vehiclePlate: 'DXB-A12345',
  vehicleExpiry: '2025-12-31',
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { permissions } = body

    if (!permissions || permissions.length < 2) {
      return NextResponse.json(
        { error: 'At least profile and Emirates ID permissions are required' },
        { status: 400 }
      )
    }

    // In production, this would redirect to UAE Pass OAuth
    // For demo, we simulate the OAuth flow with mock data
    
    // Update user profile with UAE Pass data
    const profile = await db.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Update profile based on permissions granted
    const updateData: Record<string, any> = {
      uaePassConnected: true,
      uaePassConnectedAt: new Date(),
      permissionsGranted: permissions.join(','),
    }

    // Add data based on permissions
    if (permissions.includes('profile')) {
      updateData.fullNameArabic = SIMULATED_UAE_PASS_DATA.fullNameArabic
      updateData.fullNameEnglish = SIMULATED_UAE_PASS_DATA.fullNameEnglish
      updateData.nationality = SIMULATED_UAE_PASS_DATA.nationality
      updateData.mobile = SIMULATED_UAE_PASS_DATA.mobile
    }

    if (permissions.includes('emirates_id')) {
      updateData.emiratesId = SIMULATED_UAE_PASS_DATA.emiratesId
    }

    if (permissions.includes('vehicle')) {
      updateData.vehiclePlate = SIMULATED_UAE_PASS_DATA.vehiclePlate
      updateData.vehicleExpiry = new Date(SIMULATED_UAE_PASS_DATA.vehicleExpiry)
      updateData.vehicleMake = SIMULATED_UAE_PASS_DATA.vehicleMake
      updateData.vehicleModel = SIMULATED_UAE_PASS_DATA.vehicleModel
    }

    if (permissions.includes('license')) {
      updateData.licenseNumber = SIMULATED_UAE_PASS_DATA.licenseNumber
      updateData.licenseExpiry = new Date(SIMULATED_UAE_PASS_DATA.licenseExpiry)
      updateData.licenseType = SIMULATED_UAE_PASS_DATA.licenseType
    }

    // Update visa expiry from Emirates ID data
    updateData.visaExpiry = new Date(SIMULATED_UAE_PASS_DATA.visaExpiry)

    await db.userProfile.update({
      where: { userId: session.user.id },
      data: updateData
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UAE_PASS_LINKED',
        resource: 'uaepass',
        resourceId: session.user.id,
        newValue: JSON.stringify({ permissions })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'UAE Pass linked successfully',
      permissions
    })

  } catch (error) {
    console.error('UAE Pass linking error:', error)
    return NextResponse.json(
      { error: 'Failed to link UAE Pass' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Unlink UAE Pass
    await db.userProfile.update({
      where: { userId: session.user.id },
      data: {
        uaePassConnected: false,
        uaePassConnectedAt: null,
        permissionsGranted: '',
        // Clear UAE Pass data
        emiratesId: null,
        fullNameArabic: null,
        vehiclePlate: null,
        vehicleExpiry: null,
        vehicleMake: null,
        vehicleModel: null,
        licenseNumber: null,
        licenseExpiry: null,
        licenseType: null,
        visaExpiry: null,
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UAE_PASS_UNLINKED',
        resource: 'uaepass',
        resourceId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'UAE Pass unlinked successfully'
    })

  } catch (error) {
    console.error('UAE Pass unlinking error:', error)
    return NextResponse.json(
      { error: 'Failed to unlink UAE Pass' },
      { status: 500 }
    )
  }
}
