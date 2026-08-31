# 📡 TripSync — REST API & WebSocket Map

> **Complete Specification of Endpoints, Inputs, Outputs, Auth Guards, Database Tables & Consumers**

---

## 1. Global Configuration

- **Base URL Prefix**: `/api/v1`
- **Swagger Documentation**: `/api/docs`
- **Authentication**: HTTP Header `Authorization: Bearer <JWT>`
- **Global Validation**: `ZodValidationPipe` via `NestJS ValidationPipe` with implicit type coercion and strict field stripping.
- **Rate Limit**: 120 requests / minute per IP.
- **Compression**: Enabled (`gzip`, `deflate`, `br`).

---

## 2. API Endpoint Inventory

### 2.1 System & Health

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | N/A | None | Returns API metadata, status, version, and Swagger links. |
| `GET` | `/health` | None | N/A | PostgreSQL (`SELECT 1`) | Liveness and database probe. Used by GitHub Actions keep-alive workflow & container orchestrator. |

---

### 2.2 Auth & Profiles (`/auth`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | None | `loginSchema` | `profiles` | Authenticates against Supabase Auth, returns verified JWT + Profile. Used by `api.login`. |
| `POST` | `/auth/register` | None | `registerSchema` | `profiles` | Registers user in Supabase Auth and triggers email OTP verification. Used by `api.register`. |
| `POST` | `/auth/verify-email-otp` | None | `verifyEmailOtpSchema` | `profiles` | Confirms 6-8 digit email OTP token and returns authenticated session. Used by `verify-email/page.tsx`. |
| `GET` | `/auth/invitations/:token` | None | `token: string` | `trip_invitations`, `trips`, `profiles` | Retrieves invitation metadata (trip name, inviter, role, expiration) for UI preview. Used by `invite/[token]/page.tsx`. |
| `POST` | `/auth/accept-invitation` | `AuthGuard` | `acceptInvitationSchema` | `trip_invitations`, `trip_members` | Joins current authenticated user to the trip and marks individual invitations accepted. Used by `invite/[token]/page.tsx`. |
| `GET` | `/auth/me` | `AuthGuard` | N/A | `profiles` | Returns the currently authenticated user profile from verified session claims. Used by `api.getMe`. |
| `POST` | `/auth/logout` | None | N/A | None | Sign-out stub for client session invalidation. Used by `api.logout`. |

---

### 2.3 Trips (`/trips`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips` | `AuthGuard` | N/A | `trips`, `trip_members`, `expenses` | Returns all trips the user owns or belongs to, with calculated expense totals and member counts. Used by `dashboard/page.tsx`. |
| `GET` | `/trips/:tripId` | `AuthGuard` | N/A | `trips`, `trip_members`, `trip_days`, `activities`, `expenses`, `tasks`, `emergency_contacts` | Fetches complete relational aggregate tree for a single trip. Used by `trips/[id]/page.tsx`. |
| `POST` | `/trips` | `AuthGuard` | `createTripSchema` | `trips`, `trip_members` | Creates a new trip and automatically inserts creator as `OWNER` in `trip_members`. Used by `dashboard/page.tsx` Plan Trip Modal. |
| `PATCH` | `/trips/:tripId` | `AuthGuard` | `updateTripSchema` | `trips` | Updates trip title, destination, dates, budget, or status. Used by `trips/[id]/page.tsx` Edit Trip Modal. |
| `DELETE` | `/trips/:tripId` | `AuthGuard` | N/A | `trips` (Cascades to all children) | Deletes a trip and all associated child entities. Used by `dashboard/page.tsx`. |

---

### 2.4 Trip Members & Invitations (`/trips/:tripId/members`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/members` | `AuthGuard` | N/A | `trip_members`, `trips`, `profiles` | Returns full member roster with populated profile metadata and assigned roles. Used by `trips/[id]/page.tsx` Members tab. |
| `GET` | `/trips/:tripId/members/share-link` | `AuthGuard` | N/A | `trip_invitations` | Retrieves existing active universal join link or generates a 30-day shareable link (`join_*`). Used by Share button. |
| `POST` | `/trips/:tripId/members/share-link` | `AuthGuard` | `createShareLinkSchema` | `trip_invitations` | Generates or refreshes a universal join link with a specific default role. Used by Members tab. |
| `POST` | `/trips/:tripId/members/bulk-invite` | `AuthGuard` | `bulkInviteMemberSchema` | `trip_invitations`, `trips`, `profiles` | Dispatches invitation emails and generates individual tokens for multiple emails simultaneously. Used by Bulk Invite modal. |
| `POST` | `/trips/:tripId/members/invite` | `AuthGuard` | `inviteMemberSchema` | `trip_invitations`, `trips`, `profiles` | Invites a single email via SMTP/Resend with a 7-day token (`inv_*`). Used by Member Invite form. |
| `PATCH` | `/trips/:tripId/members/:userId/role` | `AuthGuard` (Owner/Admin) | `updateMemberRoleSchema` | `trip_members` | Modifies a member's role (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`). Used by Members tab. |
| `PATCH` | `/trips/:tripId/members/:userId/phone` | `AuthGuard` | `{ phone?: string }` | `profiles` | Updates or sets emergency phone number on a member's profile. Used by Traveler Phone modal. |
| `DELETE` | `/trips/:tripId/members/:userId` | `AuthGuard` (Owner/Admin) | N/A | `trip_members` | Removes a traveler from the trip. Used by Members tab. |

---

### 2.5 Itinerary & Activities (`/trips/:tripId/itinerary`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/itinerary` | `AuthGuard` | N/A | `trip_days`, `activities`, `profiles` | Fetches ordered day list and activities with responsible traveler details. Used by Itinerary tab. |
| `POST` | `/trips/:tripId/itinerary/days` | `AuthGuard` | `createTripDaySchema` | `trip_days` | Adds a new day segment with date, title, and notes. Used by Itinerary Add Day button. |
| `DELETE` | `/trips/:tripId/itinerary/days/:dayId` | `AuthGuard` | N/A | `trip_days`, `activities` | Deletes a day and cascades deletion to all child activities. Used by Itinerary tab. |
| `POST` | `/trips/:tripId/itinerary/activities` | `AuthGuard` | `createActivitySchema` | `activities` | Creates a scheduled activity with time, location, GPS coordinates, cost, and lead person. Used by Add Activity form. |
| `PATCH` | `/trips/:tripId/itinerary/activities/:activityId` | `AuthGuard` | `updateActivitySchema` | `activities` | Updates activity details, status (`PLANNED`, `IN_PROGRESS`, `COMPLETED`), or sort order. Used by Itinerary tab. |
| `DELETE` | `/trips/:tripId/itinerary/activities/:activityId` | `AuthGuard` | N/A | `activities` | Deletes a single activity. Used by Itinerary tab. |

---

### 2.6 Expenses & Splits (`/trips/:tripId/expenses`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/expenses` | `AuthGuard` | N/A | `expenses`, `expense_participants`, `profiles` | Lists all expenses with payer profile and detailed participant share amounts. Used by Expenses tab. |
| `POST` | `/trips/:tripId/expenses` | `AuthGuard` | `createExpenseSchema` | `expenses`, `expense_participants` | Logs a group expense and records participant splits (`EQUAL`, `EXACT`, `PERCENTAGE`, `SHARES`). Used by Add Expense form. |
| `PATCH` | `/trips/:tripId/expenses/:expenseId` | `AuthGuard` | `updateExpenseSchema` | `expenses`, `expense_participants` | Updates expense amount, category, date, or split participants. Used by Edit Expense modal. |
| `DELETE` | `/trips/:tripId/expenses/:expenseId` | `AuthGuard` | N/A | `expenses`, `expense_participants` | Deletes an expense and cascades deletion to split entries. Used by Expenses tab. |

---

### 2.7 Settlements & Debt Optimization (`/trips/:tripId/settlements`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/settlements` | `AuthGuard` | N/A | `settlements`, `expenses`, `expense_participants`, `trip_members`, `profiles` | Runs Min-Cash-Flow algorithm: returns individual balance summaries, optimized transfer pairs, and recorded settlements. Used by Settlements section. |
| `POST` | `/trips/:tripId/settlements` | `AuthGuard` | `createSettlementSchema` | `settlements` | Records a completed debt settlement between two members. Used by `UPISettlementModal.tsx`. |

---

### 2.8 Tasks & Checklist (`/trips/:tripId/tasks`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/tasks` | `AuthGuard` | N/A | `tasks`, `profiles` | Returns all trip tasks with assignee profile, due dates, priority, and status. Used by Tasks tab. |
| `POST` | `/trips/:tripId/tasks` | `AuthGuard` | `createTaskSchema` | `tasks` | Creates a new task assigned to a traveler. Used by Add Task form. |
| `PATCH` | `/trips/:tripId/tasks/:taskId` | `AuthGuard` | `updateTaskSchema` | `tasks` | Updates task title, assignee, status (`TODO`, `IN_PROGRESS`, `DONE`), or priority. Used by Tasks tab. |
| `DELETE` | `/trips/:tripId/tasks/:taskId` | `AuthGuard` | N/A | `tasks` | Deletes a task. Used by Tasks tab. |

---

### 2.9 Emergency SOS & Offline Hub (`/trips/:tripId/emergency`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/emergency/contacts` | `AuthGuard` | N/A | `emergency_contacts` | Returns hospital, police, hotel, and rescue contacts. Used by Emergency tab. |
| `GET` | `/trips/:tripId/emergency/packet` | `AuthGuard` | N/A | `trips`, `emergency_contacts`, `trip_members`, `profiles` | Generates a lightweight, self-contained offline emergency data packet. Used by Offline Sentinel and Print View. |
| `POST` | `/trips/:tripId/emergency/contacts` | `AuthGuard` (Owner/Admin) | `createEmergencyContactSchema` | `emergency_contacts` | Adds a critical emergency contact. Used by Add Emergency Contact modal. |
| `PATCH` | `/trips/:tripId/emergency/contacts/:contactId` | `AuthGuard` (Owner/Admin) | `updateEmergencyContactSchema` | `emergency_contacts` | Modifies contact details or sets as primary SOS number. Used by Edit Emergency Contact modal. |
| `DELETE` | `/trips/:tripId/emergency/contacts/:contactId` | `AuthGuard` (Owner/Admin) | N/A | `emergency_contacts` | Deletes an emergency contact. Used by Emergency tab. |
| `POST` | `/trips/:tripId/emergency/seed-starter` | `AuthGuard` (Owner/Admin) | N/A | `emergency_contacts` | Seeds local emergency numbers (District Hospital, Tourist Police, Insurance). Used by Starter Setup button. |

---

### 2.10 Spending Analytics (`/trips/:tripId/analytics`)

| Method | Route | Auth Required | Validation Schema | Affected Tables | Purpose & Used By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/trips/:tripId/analytics` | `AuthGuard` | N/A | `expenses`, `trip_members`, `profiles`, `trips` | Aggregates category spending breakdown, budget velocity, daily expenditure timeline, and per-member balances. Used by Analytics tab charts. |

---

## 3. WebSocket Realtime Events (`/realtime` Namespace)

| Event Direction | Event Name | Payload Shape | Description |
| :--- | :--- | :--- | :--- |
| Client ➔ Server | `joinTrip` | `{ tripId: string, userId: string, userName: string }` | Client joins trip socket room (`trip:<tripId>`) |
| Client ➔ Server | `leaveTrip` | `{ tripId: string, userId: string }` | Client leaves trip room |
| Server ➔ Client | `memberJoinedRoom` | `{ userId: string, userName: string, timestamp: string }` | Broadcast to room members when a new traveler connects |
| Server ➔ Client | `*` (Dynamic Event) | `{ ...eventData, timestamp: string }` | Dispatched by `RealtimeGateway.broadcastTripEvent()` on domain mutations |
