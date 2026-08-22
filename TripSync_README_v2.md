# 🌍 TripSync

> **Plan together. Travel smarter. Stay connected.**

TripSync is a modern, open-source collaborative travel platform designed
to solve the messy reality of group-trip coordination.

Instead of switching between WhatsApp, Google Maps, spreadsheets, notes,
payment screenshots, and email, TripSync provides a shared workspace for
the entire trip --- from planning and expenses to real-time coordination
and emergency information.

**Status:** 🚧 Active Development\
**License:** Apache-2.0\
**Architecture:** Modular Monolith\
**Primary Database:** Supabase PostgreSQL

------------------------------------------------------------------------

## ✨ Why TripSync?

Planning a group trip usually looks like this:

``` text
WhatsApp        → communication
Google Maps     → locations
Google Sheets   → expenses
Notes           → itinerary
UPI screenshots → payments
Email           → tickets
Gallery         → documents
```

The result:

-   outdated itineraries
-   unclear responsibilities
-   forgotten expenses
-   difficult settlements
-   missed last-minute changes
-   scattered travel documents
-   no reliable emergency information

### TripSync's goal

Create **one shared source of truth for a trip**.

``` text
DISCOVER
   ↓
CREATE / JOIN
   ↓
PLAN
   ↓
COORDINATE
   ↓
TRAVEL
   ↓
TRACK EXPENSES
   ↓
HANDLE EMERGENCIES
   ↓
REVIEW
```

------------------------------------------------------------------------

# 🎯 Product Vision

TripSync should eventually become a complete operating system for group
travel.

### Core areas

  Area               Purpose
  ------------------ ------------------------------------------------------
  🧳 Trips           Create and manage trips
  👥 Groups          Invite and manage travelers
  🗓️ Itinerary       Build collaborative day-by-day plans
  💰 Expenses        Track and split group expenses
  🧮 Settlements     Calculate who owes whom
  📋 Tasks           Assign responsibilities
  ⚡ Realtime        Keep everyone synchronized
  🔔 Notifications   Deliver important updates
  📍 Maps            Organize locations and routes
  🆘 Emergency       Quickly access critical trip information
  📊 Analytics       Understand trip spending
  🤖 AI              Assist with planning and trip questions
  📱 Offline         Keep critical information available without internet

------------------------------------------------------------------------

# 🏗️ Architecture

TripSync will start as a **modular monolith**.

This is intentional.

We don't want unnecessary microservices before the product has real
users or scale requirements.

``` text
                         ┌──────────────────────┐
                         │      Next.js 16      │
                         │   React + TypeScript  │
                         └──────────┬───────────┘
                                    │
                              HTTPS / REST
                                    │
                         ┌──────────▼───────────┐
                         │       NestJS 11      │
                         │    API + Business    │
                         │       Logic          │
                         ├──────────────────────┤
                         │ Auth / Users         │
                         │ Trips                │
                         │ Members / RBAC       │
                         │ Itinerary            │
                         │ Expenses             │
                         │ Settlements          │
                         │ Tasks                │
                         │ Notifications        │
                         │ Emergency            │
                         │ Analytics            │
                         └───────┬───────┬──────┘
                                 │       │
                 ┌───────────────┘       └───────────────┐
                 ▼                                       ▼
        ┌──────────────────┐                    ┌────────────────┐
        │    Supabase      │                    │     Redis      │
        │                  │                    │                │
        │ PostgreSQL       │                    │ Cache          │
        │ Auth             │                    │ Pub/Sub        │
        │ Storage          │                    │ Rate Limiting  │
        │ Realtime         │                    └───────┬────────┘
        └──────────────────┘                            │
                                                        ▼
                                                 ┌──────────────┐
                                                 │    BullMQ    │
                                                 │    Worker    │
                                                 │              │
                                                 │ Notifications│
                                                 │ Reminders    │
                                                 │ Background   │
                                                 │ Jobs         │
                                                 └──────────────┘
```

------------------------------------------------------------------------

# 🧰 Technology Stack

## Frontend

-   **Next.js 16**
-   **React 19**
-   **TypeScript**
-   **Tailwind CSS**
-   **shadcn/ui**
-   **TanStack Query**
-   **React Hook Form**
-   **Zod**
-   **MapLibre GL JS**
-   **Recharts**

## Backend

-   **NestJS 11**
-   **TypeScript**
-   **Fastify**
-   REST API
-   WebSockets
-   OpenAPI / Swagger
-   Structured logging

## Supabase

Supabase is the primary managed data platform.

### PostgreSQL

Relational data:

``` text
Users
Trips
Members
Itinerary
Expenses
Settlements
Tasks
Notifications
Documents
```

### Supabase Auth

Used for:

-   Email/password
-   OAuth
-   Email verification
-   Password recovery
-   Sessions

### Supabase Storage

Used for:

-   Profile photos
-   Trip cover images
-   Expense receipts
-   Travel documents

### Supabase Realtime

Used for:

-   Trip updates
-   Itinerary changes
-   Expense updates
-   Member activity
-   Notifications

### Row Level Security

RLS protects data at the database layer.

------------------------------------------------------------------------

# 🗄️ Database Layer

### Primary database

**Supabase PostgreSQL**

### ORM

**Drizzle ORM**

Recommended architecture:

``` text
NestJS
   │
   ├── Drizzle
   │      ↓
   │   PostgreSQL
   │      ↓
   │   Supabase
   │
   ├── Supabase Auth
   │
   ├── Supabase Storage
   │
   └── Supabase Realtime
```

Drizzle is used for strongly typed database queries and schema
management while Supabase provides the managed PostgreSQL platform and
its surrounding services.

------------------------------------------------------------------------

# 🗃️ Database Model

Initial domain model:

``` text
profiles
    │
    ├───────────────┐
    │               │
    ▼               ▼
trip_members   notifications
    │
    ▼
trips
 │
 ├── trip_invitations
 │
 ├── trip_days
 │      └── activities
 │
 ├── expenses
 │      └── expense_participants
 │
 ├── settlements
 │
 ├── tasks
 │
 ├── documents
 │
 └── emergency_contacts
```

Future entities:

``` text
comments
audit_logs
budgets
locations
location_shares
trip_images
reports
reviews
organizer_profiles
```

------------------------------------------------------------------------

# 🔐 Security Architecture

Security is a first-class feature.

## Authentication

Supabase Auth handles identity.

## Authorization

NestJS handles application-level authorization.

Supabase RLS provides database-level protection.

``` text
Request
   ↓
Authentication
   ↓
User identity
   ↓
Trip membership
   ↓
Role / permission check
   ↓
Business rule validation
   ↓
Database RLS
   ↓
Response
```

### Roles

``` text
OWNER
ADMIN
MEMBER
VIEWER
```

Example:

``` text
OWNER
 ├── Delete trip
 ├── Manage admins
 └── Manage members

ADMIN
 ├── Manage members
 ├── Edit itinerary
 └── Manage trip tasks

MEMBER
 ├── Add expenses
 ├── Suggest activities
 └── Complete tasks

VIEWER
 └── Read-only access
```

Never rely only on frontend permissions.

------------------------------------------------------------------------

# 🧳 Feature Roadmap

## Phase 1 --- Foundation

### Authentication

-   [ ] Registration
-   [ ] Login
-   [ ] Logout
-   [ ] OAuth
-   [ ] Email verification
-   [ ] Password recovery
-   [ ] Profile
-   [ ] Session management

### Project foundation

-   [ ] Monorepo
-   [ ] TypeScript
-   [ ] ESLint
-   [ ] Prettier
-   [ ] Git hooks
-   [ ] Docker
-   [ ] Supabase
-   [ ] Redis
-   [ ] CI pipeline

------------------------------------------------------------------------

# 🗺️ Phase 2 --- Trips & Groups

### Trip management

-   [ ] Create trip
-   [ ] Edit trip
-   [ ] Archive trip
-   [ ] Delete trip
-   [ ] Destination
-   [ ] Start/end dates
-   [ ] Cover image
-   [ ] Trip privacy

### Members

-   [ ] Invite users
-   [ ] Invite links
-   [ ] Accept invitation
-   [ ] Remove member
-   [ ] Change role
-   [ ] Leave trip

------------------------------------------------------------------------

# 📅 Phase 3 --- Collaborative Itinerary

Create day-by-day plans.

Example:

``` text
DAY 1 — DARJEELING

08:00
Breakfast

09:00
Tiger Hill

12:30
Lunch

14:00
Hotel check-in

16:00
Mall Road

20:00
Dinner
```

Features:

-   [ ] Trip days
-   [ ] Activities
-   [ ] Time
-   [ ] Location
-   [ ] Notes
-   [ ] Estimated cost
-   [ ] Responsible member
-   [ ] Drag & drop
-   [ ] Suggestions
-   [ ] Comments
-   [ ] Activity status

------------------------------------------------------------------------

# 💰 Phase 4 --- Expense Management

Add:

``` text
Hotel       ₹6000
Cab         ₹2400
Food        ₹3200
Tickets     ₹1800
------------------
Total      ₹13400
```

Expense fields:

``` text
amount
currency
paidBy
participants
category
date
notes
receipt
```

## Settlement Algorithm

Suppose:

``` text
A paid ₹6000
B paid ₹2000
C paid ₹1000
D paid ₹500
```

TripSync calculates net balances and produces an optimized settlement.

Instead of unnecessary transactions:

``` text
A → B
A → C
D → B
B → C
...
```

produce something closer to:

``` text
D → A ₹750
C → A ₹1500
B → A ₹500
```

The settlement engine is an important algorithmic component of TripSync.

------------------------------------------------------------------------

# 📋 Phase 5 --- Responsibilities

Trips need people responsible for things.

``` text
Train tickets    → Rahul
Hotel booking    → Shubham
Food planning    → Amit
First-aid kit    → Priya
Vehicle          → Arjun
```

Features:

-   [ ] Create task
-   [ ] Assign member
-   [ ] Due date
-   [ ] Priority
-   [ ] Status
-   [ ] Comments
-   [ ] Activity history
-   [ ] Notifications

------------------------------------------------------------------------

# ⚡ Phase 6 --- Realtime Collaboration

Users should see important changes without refreshing.

Example:

``` text
Shubham changed Day 2 itinerary

Rahul added ₹850 taxi expense

Amit joined the trip

Priya changed hotel check-in time
```

Architecture:

``` text
Application Event
       ↓
NestJS
       ↓
Redis Pub/Sub
       ↓
Realtime Layer
       ↓
Connected Clients
```

Supabase Realtime can also be used where direct database change
subscriptions are appropriate.

Important events:

``` text
trip.member.joined
trip.member.removed

trip.itinerary.created
trip.itinerary.updated
trip.itinerary.deleted

trip.expense.created
trip.expense.updated

trip.task.assigned
trip.task.completed

trip.emergency.triggered
```

------------------------------------------------------------------------

# 🔔 Phase 7 --- Notifications

Notification channels:

``` text
In-App
Email
Push
```

Examples:

-   Trip invitation
-   Itinerary changed
-   Expense added
-   Settlement reminder
-   Task assigned
-   Task overdue
-   Trip starting soon
-   Emergency event

Use BullMQ for background processing.

``` text
API Request
    ↓
Create Notification Job
    ↓
Redis / BullMQ
    ↓
Worker
    ↓
Email / Push / In-App
```

The API should not wait for email delivery.

------------------------------------------------------------------------

# 📍 Phase 8 --- Maps

Use:

**MapLibre GL JS**

Features:

-   [ ] Trip destination
-   [ ] Activity locations
-   [ ] Hotel
-   [ ] Transport points
-   [ ] Route visualization
-   [ ] Location sharing
-   [ ] Emergency location sharing

Location sharing must always be:

``` text
Opt-in
+
Visible
+
Revocable
```

Never expose a user's live location by default.

------------------------------------------------------------------------

# 🆘 Phase 9 --- Emergency Mode

One of TripSync's major differentiators.

A user can immediately access:

``` text
┌─────────────────────────────┐
│       EMERGENCY MODE        │
├─────────────────────────────┤
│                             │
│ Current trip                │
│ Emergency contacts          │
│ Trip members                │
│ Accommodation               │
│ Important documents         │
│ Current location            │
│                             │
│ SHARE LOCATION              │
│ CONTACT PERSON              │
└─────────────────────────────┘
```

### Design requirements

Emergency mode should:

-   load quickly
-   use minimal UI
-   work with limited connectivity where possible
-   expose only necessary information
-   avoid unnecessary animations
-   keep critical information locally available

------------------------------------------------------------------------

# 📊 Phase 10 --- Trip Analytics

Example:

``` text
TOTAL TRIP COST

₹18,450

Transportation    34%
Accommodation     27%
Food              22%
Activities        17%
```

Analytics:

-   [ ] Total trip cost
-   [ ] Cost per person
-   [ ] Category breakdown
-   [ ] Daily spending
-   [ ] Budget vs actual
-   [ ] Member contributions
-   [ ] Settlement status

------------------------------------------------------------------------

# 🤖 Phase 11 --- AI Assistant

AI should enhance the product rather than become the product.

### Itinerary assistant

``` text
Create a 4-day Darjeeling itinerary
for 6 people with a ₹25,000 budget.
```

### Expense insights

``` text
"You are spending 28% more on
transport than your original budget."
```

### Trip assistant

``` text
"What is planned tomorrow?"

"Who still owes money?"

"Where is our hotel?"
```

### AI safety principle

AI should not silently perform important external actions.

``` text
AI suggestion
     ↓
User confirmation
     ↓
Application action
```

------------------------------------------------------------------------

# 📱 Phase 12 --- Offline / PWA

TripSync should progressively support offline use.

Critical offline information:

``` text
Trip name
Itinerary
Accommodation
Emergency contacts
Important documents
Selected locations
```

Architecture:

``` text
Server
  ↓
Sync Layer
  ↓
Local Cache
  ↓
Offline UI
```

Full offline editing should only be introduced once synchronization
conflicts are properly designed.

------------------------------------------------------------------------

# 🧱 Monorepo Structure

``` text
tripsync/
│
├── apps/
│   ├── web/
│   │   └── Next.js
│   │
│   ├── api/
│   │   └── NestJS
│   │
│   └── worker/
│       └── BullMQ
│
├── packages/
│   ├── ui/
│   ├── validation/
│   ├── types/
│   ├── config/
│   └── eslint-config/
│
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── config.toml
│
├── docs/
│   ├── architecture/
│   ├── database/
│   ├── api/
│   └── decisions/
│
├── infrastructure/
│   └── docker/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── LICENSE
└── README.md
```

------------------------------------------------------------------------

# 🔄 API Structure

Use versioned REST APIs.

``` text
/api/v1/auth
/api/v1/users
/api/v1/trips
/api/v1/trips/:tripId/members
/api/v1/trips/:tripId/invitations
/api/v1/trips/:tripId/itinerary
/api/v1/trips/:tripId/expenses
/api/v1/trips/:tripId/settlements
/api/v1/trips/:tripId/tasks
/api/v1/trips/:tripId/notifications
/api/v1/trips/:tripId/emergency
/api/v1/trips/:tripId/analytics
```

Example:

``` http
POST   /api/v1/trips
GET    /api/v1/trips/:tripId
PATCH  /api/v1/trips/:tripId
DELETE /api/v1/trips/:tripId
```

Generate OpenAPI documentation from NestJS.

------------------------------------------------------------------------

# 🧪 Testing Strategy

Testing is required for every important feature.

## Unit Tests

Test:

-   Expense calculations
-   Settlement algorithm
-   Permission logic
-   Budget calculations
-   Date/time logic

## Integration Tests

Test:

``` text
API
 ↓
Service
 ↓
Database
```

## End-to-End Tests

Use Playwright.

Example:

``` text
Register
 ↓
Create trip
 ↓
Invite member
 ↓
Accept invitation
 ↓
Add expense
 ↓
Verify settlement
```

### Testing philosophy

Don't chase 100% coverage.

Prioritize:

``` text
Critical business logic
        ↓
High test coverage

Critical user flows
        ↓
E2E tests

Infrastructure
        ↓
Integration tests
```

------------------------------------------------------------------------

# 📈 Observability

Production software should be observable.

Implement:

``` text
Structured Logs
       +
Metrics
       +
Tracing
       +
Error Tracking
       +
Health Checks
```

Recommended:

-   Pino
-   OpenTelemetry
-   Sentry
-   Prometheus-compatible metrics
-   Grafana later

Track:

``` text
API latency
5xx rate
Database latency
Queue failures
Notification failures
Realtime connections
Background job duration
```

------------------------------------------------------------------------

# 🐳 Local Development

Supabase can be used through the hosted platform, while local
development can use the Supabase CLI for a reproducible local stack.

For supporting infrastructure:

``` bash
docker compose up -d
```

Possible local services:

``` text
Redis
Mailpit
```

Then:

``` bash
pnpm install
pnpm dev
```

Recommended developer experience:

``` text
Clone repository
      ↓
Install dependencies
      ↓
Start local infrastructure
      ↓
Start Supabase local environment
      ↓
Run migrations
      ↓
Seed database
      ↓
Start applications
```

------------------------------------------------------------------------

# 🌱 Development Roadmap

## Sprint 0 --- Foundation

-   [ ] GitHub repository
-   [ ] pnpm monorepo
-   [ ] Turborepo
-   [ ] Next.js
-   [ ] NestJS
-   [ ] Supabase project
-   [ ] Supabase CLI
-   [ ] Database migrations
-   [ ] Redis
-   [ ] Docker Compose
-   [ ] ESLint
-   [ ] Prettier
-   [ ] Git hooks
-   [ ] GitHub Actions

## Sprint 1 --- Authentication

-   [ ] Supabase Auth
-   [ ] User profile
-   [ ] OAuth
-   [ ] Session handling
-   [ ] Email verification
-   [ ] Password recovery
-   [ ] Protected routes
-   [ ] Backend authentication guard

## Sprint 2 --- Trips

-   [ ] Create trip
-   [ ] Edit trip
-   [ ] Archive trip
-   [ ] Trip details
-   [ ] Trip cover
-   [ ] Member management
-   [ ] Invitations
-   [ ] RBAC
-   [ ] RLS policies

## Sprint 3 --- Itinerary

-   [ ] Trip days
-   [ ] Activities
-   [ ] Activity locations
-   [ ] Drag & drop
-   [ ] Comments
-   [ ] Suggestions
-   [ ] Realtime updates

## Sprint 4 --- Expenses

-   [ ] Add expense
-   [ ] Split expense
-   [ ] Categories
-   [ ] Receipt upload
-   [ ] Balances
-   [ ] Settlement algorithm
-   [ ] Settlement history
-   [ ] Tests

## Sprint 5 --- Tasks

-   [ ] Create task
-   [ ] Assign member
-   [ ] Priority
-   [ ] Due date
-   [ ] Status
-   [ ] Notifications

## Sprint 6 --- Realtime

-   [ ] Event architecture
-   [ ] Redis Pub/Sub
-   [ ] Realtime itinerary
-   [ ] Realtime expenses
-   [ ] Member presence
-   [ ] Activity feed

## Sprint 7 --- Notifications

-   [ ] In-app notifications
-   [ ] Email worker
-   [ ] Push notifications
-   [ ] Scheduled reminders

## Sprint 8 --- Maps

-   [ ] MapLibre
-   [ ] Destination map
-   [ ] Activity markers
-   [ ] Routes
-   [ ] Location sharing

## Sprint 9 --- Emergency

-   [ ] Emergency contacts
-   [ ] Emergency mode
-   [ ] Location sharing
-   [ ] Offline emergency data

## Sprint 10 --- Analytics

-   [ ] Expense dashboard
-   [ ] Budget
-   [ ] Spending categories
-   [ ] Member contributions
-   [ ] Settlement analytics

## Sprint 11 --- AI

-   [ ] AI itinerary assistant
-   [ ] Expense insights
-   [ ] Trip Q&A
-   [ ] Tool calling
-   [ ] Confirmation workflow

## Sprint 12 --- Production Hardening

-   [ ] Security audit
-   [ ] Load testing
-   [ ] Performance testing
-   [ ] E2E coverage
-   [ ] Observability
-   [ ] Error tracking
-   [ ] Backups
-   [ ] Deployment
-   [ ] Documentation

------------------------------------------------------------------------

# 🗓️ First 30 Days

## Week 1 --- Foundation

``` text
Day 1
Repository + monorepo

Day 2
Next.js + NestJS

Day 3
Supabase project + local CLI

Day 4
Database schema + migrations

Day 5
RLS policies

Day 6
Authentication architecture

Day 7
Authentication implementation
```

## Week 2 --- Trip Management

``` text
Create trip
Trip details
Members
Invitations
Roles
Permissions
```

## Week 3 --- Itinerary

``` text
Trip days
Activities
Locations
Ordering
Mobile UI
Realtime updates
```

## Week 4 --- Expenses

``` text
Expense creation
Expense splitting
Settlement algorithm
Receipt upload
Tests
Swagger
Documentation
```

### 30-day goal

A real group of people should be able to:

``` text
Register
   ↓
Create a trip
   ↓
Invite friends
   ↓
Plan itinerary
   ↓
Add expenses
   ↓
Calculate settlements
   ↓
Use the mobile trip dashboard
```

------------------------------------------------------------------------

# 📌 Definition of Done

A feature is **not complete** just because the UI works.

``` text
UI
 ↓
API
 ↓
Validation
 ↓
Authorization
 ↓
Database
 ↓
RLS
 ↓
Error handling
 ↓
Logging
 ↓
Tests
 ↓
Documentation
 ↓
CI
```

A feature should pass the relevant parts of this pipeline before being
considered complete.

------------------------------------------------------------------------

# 🔀 Git Workflow

Branches:

``` text
main
develop
feature/*
fix/*
refactor/*
docs/*
chore/*
```

Example:

``` bash
git checkout -b feature/trip-expenses
```

Commit convention:

``` text
feat: add trip expense creation
fix: prevent duplicate invitations
refactor: extract settlement service
test: add settlement algorithm tests
docs: document trip permissions
chore: update dependencies
```

Keep commits focused and pull requests small.

------------------------------------------------------------------------

# 🤝 Open Source Strategy

TripSync should eventually be contributor-friendly.

Repository should include:

``` text
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
```

GitHub labels:

``` text
good first issue
help wanted
bug
feature
documentation
performance
security
frontend
backend
database
```

Potential contribution areas:

``` text
Frontend
Backend
Database
UI/UX
Testing
Documentation
DevOps
Accessibility
Performance
Security
```

------------------------------------------------------------------------

# 📚 Architecture Decision Records

Important technical decisions should be documented.

``` text
docs/decisions/
├── ADR-001-modular-monolith.md
├── ADR-002-supabase.md
├── ADR-003-postgresql.md
├── ADR-004-drizzle.md
├── ADR-005-redis.md
├── ADR-006-realtime.md
└── ADR-007-background-jobs.md
```

Each ADR should answer:

``` text
What problem are we solving?
What options were considered?
What did we choose?
Why?
What are the trade-offs?
```

------------------------------------------------------------------------

# 🚫 V1 Non-Goals

Do not build everything at once.

V1 will NOT include:

-   Flight booking
-   Hotel booking marketplace
-   Payment gateway
-   Travel insurance
-   Full social network
-   Microservices
-   Custom map infrastructure
-   Autonomous AI travel agent
-   Complex recommendation engine

### V1 focuses on:

> **Group trip planning and coordination.**

------------------------------------------------------------------------

# 🚀 Future Vision

Once TripSync has real users, it can evolve into:

## Community Travel

``` text
Travel Groups
      ↓
Public Trips
      ↓
Join Trips
      ↓
Verified Organizers
```

## Organizer Platform

``` text
Create trips
Manage travelers
Assign coordinators
Track payments
Manage volunteers
Analyze trips
```

## Smart Travel

``` text
Trip data
   ↓
AI assistant
   ↓
Recommendations
   ↓
Budget insights
   ↓
Personalized itinerary
```

## Mobile

Eventually:

``` text
apps/
├── web
├── api
├── worker
└── mobile
```

The mobile application can be introduced after the web/API platform is
stable.

------------------------------------------------------------------------

# 🏆 What This Project Demonstrates

TripSync is intentionally designed to demonstrate real engineering
skills.

### Frontend

``` text
✓ Next.js
✓ React
✓ TypeScript
✓ Responsive UI
✓ Server/client boundaries
✓ Data fetching
✓ Realtime UI
```

### Backend

``` text
✓ NestJS
✓ REST API
✓ WebSockets
✓ RBAC
✓ Business logic
✓ Validation
✓ Background jobs
```

### Database

``` text
✓ PostgreSQL
✓ Relational modeling
✓ Transactions
✓ Indexing
✓ RLS
✓ Migrations
```

### Infrastructure

``` text
✓ Supabase
✓ Redis
✓ BullMQ
✓ Docker
✓ CI/CD
```

### Engineering

``` text
✓ Testing
✓ Observability
✓ Security
✓ Documentation
✓ Git workflow
✓ Open-source practices
```

### Algorithms

``` text
✓ Expense splitting
✓ Settlement optimization
✓ Budget calculations
```

### Product Thinking

``` text
✓ Real-world problem
✓ Mobile-first UX
✓ Offline critical data
✓ Emergency workflows
✓ Real-time collaboration
```

------------------------------------------------------------------------

# 📊 MVP Success Criteria

TripSync MVP is successful when a real group of 4--10 people can:

-   [ ] Create a trip
-   [ ] Invite friends
-   [ ] Manage members
-   [ ] Plan the itinerary
-   [ ] Add activities
-   [ ] Add expenses
-   [ ] Split expenses
-   [ ] Calculate settlements
-   [ ] Assign responsibilities
-   [ ] Receive important updates
-   [ ] Use the application comfortably from mobile

------------------------------------------------------------------------

# 🧠 Engineering Philosophy

TripSync follows a few simple principles:

### 1. Solve the problem first

Technology exists to serve the product.

### 2. Modular monolith first

Don't introduce microservices before they are needed.

### 3. Database security matters

Use Supabase RLS as an additional security boundary.

### 4. Backend is the source of truth

Never trust frontend authorization.

### 5. Async work stays asynchronous

Emails, reminders and heavy jobs belong in workers.

### 6. Realtime should be intentional

Only synchronize events that actually need real-time behavior.

### 7. Mobile-first

People will use TripSync while travelling, often from a phone.

### 8. Offline where it matters

Critical trip information should not disappear when connectivity does.

### 9. AI is an assistant

AI suggests; users remain in control.

### 10. Build for real users

Use the product on real trips and improve it from real feedback.

------------------------------------------------------------------------

# 📄 License

TripSync is released under the **Apache License 2.0**.

See [LICENSE](LICENSE) for details.

------------------------------------------------------------------------

# ⭐ Contributing

Contributions are welcome.

Before contributing:

1.  Read `CONTRIBUTING.md`
2.  Check existing issues
3.  Discuss large features before implementation
4.  Create a focused branch
5.  Add tests where appropriate
6.  Update documentation
7.  Open a pull request

------------------------------------------------------------------------

# 🌍 TripSync

**Plan together. Travel smarter. Stay connected.**

``` text
        ┌──────────────────────────────┐
        │          TRIPSYNC             │
        │                               │
        │  PLAN → COORDINATE → TRAVEL  │
        │                               │
        └──────────────────────────────┘
```

🚧 Built in public. Designed for real trips.
