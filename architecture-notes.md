# BRAHMO Compliance Engine - Architecture Notes

## 1. Ethical Walls (Data Segregation)
**Implementation**: PostgreSQL Row Level Security (RLS)
- **Mechanism**: All queries to the `matters` and `ai_sessions` tables are intercepted at the database engine layer.
- **Enforcement**: We use the authenticated user's JWT token (`auth.jwt() -> 'app_metadata' ->> 'role'`) and cross-reference it with the `matter_permissions` junction table.
- **Security Posture**: By pushing the ethical wall logic to the PostgreSQL level, we eliminate the risk of application-layer bypasses. Even if the Next.js API or frontend components contain logic flaws, the database will refuse to return unauthorized rows.

## 2. Partner Audit Powers & Review Queue
**Implementation**: Role-Based Access Control (RBAC) mixed with RLS
- **Mechanism**: The `role` claim in the user's JWT distinguishes between `partner` and `associate`. Partners bypass the standard `matter_permissions` filter in the RLS policies and are granted global `SELECT` access.
- **Review System**: Only partners have access to the Review Queue UI and the `/api/review` endpoint. The backend explicitly verifies the user's `partner` role before recording approval or rejection decisions, ensuring associates cannot forge review approvals.

## 3. Cross-Matter Breach Detection
**Implementation**: Defensive Interception & Immutable Logging
- **Mechanism**: When an associate attempts to access a matter they are not assigned to, the system explicitly logs the attempt to the `blocked_access_log` table.
- **Visibility**: This table is exclusively readable by partners via RLS. The UI translates these events into high-visibility security alerts to actively monitor internal compliance adherence.

## 4. Immutable Audit Trail (Tamper-Proofing)
**Implementation**: Hash Chaining (Web Crypto API) + PostgreSQL Append-Only Policies
- **Mechanism**: 
  - Every AI session output is hashed using `SHA-256` before it is recorded.
  - The `ai_sessions` and `blocked_access_log` tables utilize strict RLS policies that `GRANT INSERT` and `GRANT SELECT` but explicitly omit `UPDATE` and `DELETE`.
- **Security Posture**: Once an event is logged, it becomes permanently immutable. A malicious actor (or compromised application server) cannot retroactively erase a blocked access event or modify a session's output hash, satisfying forensic integrity requirements.

## 5. Compliance Export (Regulator-Ready)
**Implementation**: Next.js API Routes + Data Anonymization
- **Mechanism**: The `/api/export` endpoint allows partners to download a CSV of the audit trail.
- **Privacy Protection**: 
  1. Output content is never exported (only the SHA-256 hash is exported to prove integrity).
  2. Client names are deterministically anonymized (e.g., `Client A`, `Client B`) during export generation so that the firm does not leak attorney-client privileged identities to regulators.
  3. User UUIDs are truncated to protect internal staff identities while maintaining event correlation.
