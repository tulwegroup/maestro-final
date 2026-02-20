// MAESTRO - Audit Logging System
// ISO 27001 Compliant Audit Trail

import { db } from './db';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Log an audit event
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    let ipAddress: string | undefined = entry.ipAddress;
    let userAgent: string | undefined = entry.userAgent;
    
    // Try to get IP and user agent from headers if not provided
    if (!ipAddress || !userAgent) {
      try {
        const headersList = await headers();
        ipAddress = ipAddress || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
        userAgent = userAgent || headersList.get('user-agent') || undefined;
      } catch {
        // Headers not available (client-side)
      }
    }
    
    await db.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        ipAddress,
        userAgent,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Common audit actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'USER_LOGIN',
  LOGOUT: 'USER_LOGOUT',
  LOGIN_FAILED: 'USER_LOGIN_FAILED',
  
  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  
  // UAE Pass
  UAEPASS_CONNECTED: 'UAEPASS_CONNECTED',
  UAEPASS_DISCONNECTED: 'UAEPASS_DISCONNECTED',
  
  // Journey Management
  JOURNEY_CREATED: 'JOURNEY_CREATED',
  JOURNEY_STARTED: 'JOURNEY_STARTED',
  JOURNEY_COMPLETED: 'JOURNEY_COMPLETED',
  JOURNEY_FAILED: 'JOURNEY_FAILED',
  
  // Task Management
  TASK_CREATED: 'TASK_CREATED',
  TASK_STARTED: 'TASK_STARTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  
  // Payment
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  WALLET_TOPUP: 'WALLET_TOPUP',
  WALLET_DEDUCTED: 'WALLET_DEDUCTED',
  
  // Crypto
  CRYPTO_DEPOSIT: 'CRYPTO_DEPOSIT',
  CRYPTO_WITHDRAWAL: 'CRYPTO_WITHDRAWAL',
  CRYPTO_CONVERTED: 'CRYPTO_CONVERTED',
  
  // Security
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  
  // Admin
  ADMIN_JOURNEY_ASSIGNED: 'ADMIN_JOURNEY_ASSIGNED',
  ADMIN_JOURNEY_UPDATED: 'ADMIN_JOURNEY_UPDATED',
} as const;

// Security event logging
export async function logSecurityEvent(
  eventType: string,
  userId?: string,
  details?: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
): Promise<void> {
  try {
    let ipAddress: string | undefined;
    let userAgent: string | undefined;
    
    try {
      const headersList = await headers();
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
      userAgent = headersList.get('user-agent') || undefined;
    } catch {
      // Headers not available
    }
    
    await db.securityEvent.create({
      data: {
        id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        eventType: eventType as any,
        userId,
        ipAddress,
        userAgent,
        details,
        severity: severity as any,
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
