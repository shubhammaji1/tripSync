# 🌍 TripSync

> **Plan together. Travel smarter. Stay connected.**

TripSync is a modern, open-source collaborative travel platform designed to solve the messy reality of group-trip coordination.

Instead of switching between WhatsApp, Google Maps, spreadsheets, notes, payment screenshots, and email, TripSync provides a single shared workspace for the entire trip — from planning and expenses to real-time coordination and emergency information.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active_Development-green.svg)]()

---

## 🏗️ Architecture

TripSync is built as a high-performance **Modular Monolith**:

```text
                         ┌──────────────────────┐
                         │   apps/web (Next 16) │
                         │   React 19 + Tailwind│
                         └──────────┬───────────┘
                                    │
                              HTTPS / REST / WS
                                    │
                         ┌──────────▼───────────┐
                         │   apps/api (Nest 11) │
                         │   Fastify + Drizzle  │
                         ├──────────────────────┤
                         │ Auth / Users         │
                         │ Trips & RBAC         │
                         │ Itinerary            │
                         │ Expenses & Splits    │
                         │ Settlements Engine   │
                         │ Tasks & Emergency    │
                         │ Analytics & Realtime │
                         └───────┬───────┬──────┘
                                 │       │
                 ┌───────────────┘       └───────────────┐
                 ▼                                       ▼
        ┌──────────────────┐                    ┌────────────────┐
        │ Supabase Postgres│                    │     Redis      │
        │ Drizzle ORM + RLS│                    │ Cache, Pub/Sub │
        └──────────────────┘                    └───────┬────────┘
                                                        │
                                                        ▼
                                                 ┌──────────────┐
                                                 │ apps/worker  │
                                                 │    BullMQ    │
                                                 └──────────────┘
```

---

## 🧰 Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts, Lucide Icons
- **Backend**: NestJS 11, Fastify, TypeScript, Swagger/OpenAPI, Drizzle ORM, WebSockets
- **Database & Auth**: PostgreSQL (Supabase / Local Docker), Supabase Auth, Row Level Security (RLS)
- **Cache & Queues**: Redis, BullMQ Background Jobs
- **Monorepo**: Turborepo, pnpm workspaces

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose (for local database & Redis)

### 1. Clone & Install
```bash
git clone https://github.com/tripsync/tripsync.git
cd tripsync
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Start Local Infrastructure
```bash
docker compose up -d
```

### 4. Database Setup
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Servers
```bash
pnpm dev
```
- **Web App**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`
- **API Swagger Docs**: `http://localhost:4000/api/docs`
- **Mailpit (Email Testing)**: `http://localhost:8025`

### Email OTP verification

TripSync verifies a new account with an email OTP before starting its session. In
Supabase, open **Authentication → Sign In / Providers → Email** and enable
**Confirm email** (this turns `mailer_autoconfirm` off). Then update **Auth →
Email Templates → Confirm signup** to include `{{ .Token }}` (rather than only
`{{ .ConfirmationURL }}`).
The frontend accepts the six- or eight-digit token and sends it to the API for
verification. For production, configure custom SMTP and an appropriate email
rate limit in Supabase to avoid delivery quotas during registration.

---

## 🗂️ Monorepo Structure

```text
tripsync/
├── apps/
│   ├── web/           # Next.js 16 frontend
│   ├── api/           # NestJS 11 REST API & WebSocket Gateway
│   └── worker/        # BullMQ background job processor
├── packages/
│   ├── config/        # Shared tsconfig, tailwind presets
│   ├── types/         # Domain TypeScript models & Enums
│   └── validation/    # Shared Zod validation schemas
├── supabase/
│   └── migrations/    # Database migrations & RLS SQL policies
├── docs/
│   └── decisions/     # Architecture Decision Records (ADRs)
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 📄 License
Released under the [Apache License 2.0](LICENSE).
