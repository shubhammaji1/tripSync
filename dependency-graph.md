# 🕸️ TripSync — Dependency Graph & Critical Files

> **Package Graph, Module Dependencies, Critical Core System Files & High-Impact Risk Areas**

---

## 1. Monorepo Package Relationship Graph

```text
                        ┌────────────────────────┐
                        │    @tripsync/config    │
                        └───────────┬────────────┘
                                    │ (tsconfig, tooling)
                                    ▼
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│@tripsync/types│◄────────────│@tripsync/val-│             │ @tripsync/ui │
│(models/enums)│             │idation (zod) │             │ (components) │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       ├────────────────────────────┼────────────────────────────┤
       │                            │                            │
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│   apps/api   │             │   apps/web   │             │ apps/worker  │
│  (NestJS 11) │             │ (Next.js 14) │             │   (BullMQ)   │
└──────────────┘             └──────────────┘             └──────────────┘
```

---

## 2. Monorepo Package Catalog

| Package | Path | Type | Responsibilities & Dependents |
| :--- | :--- | :--- | :--- |
| `@tripsync/types` | `packages/types` | TypeScript Shared Lib | Defines all domain Enums (`TripRole`, `TripPrivacy`, `ExpenseCategory`, etc.) and Model interfaces (`Trip`, `Profile`, `Expense`, `Settlement`). Consumed by `apps/api`, `apps/web`, `apps/worker`, and `@tripsync/validation`. |
| `@tripsync/validation` | `packages/validation` | Zod Validation Lib | Zod schemas and inferred TypeScript types for all entity mutations, auth requests, and API payloads. Consumed by `apps/api` and `apps/web`. |
| `@tripsync/ui` | `packages/ui` | React UI Primitives | Reusable shared UI primitives (`Button`, `Card`, `Badge`) with Tailwind merging (`tailwind-merge` + `clsx`). |
| `@tripsync/config` | `packages/config` | Tooling Config | Shared base `tsconfig.json` rules for TypeScript compiler consistency. |
| `@tripsync/api` | `apps/api` | Backend Microservice | REST API & WebSocket Server (NestJS 10/11, Fastify, Drizzle ORM, Socket.IO, BullMQ). |
| `@tripsync/web` | `apps/web` | Frontend Web App | Next.js 14 App Router, React 18, Clerk, Tailwind, Lucide, Recharts. |
| `@tripsync/worker` | `apps/worker` | Background Worker | BullMQ job consumer listening on Redis for notifications & emails. |

---

## 3. Critical & High-Impact System Files

> [!CAUTION]
> The following core system files form the backbone of security, data consistency, and routing. Modifications to these files have cross-cutting impacts across the entire platform.

| File Path | Impact Level | Critical Responsibility | Reason for Care |
| :--- | :--- | :--- | :--- |
| `apps/api/src/database/schema.ts` | 🔴 CRITICAL | Single source of truth for Drizzle ORM table schemas, enums, relations, and foreign key cascades. | Any schema divergence breaks migrations, Drizzle queries, and type safety across backend. |
| `apps/api/src/common/auth.guard.ts` | 🔴 CRITICAL | Intercepts all authenticated HTTP requests, verifies Supabase JWT / Clerk signatures, enforces tenant identity. | Security vulnerability / authentication bypass risk if altered improperly. |
| `apps/api/src/common/profile-sync.service.ts` | 🔴 CRITICAL | Idempotent upsert bridge between verified JWT claims and database `profiles`. | Ensures user records exist before any relational queries execute. |
| `apps/api/src/modules/settlements/settlements.service.ts` | 🔴 CRITICAL | Implements Min-Cash-Flow greedy debt minimization algorithm. | Financial calculation accuracy; errors cause incorrect debt reconciliation. |
| `apps/web/src/lib/api.ts` | 🔴 CRITICAL | Universal API client fetch wrapper with dynamic auth token injection and error sanitization. | Any bug breaks data fetching across all frontend pages. |
| `apps/web/src/lib/auth-context.tsx` | 🟠 HIGH | RBAC client permissions evaluator (`canForRole`) and auth state container. | Governs UI action visibility (edit, delete, invite). |
| `apps/web/src/components/ApiAuthBridge.tsx` | 🟠 HIGH | Connects Clerk React hook session token to API fetcher. | Failure prevents authenticated requests from sending bearer headers. |
| `apps/api/src/main.ts` | 🟠 HIGH | Fastify bootstrapping, Helmet, Rate limiting, CORS, Compression, Swagger setup. | Infrastructure security and global middleware order. |
| `supabase/migrations/0001_rls_policies.sql` | 🟠 HIGH | Row Level Security (RLS) policies and security definer helper functions in PostgreSQL. | Database defense-in-depth enforcement. |
| `apps/web/public/sw.js` | 🟡 MEDIUM | PWA Service worker with Mountain Offline caching strategy. | Cache invalidation / offline availability behavior. |

---

## 4. Backend NestJS Module Dependency Graph

```text
AppModule
├── ConfigModule (Global, loads .env)
├── CommonModule (Global: ProfileSyncService, MailService, AuthGuard, RolesGuard)
├── DatabaseModule (Global: DRIZZLE_PROVIDER connection pool to PostgreSQL)
├── RealtimeModule (Global: RealtimeGateway Socket.IO server)
├── AuthModule (AuthService, AuthController)
├── TripsModule (TripsService, TripsController)
├── MembersModule (MembersService, MembersController)
├── ItineraryModule (ItineraryService, ItineraryController)
├── ExpensesModule (ExpensesService, ExpensesController)
├── SettlementsModule (SettlementsService, SettlementsController)
├── TasksModule (TasksService, TasksController)
├── EmergencyModule (EmergencyService, EmergencyController)
├── AnalyticsModule (AnalyticsService, AnalyticsController)
└── HealthController & RootController
```

---

## 5. Frontend Component Hierarchy

```text
RootLayout (apps/web/src/app/layout.tsx)
├── ClerkProvider (@clerk/nextjs)
│   └── AuthProvider (apps/web/src/lib/auth-context.tsx)
│       ├── ApiAuthBridge (injects Clerk JWT into api.ts)
│       ├── Navbar (TripSyncLogo, navigation, Clerk UserButton / SignInButton)
│       ├── Main Content Children:
│       │   ├── LandingPage (apps/web/src/app/page.tsx)
│       │   ├── DashboardPage (apps/web/src/app/dashboard/page.tsx)
│       │   ├── TripWorkspacePage (apps/web/src/app/trips/[id]/page.tsx)
│       │   │   ├── Overview Tab ➔ DestinationWeatherWidget
│       │   │   ├── Itinerary Tab ➔ ItineraryRouteMap
│       │   │   ├── Expenses Tab ➔ ReceiptPreviewModal
│       │   │   ├── Settlements Tab ➔ UPISettlementModal
│       │   │   ├── Tasks Tab ➔ Task Checklists
│       │   │   ├── Documents Tab ➔ DocumentVaultSection
│       │   │   ├── Emergency Tab ➔ Emergency Contacts & Offline Print Packet
│       │   │   ├── Analytics Tab ➔ Recharts (PieChart, BarChart)
│       │   │   ├── Members Tab ➔ Universal Share Link & Bulk Invites
│       │   │   ├── Floating Overlay ➔ CrewChatDrawer
│       │   │   └── Floating Overlay ➔ LiveActivityFeedDrawer
│       │   └── AcceptInvitationPage (apps/web/src/app/invite/[token]/page.tsx)
│       ├── Footer (TripSyncLogo, legal links, platform status)
│       ├── PWAInstallPrompt (PWA home screen install handler)
│       └── MountainOfflineSentinel (Zero-network detection & sync banner)
```
