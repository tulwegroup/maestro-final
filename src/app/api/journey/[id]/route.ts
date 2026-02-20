// MAESTRO - Journey Detail API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

// Get single journey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    const journey = await db.journey.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { priority: 'asc' }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }
    
    // Check access
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR' && journey.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Get journey error:', error);
    return NextResponse.json({ error: 'Failed to get journey' }, { status: 500 });
  }
}

// Update journey (admin/operator)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { status, assignedTo, operatorNotes, paymentStatus } = body;
    
    const existingJourney = await db.journey.findUnique({
      where: { id }
    });
    
    if (!existingJourney) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }
    
    // Check permissions
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR' && existingJourney.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (operatorNotes) updateData.operatorNotes = operatorNotes;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    if (status === 'PROCESSING' && !existingJourney.startedAt) {
      updateData.startedAt = new Date();
    }
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    
    const journey = await db.journey.update({
      where: { id },
      data: updateData,
      include: { tasks: true }
    });
    
    await logAudit({
      userId: user.id,
      action: status === 'COMPLETED' ? AUDIT_ACTIONS.JOURNEY_COMPLETED : 
              status === 'PROCESSING' ? AUDIT_ACTIONS.JOURNEY_STARTED : 
              AUDIT_ACTIONS.ADMIN_JOURNEY_UPDATED,
      resource: 'journey',
      resourceId: id,
      oldValue: JSON.stringify({ status: existingJourney.status }),
      newValue: JSON.stringify(updateData)
    });
    
    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Update journey error:', error);
    return NextResponse.json({ error: 'Failed to update journey' }, { status: 500 });
  }
}

// Delete journey
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    const journey = await db.journey.findUnique({
      where: { id }
    });
    
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }
    
    // Only admin or owner can delete
    if (user.role !== 'ADMIN' && journey.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await db.journey.delete({
      where: { id }
    });
    
    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.JOURNEY_FAILED,
      resource: 'journey',
      resourceId: id
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete journey error:', error);
    return NextResponse.json({ error: 'Failed to delete journey' }, { status: 500 });
  }
}
