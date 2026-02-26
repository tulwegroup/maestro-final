import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JourneyStatus, PaymentStatus, TaskStatus } from '@prisma/client';

// GET /api/journeys/[id] - Get specific journey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const journey = await db.journey.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { priority: 'desc' }
        },
        user: {
          include: { profile: true }
        }
      }
    });

    if (!journey) {
      return NextResponse.json({ success: false, error: 'Journey not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, journey });
  } catch (error) {
    console.error('Error fetching journey:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch journey' }, { status: 500 });
  }
}

// PUT /api/journeys/[id] - Update journey
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const journey = await db.journey.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: { tasks: true }
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'JOURNEY_UPDATE',
        resource: 'Journey',
        resourceId: id,
        newValue: JSON.stringify(body)
      }
    });

    return NextResponse.json({ success: true, journey });
  } catch (error) {
    console.error('Error updating journey:', error);
    return NextResponse.json({ success: false, error: 'Failed to update journey' }, { status: 500 });
  }
}

// DELETE /api/journeys/[id] - Delete journey
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.journey.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journey:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete journey' }, { status: 500 });
  }
}
