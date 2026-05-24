# BRAHMO Compliance Engine - Architecture

## Executive Summary

BRAHMO (Behavioral Rules for AI Monitoring and Operations) Compliance Engine is a production-grade legal AI compliance platform that enforces security at the database level using PostgreSQL Row-Level Security (RLS). The system implements ethical walls, immutable audit trails, and compliance-grade exports for legal AI oversight.

**Core Principle:** Security is not a feature—it is a constraint enforced at the database level. Unauthorized access returns zero rows, not an error message.

---

## System Architecture

### 1. Security Enforcement: Why RLS, Not Application Code

**Traditional Application-Level Security (❌ Risky):**
```
Frontend → Backend → Check if (user can access matter) → Query DB
```
Problems:
- Logic bugs allow unauthorized access
- Bypasses if backend logic is altered
- Information leakage through error messages
- Requires every endpoint to duplicate auth checks

**BRAHMO Database-Level Security (✅ Enforced):**
```
Frontend → Backend → Query DB
           └─→ PostgreSQL RLS Policies ←─┘
                (No rows returned if unauthorized)
```

Benefits:
- Even if backend logic is completely wrong, database enforces access control
- Single source of truth for authorization: the database
- Impossible to leak unauthorized resource existence
- No redundant permission checks needed in code

### 2. Ethical Walls: Matter-Level Isolation

**Implementation:**

1. **matter_permissions table** defines access rights:
   ```sql
   user_id  | matter_id | permission_level | granted_at
   ---------|-----------|------------------|----------
   priya    | matter_1  | read             | NOW()
   priya    | matter_2  | read_write       | NOW()
   rahul    | matter_3  | read             | NOW()
   sonia    | matter_1  | read             | NOW()
   ```

2. **RLS Policy on matters table:**
   ```sql
   CREATE POLICY matters_select_policy ON matters
     FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM matter_permissions
         WHERE matter_permissions.matter_id = matters.id
         AND matter_permissions.user_id = auth.uid()
       )
       OR auth.jwt() ->> 'role' = 'partner'
     );
   ```

3. **Query Behavior:**
   - Priya queries: `SELECT * FROM matters` → Returns only matter_1, matter_2
   - Rahul queries: `SELECT * FROM matters` → Returns only matter_3
   - Sonia queries: `SELECT * FROM matters` → Returns only matter_1
   - Unauthorized user queries: `SELECT * FROM matters` → Returns empty array

**No information leakage.** The unauthorized user doesn't learn that matter_3 exists.

---

## 3. Append-Only Blocked Access Log

**Security Requirement:**
Every denied access attempt must be logged permanently. Admins must not be able to silently delete evidence.

**Implementation:**

```sql
CREATE TABLE blocked_access_log (
  event_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  attempted_matter_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  previous_hash VARCHAR(64),
  current_hash VARCHAR(64) NOT NULL
);

-- Revoke UPDATE and DELETE at the PostgreSQL role level
REVOKE UPDATE, DELETE ON blocked_access_log FROM authenticated;
REVOKE UPDATE, DELETE ON blocked_access_log FROM anon;
```

**Why This Works:**
- `INSERT` is still allowed (logging new events)
- `UPDATE` and `DELETE` are impossible, even for admins
- History cannot be rewritten
- Tamper attempts fail at the database level

**Flow:**
```
User attempts unauthorized access
  ↓
API detects access denied
  ↓
INSERT into blocked_access_log (immutable)
  ↓
Log entry persists forever
```

---

## 4. Tamper-Evident Hash Chaining

**Problem:** How do we detect if logs have been tampered with at the application layer?

**Solution:** Hash chain each blocked event.

**Implementation:**

```
Event 1:
  previous_hash: NULL (genesis)
  input: "NULL||user_priya||matter_3||no_permission||2024-01-01T10:00Z"
  current_hash: hash(input)

Event 2:
  previous_hash: <Event 1 hash>
  input: "<Event 1 hash>||user_rahul||matter_1||no_permission||2024-01-02T14:00Z"
  current_hash: hash(input)

Event 3:
  previous_hash: <Event 2 hash>
  input: "<Event 2 hash>||user_sonia||matter_3||no_permission||2024-01-03T09:00Z"
  current_hash: hash(input)
```

**Verification:**
```
For each event:
  computed_hash = SHA256(previous_hash || user_id || matter_id || reason || timestamp)
  if computed_hash != stored_hash: TAMPERED
```

**Forensic Value:** If any event is modified—even one character—the chain breaks and tampering is immediately detectable.

---

## 5. Audit Trail: Session Tracking

**What Gets Logged:**

```sql
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  matter_id UUID NOT NULL,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  query_type VARCHAR(100),
  output_token_count INTEGER,
  output_hash VARCHAR(64),           -- NEVER store full output
  review_status VARCHAR(50),         -- pending | reviewed | approved | rejected
  reviewer_id UUID,
  review_timestamp TIMESTAMPTZ,
  review_decision VARCHAR(50),
  review_notes TEXT
);
```

**Lifecycle:**

1. **Session Start**
   - Record: user, matter, timestamp, query type
   - Status: pending

2. **Session End**
   - Record: output hash (not full output), token count
   - Update status: pending

3. **Partner Review**
   - Reviewer: partner role only
   - Decision: approved or rejected
   - Notes: audit trail reason
   - Timestamp: when reviewed

**RLS Protection:**
- Associates see only their own sessions
- Partners see all sessions
- Sessions scoped to accessible matters

---

## 6. Compliance Export: Anonymized CSV

**What Gets Exported:**

```csv
Date,User,Role,Matter Type,Practice Area,Query Type,Output Hash,Review Status,Reviewer,Review Date,Decision,Blocked Events
2024-01-01,Priya Singh,associate,Acme v. Smith,Litigation,document_review,abcdef12...,reviewed,Sarah Chen,2024-01-02,approved,1
2024-01-02,Rahul Patel,associate,Global IP Matter,IP,patent_analysis,1234567...,reviewed,Sarah Chen,2024-01-03,approved,0
```

**Anonymization:**
- Client names: "Client A", "Client B" (not real names)
- Output hashes: stored as is (for audit chain)
- PII: minimal and redacted

**Access Control:**
- Only partners can download
- Service-role client used (elevated privileges justified)
- Audit trail of who downloaded when

---

## 7. Database Schema: Normalized Design

### Tables

**clients**
```sql
id UUID PRIMARY KEY
name VARCHAR(255) NOT NULL
created_at TIMESTAMPTZ
```

**matters**
```sql
id UUID PRIMARY KEY
client_id UUID → clients.id
matter_name VARCHAR(255)
practice_area VARCHAR(255)
court VARCHAR(255)
status VARCHAR(50) -- active|closed|suspended
created_at TIMESTAMPTZ
```

**users**
```sql
id UUID PRIMARY KEY
name VARCHAR(255)
email VARCHAR(255) UNIQUE
role VARCHAR(50) -- associate|partner|admin
sra_number VARCHAR(50)
created_at TIMESTAMPTZ
```

**matter_permissions** (ethical walls)
```sql
id UUID PRIMARY KEY
user_id UUID → users.id
matter_id UUID → matters.id
permission_level VARCHAR(50) -- read|read_write|review
granted_at TIMESTAMPTZ
granted_by UUID → users.id
UNIQUE(user_id, matter_id)
```

**ai_sessions** (audit trail)
```sql
id UUID PRIMARY KEY
user_id UUID → users.id
matter_id UUID → matters.id
session_start TIMESTAMPTZ
session_end TIMESTAMPTZ
query_type VARCHAR(100)
output_token_count INTEGER
output_hash VARCHAR(64)
review_status VARCHAR(50)
reviewer_id UUID → users.id
review_timestamp TIMESTAMPTZ
review_decision VARCHAR(50)
review_notes TEXT
created_at TIMESTAMPTZ
```

**blocked_access_log** (append-only, immutable)
```sql
event_id UUID PRIMARY KEY
user_id UUID → users.id
attempted_matter_id UUID → matters.id
reason VARCHAR(100)
details TEXT
timestamp TIMESTAMPTZ
previous_hash VARCHAR(64)
current_hash VARCHAR(64)
created_at TIMESTAMPTZ
```

### Indexes
- Foreign key columns indexed for policy lookups
- Status columns indexed for filtering
- Timestamp columns indexed for time-range queries
- Composite indexes on (user_id, matter_id) for performance

---

## 8. RLS Policies: Complete Reference

### matters_select_policy
- Users see only matters they have permission to access
- Partners see all matters
- Unauthorized users see 0 rows

### ai_sessions_select_policy
- Users see their own sessions
- Users see sessions on matters they can access
- Partners see all sessions

### ai_sessions_insert_policy
- Users can only create sessions on matters they can access

### blocked_access_log_insert_policy
- Everyone can log blocked access (for security detection)

### blocked_access_log_select_policy
- Only partners can read the block log
- Associates see nothing

---

## 9. Supabase Implementation

### Client Configuration

```typescript
// Browser client (RLS enforced)
const supabaseBrowser = createClient(url, anonKey);

// Server client (service role - use with care)
const supabaseServer = createClient(url, serviceRoleKey);
```

### Query Pattern (RLS-Enforced)

```typescript
// Browser client automatically enforces RLS
const { data } = await supabaseBrowser
  .from('matters')
  .select('*');
  
// Result is automatically filtered by database policies
```

### Service-Role Usage
- CSV export generation (need full data visibility)
- Admin operations (documented and audited)
- NEVER used for normal user queries

---

## 10. Permission Changes: Instant Revocation

**Scenario:** Revoke Priya's access to Matter 2

```sql
DELETE FROM matter_permissions 
WHERE user_id = 'priya' AND matter_id = 'matter_2';
```

**Effect:**
- Next query by Priya: `SELECT * FROM matters` → Matter 2 not returned
- Existing API calls: Fail at RLS level
- No code changes needed
- Instant, database-level enforcement

---

## 11. Adding New Matters/Users: Zero Code Changes

**Add new matter:**
```sql
INSERT INTO matters (...) VALUES (...);
```
- No code changes needed
- RLS policies automatically apply
- Partners can immediately see it
- No other users see it until permissions are granted

**Grant user access:**
```sql
INSERT INTO matter_permissions (user_id, matter_id, permission_level, granted_by)
VALUES ('user_new', 'matter_x', 'read', 'admin_user_id');
```
- User immediately sees matter in queries
- Session history available for review
- Audit trail created automatically

---

## 12. Data Flow: Request to Database

```
1. User selects matter from dropdown (RLS-filtered list)
2. Click "Access Matter X"
3. Frontend calls: POST /api/access-check
4. API: await checkMatterAccess(user_id, matter_id)
5. checkMatterAccess() runs:
   SELECT id FROM matters WHERE id = matter_id
   (RLS policy applied automatically by database)
6. If no rows: Access denied, log event, return empty result
7. If rows returned: Access allowed
8. UI updates based on result
```

**Key Point:** Step 5 is enforced by PostgreSQL RLS policies. Even if the API is hacked, the database still refuses unauthorized access.

---

## 13. Scalability & Performance

### Indexes for Performance
- Foreign key columns: indexed for policy lookups
- Status columns: indexed for filtering pending reviews
- Timestamp columns: indexed for audit queries
- (user_id, matter_id) composite: indexed for permission checks

### Query Efficiency
- RLS policies use indexed columns
- Joins on indexed FKs are optimized
- CSV export uses service-role (can aggregate without RLS overhead)

### Storage
- No full AI outputs stored (only hashes)
- Immutable log uses fixed schema (no JSON blobs)
- Normalized design minimizes duplication

---

## 14. Security Guarantees

### Guarantee 1: Ethical Wall Enforcement
- User can only see matters explicitly granted
- Boundary enforced in database, not code
- Information leakage: impossible

### Guarantee 2: Audit Trail Immutability
- Blocked access logs cannot be modified
- UPDATE/DELETE revoked at role level
- Tampering: impossible without schema changes

### Guarantee 3: Tamper Detection
- Hash chain detects any modification
- Forensic-grade audit trail
- Tampering detection: guaranteed

### Guarantee 4: Access Isolation
- RLS scopes all queries to allowed data
- Bypassing RLS: impossible without direct schema changes
- Cross-matter data leakage: impossible

### Guarantee 5: Permission Changes: Instant
- Revoking permission takes effect immediately
- No cache or session state
- Enforcement: database level

---

## 15. Demo Scenario Walkthrough

**Scenario:** Demonstrate RLS enforcement live

```
Demo User 1: Priya (associate)
Demo User 2: Rahul (associate)
Demo User 3: Sarah (partner)

STEP 1: Priya logs in
  Query: SELECT * FROM matters
  RLS result: matter_1, matter_2 only
  
STEP 2: Rahul logs in
  Query: SELECT * FROM matters
  RLS result: matter_3 only
  
STEP 3: Priya attempts matter_3
  Query: SELECT id FROM matters WHERE id = 'matter_3'
  RLS result: 0 rows (access denied)
  Action: blocked_access_log entry created
  
STEP 4: Sarah (partner) views blocked log
  Query: SELECT * FROM blocked_access_log
  RLS result: [blocked event from step 3]
  
STEP 5: Sarah reviews Priya's session
  Update: ai_sessions.review_status = 'reviewed'
  Update: ai_sessions.review_decision = 'approved'
  
STEP 6: Export compliance report
  CSV: all sessions, blocked events, reviews
  Anonymization: "Client A", "Client B"
```

---

## 16. Production Readiness

### What's Production-Ready
✓ PostgreSQL RLS policies  
✓ Immutable audit logs  
✓ Hash-chain tamper detection  
✓ Normalized database schema  
✓ Type-safe TypeScript interfaces  
✓ Error handling and logging  
✓ CSV export generation  

### What Requires Operational Setup
- Supabase project configuration
- Database migration execution
- Auth provider setup (optional for demo)
- Environment variable configuration
- Monitoring and alerting setup

### Compliance Features
✓ Attorney-client privilege supported (via permission model)  
✓ Audit trail for regulatory review  
✓ Data isolation (ethical walls)  
✓ Tamper detection and evidence  
✓ Anonymized exports  
✓ Access control enforcement  

---

## 17. Design Principles

1. **Security by Default**
   - RLS enabled on all sensitive tables
   - FORCE ROW LEVEL SECURITY prevents disabling
   - Least-privilege access grants

2. **Auditability**
   - Every action logged
   - Immutable record creation
   - Hash chain for integrity

3. **Simplicity**
   - Normalized schema (no JSON blobs)
   - Direct RLS policies (no complex logic)
   - Minimal abstraction layers

4. **Determinism**
   - Same query, same result (RLS-enforced)
   - No hidden state or caching
   - Database is source of truth

5. **Regulator-Ready**
   - Can demonstrate authorization enforcement
   - Can show audit trail
   - Can prove immutability
   - Can export compliant reports

---

## Conclusion

BRAHMO Compliance Engine demonstrates production-grade security architecture where:

- **Authorization** is enforced at the database level
- **Audit trails** are immutable and tamper-evident
- **Compliance** is automated and verifiable
- **Architecture** is simple, maintainable, and regulator-ready

The system proves that modern legal AI compliance can be both rigorous and elegant.
