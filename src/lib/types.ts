// ============================================================================
// BRAHMO Compliance Engine - TypeScript Type Definitions
// ============================================================================

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface Matter {
  id: string;
  client_id: string;
  matter_name: string;
  practice_area: string;
  court: string | null;
  status: 'active' | 'closed' | 'suspended';
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'associate' | 'partner' | 'admin';
  sra_number: string | null;
  created_at: string;
}

export interface DemoUser {
  id: string;
  name: string;
  role: 'associate' | 'partner' | 'admin';
}

export interface MatterPermission {
  id: string;
  user_id: string;
  matter_id: string;
  permission_level: 'read' | 'read_write' | 'review';
  granted_at: string;
  granted_by: string | null;
}

export interface AISession {
  id: string;
  user_id: string;
  matter_id: string;
  session_start: string;
  session_end: string | null;
  query_type: string | null;
  output_token_count: number | null;
  output_hash: string | null;
  review_status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  reviewer_id: string | null;
  review_timestamp: string | null;
  review_decision: 'approved' | 'rejected' | null;
  review_notes: string | null;
  created_at: string;
}

export interface BlockedAccessEvent {
  event_id: string;
  user_id: string;
  attempted_matter_id: string;
  reason: 'no_permission' | 'matter_not_found' | 'status_inactive';
  details: string | null;
  timestamp: string;
  previous_hash: string | null;
  current_hash: string;
  created_at: string;
}

export interface AccessCheckRequest {
  user_id: string;
  matter_id: string;
  user_role: 'associate' | 'partner' | 'admin';
}

export interface AccessCheckResponse {
  allowed: boolean;
  reason?: string;
}

export interface SessionStartRequest {
  user_id: string;
  matter_id: string;
  query_type: string;
}

export interface SessionEndRequest {
  session_id: string;
  output_token_count: number;
  output_hash: string;
}

export interface ReviewRequest {
  session_id: string;
  reviewer_id: string;
  review_decision: 'approved' | 'rejected';
  review_notes: string;
}

export interface ComplianceExportRow {
  date: string;
  user: string;
  role: string;
  matter_type: string;
  practice_area: string;
  query_type: string | null;
  output_hash: string | null;
  review_status: string;
  reviewer: string | null;
  review_date: string | null;
  decision: string | null;
  blocked_events: number;
}

export interface DashboardMetrics {
  total_sessions: number;
  reviewed_count: number;
  pending_count: number;
  blocked_events: number;
  pending_reviews: number;
  reviewed_percentage: number;
}

export interface SupabaseAuthContext {
  user_id: string;
  role: 'associate' | 'partner' | 'admin';
  email: string;
}
