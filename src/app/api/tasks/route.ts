import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TaskStatus } from '@prisma/client';

// GET /api/tasks - Get tasks (optionally filtered by journey)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get('journeyId');
    const status = searchParams.get('status');
    
    const where: any = {};
    if (journeyId) where.journeyId = journeyId;
    if (status) where.status = status as TaskStatus;

    const tasks = await db.task.findMany({
      where,
      include: {
        journey: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// PUT /api/tasks - Bulk update tasks
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskIds, status, startedAt, completedAt } = body;

    const updatePromises = taskIds.map((id: string) =>
      db.task.update({
        where: { id },
        data: {
          status: status as TaskStatus,
          startedAt: startedAt ? new Date(startedAt) : undefined,
          completedAt: completedAt ? new Date(completedAt) : undefined
        }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, updatedCount: taskIds.length });
  } catch (error) {
    console.error('Error updating tasks:', error);
    return NextResponse.json({ success: false, error: 'Failed to update tasks' }, { status: 500 });
  }
}
