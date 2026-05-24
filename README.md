<p align="center">
  <img src="public/logo.png" alt="BRAHMO Logo" width="120" />
</p>

<h1 align="center">⚖️ BRAHMO Compliance Engine</h1>

<p align="center">
  <strong>An enterprise-grade legal compliance platform with database-level Row Level Security & Immutable Audit Trails.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/architecture-RLS_Isolation-green?style=flat-square" />
  <img src="https://img.shields.io/badge/security-Immutable_Audit-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/auth-JWT_%2B_RBAC-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/status-production--ready-brightgreen?style=flat-square" />
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Ethical Walls (Data Segregation)
- **Database-Level Isolation**: Powered by PostgreSQL Row Level Security (RLS).
- **Strict Matter Access**: Associates can only view AI sessions and matters explicitly assigned to them.
- **Zero-Trust Backend**: Cross-matter queries are denied directly at the engine layer, preventing application-level bypasses.

</td>
<td width="50%">

### 🛡️ Immutable Audit Trail
- **Cryptographic Hashing**: Every AI session output is hashed (SHA-256) via the Web Crypto API before saving.
- **Tamper-Proof Logs**: RLS append-only policies (`GRANT INSERT`) explicitly prohibit `UPDATE` and `DELETE` on all audit logs.
- **Forensic Integrity**: Guarantees evidence cannot be retroactively modified, ensuring strict regulatory compliance.

</td>
</tr>
<tr>
<td width="50%">

### 👑 Partner Audit Powers
- **Role-Based Overrides**: Partners bypass standard matter constraints for global oversight.
- **Review Queue**: Partners can approve or reject associate AI interactions.
- **Breach Detection Dashboard**: Unauthorized access attempts by internal staff are intercepted and flagged for Partner review.

</td>
<td width="50%">

### 📥 Regulator-Ready Export
- **Anonymized Export**: Generates CSV reports with deterministically mapped client names (e.g., "Client A", "Client B") to protect attorney-client privilege.
- **Secure Backend Route**: Dynamic Next.js API endpoint that strictly enforces JWT bearer token validation.
- **Data Minimization**: Exports prove integrity via hashes without leaking raw output content.

</td>
</tr>
</table>

---

## 🖼️ Product Showcase

> **Note:** To add your own screenshots, run the project locally, take screenshots of the specific pages, and place them in the `public/screenshots` folder.

| Feature | Screenshot |
|:---:|:---:|
| **Partner Overview Dashboard** | *![Dashboard Placeholder](public/screenshots/dashboard.png)* |
| **Ethical Walls (Associate View)** | *![Associate View Placeholder](public/screenshots/associate-view.png)* |
| **Immutable Audit Trail** | *![Audit Trail Placeholder](public/screenshots/audit-trail.png)* |
| **Review Queue** | *![Review Queue Placeholder](public/screenshots/review-queue.png)* |
| **Regulator Export** | *![Export Placeholder](public/screenshots/export.png)* |

---

## 🏛️ Architecture & Security Model

```text
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                       │
├──────────────────────────┬──────────────────────────────────┤
│    Frontend (Client)     │       Backend API Routes          │
│  ┌──────────────────┐    │  ┌────────────────────────────┐  │
│  │  React Components │    │  │  /api/export (JWT Auth)    │  │
│  │  Auth Context     │────┼──│  /api/review (RBAC Guard)  │  │
│  │  Web Crypto Hash  │    │  │  Server-Side Supabase      │  │
│  └──────────────────┘    │  └────────────────────────────┘  │
├──────────────────────────┴──────────────────────────────────┤
│               SUPABASE (POSTGRESQL 16)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ► Row Level Security (RLS) Policy Engine            │  │
│  │  ► Append-Only Constraints (No UPDATE/DELETE)        │  │
│  │  ► JWT Claim Parsing (role matching)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Role Access Matrix

| Feature | Partner 👑 | Associate / Paralegal 👤 |
|---------|:--------:|:---------:|
| View Assigned Matters & Sessions | ✅ | ✅ |
| Access Unassigned Matters | ❌ (Denied by RLS) | ❌ (Denied by RLS) |
| View Global Audit Trail | ✅ | ❌ |
| Approve / Reject AI Sessions | ✅ | ❌ |
| View Blocked Access Logs | ✅ | ❌ |
| Generate CSV Compliance Export | ✅ | ❌ |

---

## 🧪 Test Users

| Character | Email | Role | Accessible Matters | Password |
|-----------|-------|------|---------|----------|
| **Sarah** | sarah@brahmo.ai | `PARTNER` | ALL (Global Access) | Partner123! |
| **Priya** | priya@brahmo.ai | `ASSOCIATE` | Matter 1, Matter 2 | Associate123! |
| **Rahul** | rahul@brahmo.ai | `ASSOCIATE` | Matter 3 | Associate123! |
| **Sonia** | sonia@brahmo.ai | `ASSOCIATE` | Matter 1 | Associate123! |

*(Note: "Curious" associates attempting to view matters outside their scope trigger an immutable `no_permission` event in the Blocked Access Log).*

---

## 🚀 Quick Start

### 1. Local Development Setup

```bash
# Clone the repository
git clone <repo-url>
cd brahmo-compliance

# Install dependencies
npm install

# Copy environment file and add your Supabase credentials
cp .env.example .env.local

# Run the development server
npm run dev
```

### 2. Database Seeding
To set up the initial schema, RLS policies, and test data, run the provided SQL scripts against your Supabase project:
1. Execute `supabase/schema.sql` (Creates tables and RLS policies)
2. Execute `supabase/seed.sql` (Creates test users and matter permissions)

---

## 👨‍💻 Developed by

<div align="center">
  <a href="https://www.linkedin.com/in/sudheerkonduboina/">
    <img src="public/sudheer.png" width="120" style="border-radius: 50%;" alt="Sudheer Konduboina" />
  </a>
  <br/>
  <h3>Sudheer Konduboina</h3>
  <p>Software Engineer (Backend) & AI/ML Engineer</p>
  <a href="https://www.linkedin.com/in/sudheerkonduboina/">
    <img src="https://img.shields.io/badge/LinkedIn-Sudheer_Konduboina-blue?style=flat-square&logo=linkedin" alt="LinkedIn" />
  </a>
</div>

---

## © Copyright Notice

**© BRAHMO. All Rights Reserved.**
