import { createClient } from "@/lib/supabase/server";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();

    const userAgent = entry.userAgent
      ? entry.userAgent.slice(0, 500)
      : undefined;

    await supabase.from("audit_logs").insert({
      user_id: entry.userId ?? null,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: userAgent ?? null,
      metadata: entry.metadata ?? {},
      severity: entry.severity ?? "info",
    });
  } catch {
    // Audit logging should never throw and block the main operation
  }
}

// Pre-defined audit log helpers
export async function auditLoginSuccess(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await logAuditEvent({
    userId,
    action: "login_success",
    ipAddress,
    userAgent,
    severity: "info",
  });
}

export async function auditLoginFailure(
  email: string,
  ipAddress?: string,
  userAgent?: string
) {
  await logAuditEvent({
    action: "login_failure",
    metadata: { email },
    ipAddress,
    userAgent,
    severity: "warning",
  });
}

export async function auditPasswordChange(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await logAuditEvent({
    userId,
    action: "password_change",
    ipAddress,
    userAgent,
    severity: "info",
  });
}

export async function auditRateLimitExceeded(
  identifier: string,
  action: string,
  ipAddress?: string
) {
  await logAuditEvent({
    action: "rate_limit_exceeded",
    metadata: { identifier, rateLimitAction: action },
    ipAddress,
    severity: "warning",
  });
}

export async function auditSuspiciousGameScore(
  userId: string,
  gameId: string,
  score: number,
  maxPossible: number
) {
  await logAuditEvent({
    userId,
    action: "suspicious_game_score",
    resourceType: "game",
    resourceId: gameId,
    metadata: { score, maxPossible },
    severity: "critical",
  });
}

export async function auditFileUpload(
  userId: string,
  fileName: string,
  fileType: string,
  fileSize: number
) {
  await logAuditEvent({
    userId,
    action: "file_upload",
    resourceType: "file",
    metadata: { fileName, fileType, fileSize },
    severity: "info",
  });
}

export async function auditProfileCustomization(
  userId: string,
  fields: string[]
) {
  await logAuditEvent({
    userId,
    action: "profile_customization_update",
    resourceType: "profile",
    resourceId: userId,
    metadata: { updatedFields: fields },
    severity: "info",
  });
}

export async function auditBulkFriendRequests(
  userId: string,
  count: number,
  windowHours: number
) {
  await logAuditEvent({
    userId,
    action: "bulk_friend_requests",
    metadata: { requestCount: count, windowHours },
    severity: "warning",
  });
}
