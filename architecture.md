# 🏛️ TripSync — Architecture Specification

> **System Topology, Domain Boundaries, Realtime Subsystems & Security Architecture**

---

## 1. System Topology Overview

TripSync is architected as a **High-Performance Modular Monolith** with decoupled frontend, backend API gateway, dedicated asynchronous job worker, and cloud-managed data stores.

```text
                               ┌────────────────────────────────────────┐
                               │               CLIENT LAYER             │
                               │                                        │
                               │  📱 Next.js 14 Web App / Mobile PWA   │
                               │  • React 18 + Tailwind CSS + shadcn/ui │
                               │  • Clerk Auth SDK + Supabase Client    │
                               │  • Mountain Offline SW + BroadcastChan │
                               └───────────────────┬────────────────────┘
                                                   │
                         ┌─────────────────────────┴────────────────────────┐
                         │                                                  │
                 HTTPS REST Requests                                 WebSocket / WSS
             (Authorization: Bearer <JWT>)                      (/realtime Socket.IO Gateway)
                         │                                                  │
                         ▼                                                  ▼
       ┌────────────────────────────────────────────────────────────────────────┐
       │                         BACKEND API GATEWAY                            │
       │                                                                        │
       │   apps/api — NestJS 10/11 on Fastify Engine (Port 4000)                │
       │   • Fastify Helmet (Security Headers)                                  │
       │   • Fastify Rate Limiting (120 req/min/IP)                             │
       │   • Fastify Compression (Brotli / Gzip)                                │
       │   • AuthGuard (Supabase JWT Secret + Clerk Session Verification)       │
       │   • Zod Validation Pipe (Strict Request Sanitization)                  │
       ├────────────────────────────────────────────────────────────────────────┤
       │                           DOMAIN MODULES                               │
       │                                                                        │
       │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
       │  │ Auth & Users │ │ Trips & RBAC │ │  Itinerary   │ │   Expenses   │   │
       │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
       │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
       │  │ Settlements  │ │    Tasks     │ │  Emergency   │ │  Analytics   │   │
       │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
       │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
       │  │   Realtime   │ │   Database   │ │ Common / Mail│                    │
       │  └──────────────┘ └──────────────┘ └──────────────┘                    │
       └───────────────────────┬────────────────────────┬───────────────────────┘
                               │                        │
                    Drizzle ORM Queries             Redis Pub/Sub & Queues
                               │                        │
                               ▼                        ▼
       ┌─────────────────────────────────┐   ┌──────────────────────────────────┐
       │        PERSISTENCE LAYER        │   │          CACHE & BROKER          │
       │                                 │   │                                  │
       │  🐘 PostgreSQL 16+ (Supabase)   │   │  ⚡ Redis 7+ (Docker / Upstash)  │
       │  • Drizzle ORM Type-Safe Schema │   │  • Socket.IO Redis Adapter       │
       │  • Row-Level Security (RLS)     │   │  • BullMQ Task Queues            │
       │  • Cascading Foreign Key Trees  │   │  • Cross-instance Pub/Sub        │
       │  • JSON & Financial Precisions  │   └──────────────────┬───────────────┘
       └─────────────────────────────────┘                      │
                                                                ▼
                                             ┌──────────────────────────────────┐
                                             │       BACKGROUND WORKER          │
                                             │                                  │
                                             │   apps/worker — BullMQ Worker    │
                                             │   • Notification Dispatch        │
                                             │   • Email Reminders & Invites    │
                                             │   • Task Due-Date Escalations    │
                                             └──────────────────────────────────┘
```

---

## 2. Monorepo Structure & Package Boundaries

The workspace is organized with **pnpm workspaces** and **Turborepo** (`turbo.json`):

```text
tripsync/
├── apps/
│   ├── api/          # NestJS 10/11 REST API, Fastify, Drizzle ORM, Socket.IO Gateway
│   ├── web/          # Next.js 14 App Router, Clerk Auth, Tailwind CSS, Lucide, Recharts
│   └── worker/       # BullMQ background job processor over Redis
├── packages/
│   ├── config/       # Shared TypeScript & Tooling configurations
│   ├── types/        # Pure TypeScript models, DTO interfaces, and Domain Enums
│   ├── ui/           # Shared React Design System (Button, Card, Badge)
│   └── validation/   # Zod validation schemas for all domain entities & API inputs
├── supabase/
│   └── migrations/   # SQL migrations and Row Level Security (RLS) policies
├── docs/
│   └── decisions/    # Architecture Decision Records (ADRs 001 - 007)
├── docker-compose.yml# Local infrastructure (Postgres 16, Redis 7, Mailpit)
├── turbo.json        # Build pipeline orchestrator
└── pnpm-workspace.yaml
```

---

## 3. Core Subsystems

### 3.1 Authentication & Profile Sync Pipeline

TripSync implements a zero-trust dual-identity bridge:
1. **Frontend Authentication**: Handled via Clerk (`@clerk/nextjs`) or direct Supabase Auth (`@tripsync/validation` schemas).
2. **Client Bridge**: `ApiAuthBridge.tsx` injects Clerk session JWT into `api.ts` `authTokenProvider`.
3. **API AuthGuard**: `AuthGuard` in `apps/api/src/common/auth.guard.ts` intercepts all incoming bearer tokens:
   - Verifies HS256 signature using `SUPABASE_JWT_SECRET`.
   - Fallback verifies Clerk session tokens via `@clerk/backend` `verifyToken` and `createClerkClient`.
   - Normalizes Clerk User ID into a deterministic UUID v4 string.
4. **Claims Synchronization**: `ProfileSyncService` idempotently upserts the verified claims into the PostgreSQL `profiles` table before controller execution.

```text
User Action (Web) 
  └─► Clerk / Supabase Auth
        └─► Session Token (JWT)
              └─► ApiAuthBridge injects Bearer Token
                    └─► Fastify HTTP Request
                          └─► AuthGuard.canActivate()
                                ├─► Verify JWT (Supabase secret / Clerk SDK)
                                ├─► ProfileSyncService.syncFromClaims()
                                │     └─► Upsert into `profiles` table
                                └─► Attach `request.user` & Proceed
```

---

### 3.2 Settlements Engine & Debt Minimization Algorithm

The settlements subsystem (`SettlementsService`) implements a **Greedy Min-Cash-Flow Debt Settlement Algorithm**:
- **Complexity**: Reduces an $N \times (N-1)$ multi-party debt matrix down to at most $N-1$ atomic transfers.
- **Calculations**:
  1. Computes member net balances: $\text{Net Balance} = \sum \text{Paid} - \sum \text{Share Owed}$.
  2. Partitions users into Debtors ($\text{Net} < 0$) and Creditors ($\text{Net} > 0$).
  3. Sorts debtors and creditors descending by absolute debt/credit.
  4. Iteratively matches the maximum debtor with the maximum creditor using $\min(|\text{Debtor}|, \text{Creditor})$ until all balances are zeroed out.

---

### 3.3 Hybrid Realtime & Collaboration Subsystem

TripSync employs a layered 3-tier realtime architecture:
1. **Multi-Instance Server Gateway**: NestJS `RealtimeGateway` (`/realtime` namespace via `@nestjs/websockets` & `Socket.IO`) handles room joins (`trip:<tripId>`) and broadcasts presence and mutations.
2. **Local Multi-Tab Synchronization**: Browser `BroadcastChannel` (`tripsync_channel_<tripId>` and `tripsync_realtime_chat_<tripId>`) synchronizes chat messages and activity feed items instantly across browser tabs without consuming server bandwidth.
3. **Storage Fallback & Custom Events**: Window `CustomEvent` dispatchers ensure instant UI reactivity within the active view.

---

### 3.4 Mountain Offline Sentinel & PWA Strategy

Travelers frequently venture into high-altitude areas with zero cellular connectivity:
- **Service Worker (`public/sw.js`)**: Implements **Cache-First** for static assets, scripts, fonts, and SVG icons; **Network-First with offline snapshot fallback** for `/trips/*` and `/dashboard`.
- **Client Offline Sentinel (`MountainOfflineSentinel.tsx`)**: Monitors `navigator.onLine` and window `online`/`offline` events.
- **Offline Mutation Queuing**: Local mutations are staged in `localStorage` under `tripsync_offline_queue` and automatically flushed when the connection is restored.
- **Emergency Offline Packet (`/trips/:tripId/emergency/packet`)**: Pre-caches critical hospital numbers, police SOS, and member emergency contacts on local device memory.

---

### 3.5 Asynchronous Worker & BullMQ Queue Pipeline

Background processing is decoupled from the main HTTP loop:
- **Queue**: Redis `notifications` queue via `bullmq`.
- **Worker Process**: `apps/worker/src/index.ts` processes asynchronous tasks:
  - `TRIP_INVITATION`: Email delivery via Nodemailer or Resend API.
  - `SETTLEMENT_REMINDER`: Debt notification alerts.
  - `TASK_DUE`: Automated countdown reminders.
- **Health Keep-Alive**: GitHub Actions workflow (`.github/workflows/keep-alive.yml`) pings `/api/v1/health` every 12 minutes to keep free-tier instances (Render / Supabase) warm.

---

## 4. Security & Isolation Architecture

1. **Row Level Security (RLS)**:
   - Enabled on all 13 PostgreSQL tables (`supabase/migrations/0001_rls_policies.sql`).
   - Helper functions `is_trip_member(trip_id, user_id)` and `is_trip_admin(trip_id, user_id)` enforce tenant isolation in SQL.
2. **Role-Based Access Control (RBAC)**:
   - `RolesGuard` evaluates `TripRole` hierarchy: `OWNER (4) > ADMIN (3) > MEMBER (2) > VIEWER (1)`.
3. **Input Validation**:
   - `ZodValidationPipe` rejects extraneous fields and invalid payloads before controller execution.
4. **Transport Security**:
   - Helmet HTTP headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`).
   - Fastify rate limiting (120 req/minute per IP).
