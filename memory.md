# 🧠 TripSync — Codebase Intelligence & Permanent Project Memory

> **The Permanent Brain of TripSync: Complete Mental Model, Reverse-Engineered Architecture, Data Flows, and System Specifications.**

---

## 1. Project Overview

**TripSync** is an open-source, collaborative travel platform designed to eliminate the chaotic fragmentation of group trip planning and execution. In traditional group travel, information is scattered across WhatsApp chats, Google Sheets, Google Maps bookmarks, UPI screenshots, email tickets, and personal notes. TripSync unifies all dimensions of a trip into a **single, real-time shared workspace** covering itineraries, multi-way expense splits with automated debt minimization, document vault security, live crew chat, offline emergency SOS hubs, and interactive GPS route visualization.

- **Repository Type**: Turborepo Monorepo with `pnpm` workspaces
- **Primary License**: Apache-2.0
- **Architectural Style**: Modular Monolith with decoupled background workers

---

## 2. Business Purpose & Problem Statement

### 2.1 The Core Problem
Planning and executing group trips is notoriously disorganized:
1. **Scattered Communication**: Important plans, meet-up times, and tickets get lost in fast-moving WhatsApp chats.
2. **Awkward Financial Settlement**: Tracking who paid for hotels, cabs, food, and activities requires messy spreadsheets, and settling involves dozens of reciprocal payments.
3. **Outdated Itineraries**: When schedule changes happen on the road, travelers miss updates or visit attractions at incorrect hours.
4. **Offline Blindness**: In remote or mountainous regions (e.g. Himalayas, coastal retreats), cellular connectivity drops, making cloud-stored tickets, hotel addresses, and emergency contacts inaccessible.

### 2.2 User Workflow
```text
[ DISCOVER / PLAN ]
        ↓
   Create Trip (Destination Geocoding + Auto-Fetched Landscape Image + Budget)
        ↓
   Invite Crew (Universal Join Link / Bulk Email Dispatch with RBAC Roles)
        ↓
[ COORDINATE ]
        ↓
   Build Day-by-Day Itinerary (GPS Waypoints, Timings, Leads, Live Weather)
        ↓
   Assign Tasks (Kit preparation, permits, airport cab booking)
        ↓
   Upload Travel Documents (PDF tickets, vouchers, PIN-protected ID cards)
        ↓
[ TRAVEL & EXECUTE ]
        ↓
   Live Crew Chat & Real-Time Activity Feed (Cross-tab broadcast sync)
        ↓
   Log Expenses & Split Bills (Equal, Exact, Percentage, Shares + Receipt Photo)
        ↓
   Mountain Offline Mode (Service Worker cached itinerary, contacts, and tickets)
        ↓
[ SETTLE & REVIEW ]
        ↓
   Min-Cash-Flow Debt Optimization (Greedy algorithm reduces N*(N-1) debts to N-1 transfers)
        ↓
   1-Tap UPI Settlement (GPay, PhonePe, Paytm, dynamic QR codes)
        ↓
   Spending Analytics & Budget Burn-Down Breakdown
```

---

## 3. Technology Stack Catalog

| Layer / Concern | Technology / Library | Version | Role in Project |
| :--- | :--- | :--- | :--- |
| **Monorepo Engine** | **Turborepo** + **pnpm** | `turbo@2.1.3`, `pnpm@8.15.9` | Task caching, parallel pipeline execution, workspace package resolution. |
| **Frontend Framework** | **Next.js** (App Router) | `14.2.18` (React `18.3.1`) | Server and client rendering, dynamic routing, metadata, PWA integration. |
| **Frontend Auth** | **Clerk** | `@clerk/nextjs@7.8.2` | User sign-in, sign-up, user profiles, session JWT issuance. |
| **Styling & Icons** | **Tailwind CSS**, **Lucide** | `tailwindcss@3.4.15`, `lucide-react@0.460.0` | Utility styling, responsive mobile layout, design tokens, iconography. |
| **UI Components** | **Custom shadcn/ui** | In-house `@tripsync/ui` | Accessible button, card, and badge primitives (`tailwind-merge` + `clsx`). |
| **Data Visualization** | **Recharts** | `2.13.3` | Interactive SVG spending category donuts, bar charts, and budget velocity graphs. |
| **Backend Framework** | **NestJS** on **Fastify** | `@nestjs/core@10.4.7`, `fastify@4.28.1` | Modular backend architecture, high-throughput Fastify HTTP adapter. |
| **Backend Security** | **Fastify Helmet**, **Rate-Limit** | `@fastify/helmet@13.1.1`, `@fastify/rate-limit@11.2.0` | Security headers (CSP, HSTS, X-Frame-Options) and rate limiting (120 req/min). |
| **Compression** | **Fastify Compress** | `@fastify/compress@9.2.0` | Gzip, Deflate, Brotli response compression for low-bandwidth mobile clients. |
| **API Documentation** | **Swagger / OpenAPI** | `@nestjs/swagger@7.4.2` | Interactive REST API explorer hosted at `/api/docs`. |
| **ORM & Migrations** | **Drizzle ORM** + **Drizzle Kit** | `drizzle-orm@0.36.0`, `drizzle-kit@0.28.0` | Zero-overhead, type-safe SQL query builder and schema migration tool. |
| **Database Engine** | **PostgreSQL 16+** | `postgres@3.4.5` (Driver) | Primary relational database (Supabase PostgreSQL / local Docker). |
| **Database Security** | **Row Level Security (RLS)** | PostgreSQL native SQL | Security definer functions (`is_trip_member`, `is_trip_admin`) on all tables. |
| **Realtime Engine** | **Socket.IO** + **BroadcastChannel** | `socket.io@4.8.1`, Web APIs | Hybrid realtime: WebSocket server gateway + cross-tab browser BroadcastChannel. |
| **Background Jobs** | **BullMQ** + **Redis** | `bullmq@5.21.2`, `ioredis@5.4.1` | Asynchronous worker process for email dispatches, reminders, and due dates. |
| **Email Transports** | **Nodemailer** + **Resend API** | `nodemailer@9.0.5`, Fetch API | Multi-provider email delivery (Resend API, Gmail SMTP, Mailpit local container). |
| **Offline / PWA** | **Custom Service Worker** | `public/sw.js` | Cache-first static assets, network-first with offline snapshot fallback for trips. |
| **Validation** | **Zod** | `zod@3.23.8` | Schema validation shared between frontend forms and backend NestJS pipes. |

---

## 4. Repository Structure & Directory Map

```text
d:/TripSync/
├── .env.example                       # Documented environment variable template
├── .github/
│   └── workflows/
│       └── keep-alive.yml             # GitHub Actions cron (every 12m) to prevent Render/Supabase sleep
├── docker-compose.yml                 # Local Docker services (Postgres 16, Redis 7, Mailpit)
├── package.json                       # Monorepo root package definition
├── pnpm-lock.yaml                     # Dependency lockfile
├── pnpm-workspace.yaml                # pnpm workspace definition (apps/*, packages/*)
├── turbo.json                         # Turborepo task pipeline configuration
├── README.md                          # Repository primary documentation
│
├── apps/
│   ├── api/                           # NestJS REST API & WebSocket Gateway
│   │   ├── drizzle.config.ts          # Drizzle Kit migration generator configuration
│   │   ├── package.json
│   │   └── src/
│   │       ├── main.ts                # Fastify bootstrap, Helmet, RateLimit, Swagger, Self-Check
│   │       ├── app.module.ts          # NestJS root application module
│   │       ├── common/                # Shared backend guards, decorators, pipes, and services
│   │       │   ├── auth.guard.ts      # Dual Supabase & Clerk JWT session verifier
│   │       │   ├── profile-sync.service.ts # Idempotent claims-to-database user synchronizer
│   │       │   ├── roles.guard.ts     # RBAC role hierarchy evaluator (OWNER > ADMIN > MEMBER > VIEWER)
│   │       │   ├── roles.decorator.ts # @Roles() metadata decorator
│   │       │   ├── current-user.decorator.ts # @CurrentUser() parameter injector
│   │       │   ├── zod-validation.pipe.ts # Global Zod validation pipe
│   │       │   ├── mail.service.ts    # Nodemailer + Resend API invitation email service
│   │       │   └── common.module.ts
│   │       ├── database/
│   │       │   ├── database.module.ts # Global Drizzle database connection provider
│   │       │   ├── schema.ts          # Drizzle ORM table definitions, enums, and relations
│   │       │   └── seed.ts            # Development database seeder (users, trips, itinerary, expenses)
│   │       └── modules/               # Domain-driven NestJS modules
│   │           ├── health/            # Liveness probe & database keep-alive (/health)
│   │           ├── auth/              # Authentication controller & service (/auth)
│   │           ├── trips/             # Trip CRUD and aggregation (/trips)
│   │           ├── members/           # Trip membership, roles, and invite links (/trips/:id/members)
│   │           ├── itinerary/         # Days and activity scheduling (/trips/:id/itinerary)
│   │           ├── expenses/          # Multi-party expense tracking (/trips/:id/expenses)
│   │           ├── settlements/       # Min-Cash-Flow debt engine (/trips/:id/settlements)
│   │           ├── tasks/             # Checklist and task assignments (/trips/:id/tasks)
│   │           ├── emergency/         # SOS emergency contacts & offline packet (/trips/:id/emergency)
│   │           ├── analytics/         # Spending breakdown & budget velocity (/trips/:id/analytics)
│   │           └── realtime/          # Socket.IO WebSocket gateway (/realtime)
│   │
│   ├── web/                           # Next.js 14 Web Application & PWA
│   │   ├── next.config.js             # Security response headers, remote patterns, output config
│   │   ├── package.json
│   │   ├── public/
│   │   │   ├── manifest.json          # Web App Manifest for mobile PWA install
│   │   │   ├── sw.js                  # Mountain Offline Service Worker
│   │   │   └── icon.svg, logo.svg
│   │   └── src/
│   │       ├── app/                   # App Router pages and layouts
│   │       │   ├── layout.tsx         # Global layout with Clerk, AuthContext, Navbar, Footer
│   │       │   ├── page.tsx           # Landing page with animated showcase
│   │       │   ├── dashboard/page.tsx # User cockpit, trip manager, packing tool, inspiration
│   │       │   ├── trips/[id]/page.tsx# Core 8-tab trip collaboration workspace
│   │       │   ├── invite/[token]/page.tsx # Invitation preview and acceptance
│   │       │   ├── sign-in/           # Clerk authentication modal wrapper
│   │       │   ├── sign-up/           # Clerk registration modal wrapper
│   │       │   ├── verify-email/      # Direct OTP email code confirmation
│   │       │   ├── privacy/, terms/, safety/, support/ # Informational pages
│   │       │   └── not-found.tsx
│   │       ├── components/            # Rich client components
│   │       │   ├── ApiAuthBridge.tsx  # Injects Clerk token into API fetcher
│   │       │   ├── Navbar.tsx, Footer.tsx, TripSyncLogo.tsx
│   │       │   ├── UPISettlementModal.tsx # 1-tap UPI app link & dynamic QR code
│   │       │   ├── ReceiptPreviewModal.tsx# Zoomable expense receipt viewer
│   │       │   ├── DocumentVaultSection.tsx # PIN-protected travel document vault
│   │       │   ├── ItineraryRouteMap.tsx  # Interactive GPS waypoint route visualizer
│   │       │   ├── DestinationWeatherWidget.tsx # Live destination climate & sunrise timers
│   │       │   ├── CrewChatDrawer.tsx     # Real-time multi-tab chat drawer
│   │       │   ├── LiveActivityFeedDrawer.tsx # Real-time event log & browser notifications
│   │       │   ├── MountainOfflineSentinel.tsx # Zero-network detection & offline sync banner
│   │       │   └── PWAInstallPrompt.tsx   # Mobile home screen installation prompt
│   │       └── lib/
│   │           ├── api.ts             # Universal HTTP client fetch wrapper
│   │           ├── auth-context.tsx   # Client auth state and pure RBAC `canForRole` helper
│   │           ├── currencies.ts      # Multi-currency conversion rates and symbols
│   │           └── utils.ts           # Date formatting and currency format helpers
│   │
│   └── worker/                        # BullMQ Background Job Processor
│       ├── package.json
│       └── src/
│           └── index.ts               # BullMQ worker process connected to Redis
│
├── packages/
│   ├── config/                        # Shared TypeScript base configs
│   ├── types/                         # TypeScript domain models and enums
│   ├── ui/                            # Shared React UI components (Button, Card, Badge)
│   └── validation/                    # Zod validation schemas for all domain entities
│
├── supabase/
│   └── migrations/
│       └── 0001_rls_policies.sql      # PostgreSQL Row Level Security (RLS) policies
└── docs/
    └── decisions/                     # Architecture Decision Records (ADR 001 - 007)
```

---

## 5. System Architecture & Component Interaction

```text
                                 ┌──────────────────────┐
                                 │   Browser / Mobile   │
                                 └──────────┬───────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │ HTTPS REST                 │ WSS Realtime               │ PWA Cache / Broadcast
               ▼                            ▼                            ▼
      ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
      │  apps/web (Next)│          │  RealtimeGateway│          │ Service Worker  │
      │  Clerk / React  │          │  (/realtime WS) │          │ & BroadcastChan │
      └────────┬────────┘          └────────┬────────┘          └─────────────────┘
               │                            │
               │ Authorization: Bearer      │
               ▼                            │
      ┌─────────────────────────────────────┴─┐
      │          apps/api (NestJS / Fastify)  │
      │  • Fastify RateLimit & Helmet         │
      │  • AuthGuard (Supabase / Clerk Verify)│
      │  • ProfileSyncService (Claims Upsert) │
      │  • Domain Modules (Trips, Itinerary,  │
      │    Expenses, Settlements, Emergency)  │
      └──────────────────┬────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐
│  Drizzle ORM     │             │  Redis 7+ Broker │
│  PostgreSQL 16+  │             │  BullMQ Queue    │
│  (Supabase DB)   │             └────────┬─────────┘
└──────────────────┘                      │
                                          ▼
                                 ┌──────────────────┐
                                 │   apps/worker    │
                                 │   (BullMQ Worker)│
                                 └──────────────────┘
```

---

## 6. Routing Map & Access Intelligence

| Path | Layout / Page | Route Type | Protection | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `apps/web/src/app/page.tsx` | Public Page | Open | Marketing landing page with live interactive product preview. |
| `/dashboard` | `apps/web/src/app/dashboard/page.tsx` | Protected Cockpit | Clerk Authenticated | Lists all user trips, search/filter/sort, plan trip modal with OpenStreetMap geocoding, packing list, templates. |
| `/trips/[id]` | `apps/web/src/app/trips/[id]/page.tsx` | Protected Workspace | Clerk / Bearer | Multi-tab trip workspace (Itinerary, Expenses, Settlements, Tasks, Vault, SOS, Analytics, Members). |
| `/invite/[token]` | `apps/web/src/app/invite/[token]/page.tsx` | Dynamic Invite | Conditional | Previews invitation details and auto-joins authenticated users. |
| `/sign-in/[[...sign-in]]` | `apps/web/src/app/sign-in/` | Clerk Modal | Open | Clerk universal sign-in component. |
| `/sign-up/[[...sign-up]]` | `apps/web/src/app/sign-up/` | Clerk Modal | Open | Clerk universal sign-up component. |
| `/verify-email` | `apps/web/src/app/verify-email/` | Direct OTP Form | Open | Direct email confirmation for Supabase Auth tokens. |
| `/privacy`, `/terms`, `/safety`, `/support` | Static Informational | Open | Public trust, legal, safety guides, and FAQs. |

---

## 7. Frontend Architecture & State Management

### 7.1 Key Frontend Patterns
- **No Heavy Redux Overhead**: Local state is encapsulated within domain views using React hooks (`useState`, `useEffect`, `useMemo`, `useRef`).
- **Dynamic API Auth Bridge (`ApiAuthBridge.tsx`)**: Integrates Clerk session token provider into the raw fetch wrapper `api.ts` so that every outgoing request carries a fresh verified JWT.
- **Pure Role-Based Permission Checking (`canForRole`)**:
  ```typescript
  // Evaluates permissions based on current trip member record:
  canForRole(currentRole, 'DELETE_TRIP');    // OWNER only
  canForRole(currentRole, 'MANAGE_ROLES');   // OWNER or ADMIN
  canForRole(currentRole, 'ADD_EXPENSE');    // OWNER, ADMIN, or MEMBER
  ```
- **Real-Time Cross-Tab Synchronization (`BroadcastChannel`)**:
  `CrewChatDrawer.tsx` and `LiveActivityFeedDrawer.tsx` broadcast events across open tabs via `tripsync_channel_<tripId>` and `tripsync_realtime_chat_<tripId>`.
- **Mountain Offline Sentinel (`MountainOfflineSentinel.tsx`)**:
  Tracks network availability via Web APIs (`navigator.onLine`, `window.addEventListener('online')`) and manages the local mutation sync queue (`tripsync_offline_queue`).

---

## 8. Backend Architecture & Domain Modules

### 8.1 Fastify Engine Setup (`apps/api/src/main.ts`)
- **Fastify Adapter**: Bootstrapped with Fastify for superior throughput compared to Express.
- **Security Middleware**:
  - `@fastify/helmet` with disabled strict CSP to accommodate Swagger and local scripts.
  - `@fastify/rate-limit` capped at 120 requests/min per IP with automated retry-after headers.
  - `@fastify/compress` supporting Gzip, Deflate, and Brotli.
- **Self-Healing Loopback Probe**: Hits `/api/v1/health` on loopback immediately after boot to confirm port binding in production container environments (Render).

### 8.2 Domain Modules Catalog
1. **`AuthModule`**: Handles Supabase Auth endpoints, direct OTP confirmations, and invitation token resolution.
2. **`TripsModule`**: Manages trip creation, auto-assignment of the creator as `OWNER`, trip metadata updates, and cascading deletion.
3. **`MembersModule`**: Handles single-user invites, bulk invite email dispatches, universal shareable link generation (`join_*`), and role transitions.
4. **`ItineraryModule`**: Manages days and activities with location GPS coordinates, sort orders, and assigned lead members.
5. **`ExpensesModule`**: Records expenses with multi-way split participants (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`).
6. **`SettlementsModule`**: Executes the Min-Cash-Flow greedy debt minimization algorithm and records payment settlements.
7. **`TasksModule`**: Manages trip preparation items, due dates, priority tiers (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and status.
8. **`EmergencyModule`**: Manages hospital, police, and insurance contacts, and formats self-contained offline emergency data packets.
9. **`AnalyticsModule`**: Aggregates category spending breakdown, budget velocity, and member spending balances.
10. **`RealtimeModule`**: Socket.IO WebSocket gateway managing presence and event broadcasts across trip rooms.

---

## 9. Database Architecture & Schema Map

### 9.1 Database Tables Catalog
1. **`profiles`**: User identity records mirrored from Supabase Auth / Clerk.
2. **`trips`**: Parent trip entity with dates, budget, destination, and owner.
3. **`trip_members`**: Join table mapping `profiles` to `trips` with role authorization (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
4. **`trip_invitations`**: Stores single-user (`inv_*`) and universal (`join_*`) invitation tokens with expiration timestamps.
5. **`trip_days`**: Itinerary day containers ordered by `day_number`.
6. **`activities`**: Scheduled agenda items with start/end time, GPS coordinates, estimated cost, and status.
7. **`expenses`**: Financial expenditure items paid by a member.
8. **`expense_participants`**: Child table defining individual split amounts for each expense.
9. **`settlements`**: Completed debt settlement transfers between two members.
10. **`tasks`**: Preparation checklist items with due dates, priority, and assignees.
11. **`emergency_contacts`**: Critical SOS facility phone numbers and notes.
12. **`documents`**: Metadata for travel vouchers, permits, and tickets.
13. **`notifications`**: User-specific notification feed.

### 9.2 Row Level Security (RLS) Policies
- All 13 tables have Row Level Security enabled in PostgreSQL.
- SQL helper functions `is_trip_member(trip_id, user_id)` and `is_trip_admin(trip_id, user_id)` enforce tenant privacy at the database engine level.

---

## 10. Authentication Flow & Security

```text
[ CLIENT ]                                    [ BACKEND API ]
Clerk / Supabase Sign In
       │
       ▼
Receives Session JWT
       │
       ▼
ApiAuthBridge sets Token Provider
       │
       ▼
HTTP Request (Authorization: Bearer <JWT>)
       │
       └────────────────────────────────────────► AuthGuard.canActivate()
                                                        │
                                                        ├─► 1. Verify HS256 with SUPABASE_JWT_SECRET
                                                        │      (or Clerk SDK verifyToken fallback)
                                                        │
                                                        ├─► 2. Extract Claims (sub, email, name, avatar)
                                                        │
                                                        ├─► 3. ProfileSyncService.syncFromClaims()
                                                        │      (Idempotent upsert into `profiles`)
                                                        │
                                                        └─► 4. Attach request.user & Execute Controller
```

---

## 11. Complete REST API Inventory

| Method | Endpoint | Auth Required | Input Schema | Affected Tables |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1` | None | N/A | None (API Metadata) |
| `GET` | `/api/v1/health` | None | N/A | PostgreSQL (`SELECT 1`) |
| `POST` | `/api/v1/auth/login` | None | `loginSchema` | `profiles` |
| `POST` | `/api/v1/auth/register` | None | `registerSchema` | `profiles` |
| `POST` | `/api/v1/auth/verify-email-otp` | None | `verifyEmailOtpSchema` | `profiles` |
| `GET` | `/api/v1/auth/invitations/:token` | None | `token: string` | `trip_invitations`, `trips` |
| `POST` | `/api/v1/auth/accept-invitation` | `AuthGuard` | `acceptInvitationSchema` | `trip_invitations`, `trip_members` |
| `GET` | `/api/v1/auth/me` | `AuthGuard` | N/A | `profiles` |
| `POST` | `/api/v1/auth/logout` | None | N/A | None |
| `GET` | `/api/v1/trips` | `AuthGuard` | N/A | `trips`, `trip_members`, `expenses` |
| `GET` | `/api/v1/trips/:tripId` | `AuthGuard` | N/A | `trips` & all child relations |
| `POST` | `/api/v1/trips` | `AuthGuard` | `createTripSchema` | `trips`, `trip_members` |
| `PATCH` | `/api/v1/trips/:tripId` | `AuthGuard` | `updateTripSchema` | `trips` |
| `DELETE` | `/api/v1/trips/:tripId` | `AuthGuard` | N/A | `trips` (Cascades to all) |
| `GET` | `/api/v1/trips/:tripId/members` | `AuthGuard` | N/A | `trip_members`, `profiles` |
| `GET` | `/api/v1/trips/:tripId/members/share-link` | `AuthGuard` | N/A | `trip_invitations` |
| `POST` | `/api/v1/trips/:tripId/members/share-link` | `AuthGuard` | `createShareLinkSchema` | `trip_invitations` |
| `POST` | `/api/v1/trips/:tripId/members/bulk-invite` | `AuthGuard` | `bulkInviteMemberSchema` | `trip_invitations` |
| `POST` | `/api/v1/trips/:tripId/members/invite` | `AuthGuard` | `inviteMemberSchema` | `trip_invitations` |
| `PATCH` | `/api/v1/trips/:tripId/members/:userId/role` | `AuthGuard` (Owner/Admin) | `updateMemberRoleSchema` | `trip_members` |
| `PATCH` | `/api/v1/trips/:tripId/members/:userId/phone`| `AuthGuard` | `{ phone?: string }` | `profiles` |
| `DELETE` | `/api/v1/trips/:tripId/members/:userId` | `AuthGuard` (Owner/Admin) | N/A | `trip_members` |
| `GET` | `/api/v1/trips/:tripId/itinerary` | `AuthGuard` | N/A | `trip_days`, `activities` |
| `POST` | `/api/v1/trips/:tripId/itinerary/days` | `AuthGuard` | `createTripDaySchema` | `trip_days` |
| `DELETE` | `/api/v1/trips/:tripId/itinerary/days/:dayId`| `AuthGuard` | N/A | `trip_days`, `activities` |
| `POST` | `/api/v1/trips/:tripId/itinerary/activities` | `AuthGuard` | `createActivitySchema` | `activities` |
| `PATCH` | `/api/v1/trips/:tripId/itinerary/activities/:activityId`| `AuthGuard` | `updateActivitySchema` | `activities` |
| `DELETE` | `/api/v1/trips/:tripId/itinerary/activities/:activityId`| `AuthGuard` | N/A | `activities` |
| `GET` | `/api/v1/trips/:tripId/expenses` | `AuthGuard` | N/A | `expenses`, `expense_participants` |
| `POST` | `/api/v1/trips/:tripId/expenses` | `AuthGuard` | `createExpenseSchema` | `expenses`, `expense_participants` |
| `PATCH` | `/api/v1/trips/:tripId/expenses/:expenseId` | `AuthGuard` | `updateExpenseSchema` | `expenses`, `expense_participants` |
| `DELETE` | `/api/v1/trips/:tripId/expenses/:expenseId` | `AuthGuard` | N/A | `expenses`, `expense_participants` |
| `GET` | `/api/v1/trips/:tripId/settlements` | `AuthGuard` | N/A | `settlements`, `expenses` |
| `POST` | `/api/v1/trips/:tripId/settlements` | `AuthGuard` | `createSettlementSchema` | `settlements` |
| `GET` | `/api/v1/trips/:tripId/tasks` | `AuthGuard` | N/A | `tasks` |
| `POST` | `/api/v1/trips/:tripId/tasks` | `AuthGuard` | `createTaskSchema` | `tasks` |
| `PATCH` | `/api/v1/trips/:tripId/tasks/:taskId` | `AuthGuard` | `updateTaskSchema` | `tasks` |
| `DELETE` | `/api/v1/trips/:tripId/tasks/:taskId` | `AuthGuard` | N/A | `tasks` |
| `GET` | `/api/v1/trips/:tripId/emergency/contacts` | `AuthGuard` | N/A | `emergency_contacts` |
| `GET` | `/api/v1/trips/:tripId/emergency/packet` | `AuthGuard` | N/A | `trips`, `emergency_contacts` |
| `POST` | `/api/v1/trips/:tripId/emergency/contacts` | `AuthGuard` (Owner/Admin) | `createEmergencyContactSchema` | `emergency_contacts` |
| `PATCH` | `/api/v1/trips/:tripId/emergency/contacts/:contactId`| `AuthGuard` (Owner/Admin)| `updateEmergencyContactSchema`| `emergency_contacts` |
| `DELETE` | `/api/v1/trips/:tripId/emergency/contacts/:contactId`| `AuthGuard` (Owner/Admin)| N/A | `emergency_contacts` |
| `POST` | `/api/v1/trips/:tripId/emergency/seed-starter`| `AuthGuard` (Owner/Admin)| N/A | `emergency_contacts` |
| `GET` | `/api/v1/trips/:tripId/analytics` | `AuthGuard` | N/A | `expenses`, `trips` |

---

## 12. End-to-End Data Flow Diagrams

### 12.1 Expense Creation & Split Flow
```text
Traveler logs expense (e.g. Hotel ₹6,000 paid by Rahul, split equally across 6 members)
  ↓
Frontend validates via createExpenseSchema (Zod)
  ↓
POST /api/v1/trips/:id/expenses (Bearer Token)
  ↓
AuthGuard verifies token & ensures user is a trip member
  ↓
ExpensesService executes Drizzle Transaction:
  1. Insert row into `expenses` (title, amount, paid_by_id)
  2. Insert 6 rows into `expense_participants` (shareAmount: 1000)
  ↓
RealtimeGateway / BroadcastChannel emits 'NEW_EXPENSE' event
  ↓
Clients recalculate balances & update UI instantaneously
```

### 12.2 Min-Cash-Flow Debt Settlement Flow
```text
Traveler opens Settlements Tab
  ↓
GET /api/v1/trips/:id/settlements
  ↓
SettlementsService:
  1. Computes Net Balances for each member: Net = Total Paid - Total Share Owed
  2. Partitions into Debtors (Net < 0) and Creditors (Net > 0)
  3. Sorts both lists descending by amount
  4. Greedy algorithm matches max debtor with max creditor using min(|debt|, credit)
  5. Returns minimal list of transfers (at most N-1 transactions)
  ↓
UI renders "Rahul owes Shubham ₹1,200"
  ↓
User clicks "Settle Up" ➔ UPISettlementModal opens with deep-link & dynamic QR code
  ↓
Payment completed via GPay/PhonePe ➔ POST /settlements records status: SETTLED
```

---

## 13. Environment Variables & Secrets Reference

| Variable Name | Required Scope | Purpose | Security Notes |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend (`apps/api`) | PostgreSQL connection string (Supabase / local Docker). | Must be kept private. |
| `DIRECT_URL` | Backend (`apps/api`) | Direct database connection string for migrations. | Private. |
| `SUPABASE_URL` | Backend & Web | Supabase Project URL. | Safe for frontend public exposure. |
| `SUPABASE_ANON_KEY` | Backend & Web | Supabase Anon Key. | Safe for public client operations. |
| `SUPABASE_SERVICE_ROLE_KEY`| Backend only | Administrative Supabase master key. | **Strictly private** to server. |
| `SUPABASE_JWT_SECRET` | Backend only | Secret key used to verify Supabase HS256 session JWTs. | **Strictly private**; API will fail at boot in prod if missing. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web App | Clerk frontend publishable key. | Public client key. |
| `CLERK_SECRET_KEY` | Backend only | Clerk server API secret key for token verification. | **Strictly private** to backend. |
| `NEXT_PUBLIC_API_URL` | Web App | Base URL for REST API calls (e.g. `http://localhost:4000/api/v1`). | Public. |
| `REDIS_HOST`, `REDIS_PORT` | Backend & Worker | Redis connection host and port for Pub/Sub & BullMQ. | Private. |
| `REDIS_PASSWORD` | Backend & Worker | Password for authenticated Redis instances. | Private. |
| `RESEND_API_KEY` | Backend only | API key for transactional email delivery via Resend. | Private. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Backend only | SMTP configuration for email delivery fallback. | Private. |
| `EMAIL_FROM` | Backend only | Sender email identity for invitations (e.g. `"TripSync <noreply@tripsync.app>"`). | Config. |
| `WEB_URL` | Backend only | Comma-separated allowed frontend origins for CORS and invite links. | Config. |
| `PORT` | Backend only | API listen port (defaults to `4000`). | Config. |

---

## 14. Third-Party Integrations

1. **Clerk Auth**: Primary frontend identity management, OAuth providers, and user sessions.
2. **Supabase PostgreSQL**: Cloud-hosted relational database with Row Level Security.
3. **Open-Meteo Geocoding & Climate API**: Free, keyless geocoding and live 5-day weather/sunrise forecasts.
4. **OpenStreetMap Nominatim**: Real-time destination autocomplete in trip creation forms.
5. **Wikimedia Commons API**: Automatically resolves high-resolution landscape cover photos for destinations.
6. **Google Maps URL Schema**: Generates multi-stop turn-by-turn navigation links and embedded maps.
7. **QRServer API**: Generates dynamic UPI payment QR codes on-the-fly.
8. **Resend & Nodemailer**: Live email delivery for single and bulk trip invitations.

---

## 15. Feature Inventory Matrix

| Feature Area | Sub-Feature | Frontend Component / Page | Backend Controller / Service | Database Tables |
| :--- | :--- | :--- | :--- | :--- |
| **Trips** | Create Trip with Auto-Image | `DashboardContent` modal | `TripsController.createTrip` | `trips`, `trip_members` |
| **Trips** | Inspiration Templates | `INSPIRATION_TEMPLATES` | N/A (Client-side fast start) | N/A |
| **Trips** | Packing Checklist | `DEFAULT_PACKING_ITEMS` | N/A (Client-side checklist) | N/A |
| **Members** | Universal Share Links | `trips/[id]` Members tab | `MembersService.getOrCreateShareLink` | `trip_invitations` |
| **Members** | Bulk Email Invites | `trips/[id]` Bulk Invite modal | `MembersService.bulkInviteMembers` | `trip_invitations` |
| **Members** | RBAC Role Management | `trips/[id]` Members tab | `MembersService.updateMemberRole` | `trip_members` |
| **Itinerary** | Day-by-Day Agenda | `trips/[id]` Itinerary tab | `ItineraryService.getItinerary` | `trip_days`, `activities` |
| **Itinerary** | Route Visualizer & GPS | `ItineraryRouteMap.tsx` | N/A (GPS link + Embed) | `activities` |
| **Itinerary** | Destination Weather | `DestinationWeatherWidget.tsx` | N/A (Open-Meteo API) | N/A |
| **Expenses** | Multi-Way Split Logging | `trips/[id]` Expenses tab | `ExpensesService.createExpense` | `expenses`, `expense_participants` |
| **Expenses** | Receipt Photo Zoom | `ReceiptPreviewModal.tsx` | N/A (Client viewer) | `expenses.receipt_url` |
| **Settlements**| Min-Cash-Flow Optimizer | `trips/[id]` Settlements section| `SettlementsService.getTripSettlements`| `settlements`, `expenses` |
| **Settlements**| 1-Tap UPI Settlement | `UPISettlementModal.tsx` | `SettlementsService.recordSettlement`| `settlements` |
| **Tasks** | Group Checklist & Due Dates| `trips/[id]` Tasks tab | `TasksService.getTripTasks` | `tasks` |
| **Vault** | PIN-Locked Document Storage| `DocumentVaultSection.tsx` | N/A (Local encrypted storage)| `documents` |
| **Emergency** | Offline SOS Directory | `trips/[id]` Emergency tab | `EmergencyService.getEmergencyContacts`| `emergency_contacts` |
| **Emergency** | Offline Printable Packet | `trips/[id]` Emergency tab | `EmergencyService.getEmergencyPacket`| `trips`, `emergency_contacts` |
| **Analytics** | Category & Velocity Charts | `trips/[id]` Analytics tab | `AnalyticsService.getTripAnalytics` | `expenses`, `trips` |
| **Realtime** | Cross-Tab Crew Chat | `CrewChatDrawer.tsx` | `RealtimeGateway` (WebSocket) | Memory / Broadcast |
| **Realtime** | Activity Feed & Alerts | `LiveActivityFeedDrawer.tsx` | `RealtimeGateway` (WebSocket) | `notifications` |
| **Offline** | Mountain Offline Sentinel | `MountainOfflineSentinel.tsx` | N/A (Service Worker `sw.js`) | `localStorage` queue |

---

## 16. Performance Notes & Optimizations

1. **Fastify Engine & Brotli Compression**: The backend runs on Fastify, serving JSON responses with ~2x lower overhead than traditional Express stacks. Compression reduces network payloads over mobile cell towers.
2. **Greedy Settlement Minimization**: Replaces $O(N^2)$ debt transactions with $O(N)$ minimal transfers, drastically reducing mental overhead for travelers.
3. **PWA Shell & Asset Caching**: `public/sw.js` caches static JS/CSS bundles and SVGs, ensuring instant initial load even in 2G networks.
4. **Targeted Drizzle Queries**: Database queries select relational trees explicitly with relations API (`with: { ... }`) to eliminate hidden N+1 queries.
5. **Database Indexing**: Explicit composite indexes exist for `(trip_id, user_id)`, `(trip_id, date)`, `(owner_id, status)`, and `(day_id, sort_order)`.

---

## 17. Technical Debt & Codebase Observations

1. **In-Memory Mock Fallback in Services**: Several backend services (`TripsService`, `ItineraryService`, `ExpensesService`, `TasksService`, `EmergencyService`) contain conditional fallback logic (`if (this.db) { ... } else { return this.mock... }`). While convenient for local prototyping without a database, production strictly runs with `DATABASE_URL` configured. Removing mock branches in a future refactor will simplify service code.
2. **Single-File Trip Detail Workspace (`apps/web/src/app/trips/[id]/page.tsx`)**: The trip workspace file is comprehensive (~4,200 lines). Extracting each tab into dedicated sub-components (e.g. `TripItineraryTab.tsx`, `TripExpensesTab.tsx`, `TripMembersTab.tsx`) will improve maintainability and bundle splitting.
3. **Client-Side Document Vault Storage**: `DocumentVaultSection.tsx` currently persists Base64 files in `localStorage` with a 5MB guard. Transitioning document uploads to Supabase Storage buckets with pre-signed upload URLs will enable large PDF multi-page tickets.

---

## 18. Development Workflow

### 18.1 Local Setup
```bash
# 1. Install dependencies across all monorepo packages
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start local Postgres, Redis, and Mailpit
docker compose up -d

# 4. Push schema & seed development personas
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Start parallel development servers
pnpm dev
```
- **Web App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api/v1`
- **API Swagger Explorer**: `http://localhost:4000/api/docs`
- **Mailpit Email Testing**: `http://localhost:8025`

---

## 19. Deployment Process

- **Frontend (`apps/web`)**: Deployed to **Vercel** with environment variables `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_API_URL`.
- **Backend (`apps/api`)**: Deployed to **Render** or **Railway** as a Node.js container with `DATABASE_URL`, `SUPABASE_JWT_SECRET`, and `REDIS_HOST`.
- **Database (`Supabase`)**: Managed PostgreSQL with executed migrations from `supabase/migrations/0001_rls_policies.sql`.
- **Liveness Ping**: GitHub Actions workflow (`.github/workflows/keep-alive.yml`) runs every 12 minutes to keep free-tier instances active and prevent cold starts.

---

## 20. Known Risks & Future Recommendations

| Risk / Opportunity | Severity | Mitigation / Recommendation |
| :--- | :--- | :--- |
| **Render/Supabase Free Tier Sleep** | Medium | Keep-alive GitHub Actions workflow is actively running. For production, migrate to paid always-on instances. |
| **Mobile Offline Sync Conflicts** | Low | Implement Vector Clocks or Last-Write-Wins timestamps on offline queued mutations. |
| **Large File Storage Limits** | Low | Connect Supabase Storage bucket with signed upload URLs for multi-page PDF vouchers and high-resolution receipts. |
| **AI Itinerary Assistant** | Future Opportunity | Implement an AI agent endpoint (using Gemini / LangChain) to suggest day-by-day itineraries based on traveler pace and weather forecasts. |
