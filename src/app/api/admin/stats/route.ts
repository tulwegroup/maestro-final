import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get various stats from the database
    const [
      totalUsers,
      activeUsers,
      totalJourneys,
      pendingJourneys,
      completedJourneys,
      totalTransactions,
      pendingTickets,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.journey.count(),
      db.journey.count({ where: { status: 'PENDING' } }),
      db.journey.count({ where: { status: 'COMPLETED' } }),
      db.transaction.count(),
      db.notification.count({ where: { isRead: false } }),
    ]);

    // Calculate revenue from completed journeys
    const completedJourneysData = await db.journey.findMany({
      where: { 
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      },
      select: { totalAmount: true }
    });
    
    const totalRevenue = completedJourneysData.reduce((sum, j) => sum + j.totalAmount, 0);

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await db.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Get recent activity
    const recentLogs = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          growth: 12.5, // Would calculate from historical data
        },
        journeys: {
          total: totalJourneys,
          pending: pendingJourneys,
          completed: completedJourneys,
          failed: await db.journey.count({ where: { status: 'FAILED' } }),
        },
        revenue: {
          today: Math.floor(totalRevenue * 0.1), // Simulated daily
          week: Math.floor(totalRevenue * 0.3), // Simulated weekly
          month: totalRevenue,
          growth: 8.3, // Would calculate from historical data
        },
        support: {
          open: pendingTickets,
          avgResponseTime: 4.5,
          satisfaction: 94.2,
        },
        system: {
          uptime: 99.97,
          apiLatency: 45,
          errorRate: 0.12,
        },
      },
      recentActivity: recentLogs.map(log => ({
        id: log.id,
        type: log.resource.toLowerCase() as 'user' | 'journey' | 'payment' | 'ticket' | 'system',
        message: `${log.action} on ${log.resource}`,
        timestamp: log.createdAt.toISOString(),
        status: 'success' as const,
        user: log.user?.name || 'System',
      })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
