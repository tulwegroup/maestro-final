// MAESTRO - Security Logging & Monitoring System
// PCI DSS Requirement 10, ISO 27001 A.12.4
// Comprehensive security event logging and alerting

import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// ===========================
// TYPES
// ===========================

export type SecurityEventType = 
  // Authentication events
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'SESSION_EXPIRED'
  | 'MFA_ENABLED' | 'MFA_DISABLED' | 'MFA_SUCCESS' | 'MFA_FAILURE'
  | 'PASSWORD_CHANGED' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED'
  // Access control
  | 'PERMISSION_GRANTED' | 'PERMISSION_DENIED' | 'ROLE_CHANGED'
  | 'SUSPICIOUS_ACCESS' | 'PRIVILEGE_ESCALATION_ATTEMPT'
  // Data events
  | 'DATA_ACCESS' | 'DATA_EXPORT' | 'DATA_DELETION' | 'DATA_MODIFICATION'
  | 'ENCRYPTION_KEY_ROTATION' | 'SENSITIVE_DATA_ACCESSED'
  // Security events
  | 'RATE_LIMIT_EXCEEDED' | 'CSRF_FAILURE' | 'XSS_ATTEMPT' | 'SQL_INJECTION_ATTEMPT'
  | 'PATH_TRAVERSAL_ATTEMPT' | 'COMMAND_INJECTION_ATTEMPT' | 'SUSPICIOUS_REQUEST'
  | 'BLACKLIST_TRIGGERED' | 'DDOS_DETECTED'
  // Payment events (PCI DSS)
  | 'PAYMENT_INITIATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILURE'
  | 'CARD_DATA_ACCESSED' | 'REFUND_PROCESSED'
  // System events
  | 'CONFIGURATION_CHANGE' | 'API_KEY_USED' | 'WEBHOOK_RECEIVED'
  | 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN' | 'BACKUP_COMPLETED';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  resourceId?: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

// ===========================
// ALERT THRESHOLDS
// ===========================

const ALERT_THRESHOLDS = {
  // Authentication
  LOGIN_FAILURES_5MIN: { threshold: 5, windowMs: 300000, severity: 'HIGH' as SecuritySeverity },
  LOGIN_FAILURES_1HOUR: { threshold: 15, windowMs: 3600000, severity: 'CRITICAL' as SecuritySeverity },
  
  // Rate limiting
  RATE_LIMIT_5MIN: { threshold: 10, windowMs: 300000, severity: 'MEDIUM' as SecuritySeverity },
  
  // Security events
  XSS_ATTEMPTS_5MIN: { threshold: 3, windowMs: 300000, severity: 'CRITICAL' as SecuritySeverity },
  SQL_INJECTION_5MIN: { threshold: 1, windowMs: 300000, severity: 'CRITICAL' as SecuritySeverity },
  
  // Payment anomalies
  PAYMENT_FAILURES_1HOUR: { threshold: 10, windowMs: 3600000, severity: 'HIGH' as SecuritySeverity }
};

// ===========================
// EVENT BUFFER & PROCESSING
// ===========================

const eventBuffer: SecurityEvent[] = [];
const MAX_BUFFER_SIZE = 1000;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Event counters for alerting
const eventCounters = new Map<string, { count: number; resetTime: number }>();

// ===========================
// LOGGING FUNCTIONS
// ===========================

export async function logSecurityEvent(event: {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  resourceId?: string;
  action: string;
  details: string;
  metadata?: Record<string, unknown>;
}): Promise<SecurityEvent> {
  const securityEvent: SecurityEvent = {
    id: `sec_${nanoid()}`,
    type: event.type,
    severity: event.severity,
    userId: event.userId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    resource: event.resource,
    resourceId: event.resourceId,
    action: event.action,
    details: event.details,
    metadata: sanitizeMetadata(event.metadata),
    timestamp: new Date(),
    resolved: false
  };
  
  // Add to buffer
  eventBuffer.push(securityEvent);
  
  // Flush if buffer is full
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    await flushEventBuffer();
  }
  
  // Check alert thresholds
  checkAlertThresholds(securityEvent);
  
  // Log to console for immediate visibility
  logToConsole(securityEvent);
  
  return securityEvent;
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'cardNumber', 'cvv', 'pin'];
  
  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

function logToConsole(event: SecurityEvent): void {
  const logLevel = event.severity === 'CRITICAL' ? 'error' :
                  event.severity === 'HIGH' ? 'warn' : 'info';
  
  const logMessage = `[SECURITY] [${event.severity}] ${event.type}: ${event.details}`;
  
  switch (logLevel) {
    case 'error':
      console.error(logMessage, { 
        eventId: event.id, 
        userId: event.userId, 
        ip: event.ipAddress,
        resource: event.resource
      });
      break;
    case 'warn':
      console.warn(logMessage, { 
        eventId: event.id, 
        userId: event.userId, 
        ip: event.ipAddress 
      });
      break;
    default:
      console.log(logMessage, { 
        eventId: event.id, 
        type: event.type 
      });
  }
}

// ===========================
// ALERT SYSTEM
// ===========================

function checkAlertThresholds(event: SecurityEvent): void {
  const now = Date.now();
  
  for (const [thresholdName, config] of Object.entries(ALERT_THRESHOLDS)) {
    // Check if this event type is relevant to the threshold
    if (!isEventRelevantToThreshold(event.type, thresholdName)) continue;
    
    const key = `${thresholdName}:${event.ipAddress}`;
    let counter = eventCounters.get(key);
    
    if (!counter || now > counter.resetTime) {
      counter = { count: 0, resetTime: now + config.windowMs };
    }
    
    counter.count++;
    eventCounters.set(key, counter);
    
    // Check if threshold exceeded
    if (counter.count >= config.threshold) {
      triggerAlert({
        name: thresholdName,
        severity: config.severity,
        count: counter.count,
        threshold: config.threshold,
        ipAddress: event.ipAddress,
        eventType: event.type
      });
      
      // Reset counter after alert
      eventCounters.delete(key);
    }
  }
}

function isEventRelevantToThreshold(eventType: SecurityEventType, thresholdName: string): boolean {
  const mapping: Record<string, SecurityEventType[]> = {
    'LOGIN_FAILURES_5MIN': ['LOGIN_FAILURE'],
    'LOGIN_FAILURES_1HOUR': ['LOGIN_FAILURE'],
    'RATE_LIMIT_5MIN': ['RATE_LIMIT_EXCEEDED'],
    'XSS_ATTEMPTS_5MIN': ['XSS_ATTEMPT'],
    'SQL_INJECTION_5MIN': ['SQL_INJECTION_ATTEMPT'],
    'PAYMENT_FAILURES_1HOUR': ['PAYMENT_FAILURE']
  };
  
  return mapping[thresholdName]?.includes(eventType) || false;
}

interface AlertPayload {
  name: string;
  severity: SecuritySeverity;
  count: number;
  threshold: number;
  ipAddress: string;
  eventType: SecurityEventType;
}

function triggerAlert(payload: AlertPayload): void {
  console.error(`[SECURITY ALERT] ${payload.name}`, {
    severity: payload.severity,
    count: payload.count,
    threshold: payload.threshold,
    ipAddress: payload.ipAddress,
    eventType: payload.eventType,
    timestamp: new Date().toISOString()
  });
  
  // In production, send to:
  // - Slack/Teams webhook
  // - PagerDuty
  // - Email distribution list
  // - SIEM system
}

// ===========================
// DATABASE PERSISTENCE
// ===========================

async function flushEventBuffer(): Promise<void> {
  if (eventBuffer.length === 0) return;
  
  const eventsToFlush = [...eventBuffer];
  eventBuffer.length = 0; // Clear buffer
  
  try {
    // Store in database
    for (const event of eventsToFlush) {
      await db.securityEvent.create({
        data: {
          id: event.id,
          eventType: event.type as any,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          resource: event.resource,
          details: JSON.stringify({
            resourceId: event.resourceId,
            action: event.action,
            details: event.details,
            metadata: event.metadata
          }),
          severity: event.severity as any,
          resolved: event.resolved,
          createdAt: event.timestamp
        }
      });
    }
    
    console.log(`[SECURITY] Flushed ${eventsToFlush.length} events to database`);
  } catch (error) {
    console.error('[SECURITY] Failed to flush events:', error);
    // Re-add events to buffer
    eventBuffer.unshift(...eventsToFlush);
  }
}

// Periodic flush
if (typeof setInterval !== 'undefined') {
  setInterval(flushEventBuffer, FLUSH_INTERVAL);
}

// ===========================
// QUERY FUNCTIONS
// ===========================

export async function getSecurityEvents(filters: {
  userId?: string;
  type?: SecurityEventType;
  severity?: SecuritySeverity;
  ipAddress?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ events: SecurityEvent[]; total: number }> {
  const where: any = {};
  
  if (filters.userId) where.userId = filters.userId;
  if (filters.type) where.eventType = filters.type;
  if (filters.severity) where.severity = filters.severity;
  if (filters.ipAddress) where.ipAddress = filters.ipAddress;
  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt.gte = filters.fromDate;
    if (filters.toDate) where.createdAt.lte = filters.toDate;
  }
  
  const [events, total] = await Promise.all([
    db.securityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0
    }),
    db.securityEvent.count({ where })
  ]);
  
  return {
    events: events.map(mapDbEventToSecurityEvent),
    total
  };
}

function mapDbEventToSecurityEvent(dbEvent: any): SecurityEvent {
  const details = JSON.parse(dbEvent.details || '{}');
  return {
    id: dbEvent.id,
    type: dbEvent.eventType,
    severity: dbEvent.severity,
    userId: dbEvent.userId || undefined,
    ipAddress: dbEvent.ipAddress || '',
    userAgent: dbEvent.userAgent || '',
    resource: dbEvent.resource || '',
    resourceId: details.resourceId,
    action: details.action || '',
    details: details.details || '',
    metadata: details.metadata,
    timestamp: dbEvent.createdAt,
    resolved: dbEvent.resolved,
    resolvedBy: dbEvent.resolvedBy || undefined,
    resolvedAt: dbEvent.resolvedAt || undefined
  };
}

// ===========================
// COMPLIANCE REPORTING
// ===========================

export async function generateSecurityReport(
  fromDate: Date,
  toDate: Date
): Promise<{
  summary: {
    totalEvents: number;
    bySeverity: Record<SecuritySeverity, number>;
    byType: Record<string, number>;
    uniqueUsers: number;
    uniqueIPs: number;
  };
  criticalEvents: SecurityEvent[];
  unresolvedEvents: SecurityEvent[];
}> {
  const events = await db.securityEvent.findMany({
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate
      }
    }
  });
  
  const mappedEvents = events.map(mapDbEventToSecurityEvent);
  
  const bySeverity: Record<SecuritySeverity, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  };
  
  const byType: Record<string, number> = {};
  const uniqueUsers = new Set<string>();
  const uniqueIPs = new Set<string>();
  
  for (const event of mappedEvents) {
    bySeverity[event.severity]++;
    byType[event.type] = (byType[event.type] || 0) + 1;
    if (event.userId) uniqueUsers.add(event.userId);
    uniqueIPs.add(event.ipAddress);
  }
  
  return {
    summary: {
      totalEvents: mappedEvents.length,
      bySeverity,
      byType,
      uniqueUsers: uniqueUsers.size,
      uniqueIPs: uniqueIPs.size
    },
    criticalEvents: mappedEvents.filter(e => e.severity === 'CRITICAL'),
    unresolvedEvents: mappedEvents.filter(e => !e.resolved)
  };
}

// ===========================
// RESOLUTION
// ===========================

export async function resolveSecurityEvent(
  eventId: string,
  resolvedBy: string,
  notes?: string
): Promise<void> {
  await db.securityEvent.update({
    where: { id: eventId },
    data: {
      resolved: true,
      resolvedBy,
      resolvedAt: new Date(),
      details: notes ? JSON.stringify({ notes }) : undefined
    }
  });
}

// ===========================
// EXPORTS
// ===========================

export { eventBuffer, ALERT_THRESHOLDS };
