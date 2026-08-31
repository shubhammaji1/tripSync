# 🗄️ TripSync — Database Intelligence & Schema Map

> **Complete Schema Map, Table Definitions, Relationships, Performance Indexes & RLS Policies**

---

## 1. Entity-Relationship Diagram (ERD)

```text
                           ┌──────────────────┐
                           │     profiles     │
                           └─────────┬────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │ 1:N (Owner)             │ 1:N (Member)            │ 1:N (Payer)
           ▼                         ▼                         ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      trips       │◄──────┤   trip_members   │       │     expenses     │
└─────────┬────────┘ 1:N   └──────────────────┘       └─────────┬────────┘
          │                                                     │
          ├─────────────────────────┬───────────────────────────┤
          │ 1:N                     │ 1:N                       │ 1:N (Participants)
          ▼                         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    trip_days     │       │   settlements    │       │expense_partic-   │
└─────────┬────────┘       └──────────────────┘       │ipants            │
          │ 1:N                                       └──────────────────┘
          ▼
┌──────────────────┐
│    activities    │
└──────────────────┘

Additional Trip Entities (Child of `trips`):
├── `trip_invitations`  (1:N with `trips`, N:1 with `profiles` as inviter)
├── `tasks`             (1:N with `trips`, N:1 with `profiles` as assignee)
├── `emergency_contacts`(1:N with `trips`)
├── `documents`         (1:N with `trips`, N:1 with `profiles` as uploader)
└── `notifications`     (N:1 with `profiles`, N:1 with `trips` [optional])
```

---

## 2. PostgreSQL Enumerated Types (Enums)

| Enum Name | Values |
| :--- | :--- |
| `trip_role` | `'OWNER'`, `'ADMIN'`, `'MEMBER'`, `'VIEWER'` |
| `trip_privacy` | `'PRIVATE'`, `'SHARED'`, `'PUBLIC'` |
| `trip_status` | `'PLANNING'`, `'ACTIVE'`, `'COMPLETED'`, `'ARCHIVED'` |
| `invitation_status`| `'PENDING'`, `'ACCEPTED'`, `'DECLINED'`, `'EXPIRED'` |
| `activity_status` | `'PLANNED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'` |
| `expense_category`| `'ACCOMMODATION'`, `'TRANSPORT'`, `'FOOD'`, `'ACTIVITIES'`, `'SHOPPING'`, `'ENTERTAINMENT'`, `'EMERGENCY'`, `'OTHER'` |
| `split_type` | `'EQUAL'`, `'EXACT'`, `'PERCENTAGE'`, `'SHARES'` |
| `settlement_status`| `'PENDING'`, `'SETTLED'` |
| `task_priority` | `'LOW'`, `'MEDIUM'`, `'HIGH'`, `'URGENT'` |
| `task_status` | `'TODO'`, `'IN_PROGRESS'`, `'DONE'` |
| `notification_type`| `'TRIP_INVITATION'`, `'ITINERARY_UPDATED'`, `'EXPENSE_ADDED'`, `'SETTLEMENT_REMINDER'`, `'TASK_ASSIGNED'`, `'EMERGENCY_TRIGGERED'`, `'SYSTEM'` |

---

## 3. Detailed Table Specifications

### 3.1 `profiles`
- **Purpose**: Mirrors verified Supabase / Clerk user identity records.
- **Columns**:
  - `id` (`uuid`, PK) — Identity provider subject ID (`auth.users.id` / Clerk normalized UUID)
  - `email` (`text`, NOT NULL, UNIQUE) — User email address
  - `full_name` (`text`, NULLABLE) — Full display name
  - `avatar_url` (`text`, NULLABLE) — Avatar image URL
  - `phone` (`text`, NULLABLE) — Emergency phone number
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
  - `updated_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)

---

### 3.2 `trips`
- **Purpose**: Core trip parent record containing settings, dates, budget, and ownership.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `name` (`text`, NOT NULL) — Trip title
  - `description` (`text`, NULLABLE) — Trip summary/notes
  - `destination` (`text`, NOT NULL) — Destination city/region
  - `start_date` (`text`, NOT NULL) — ISO `YYYY-MM-DD`
  - `end_date` (`text`, NOT NULL) — ISO `YYYY-MM-DD`
  - `budget` (`numeric(12, 2)`, NULLABLE) — Total allocated group budget
  - `currency` (`text`, DEFAULT `'INR'`, NOT NULL) — 3-letter ISO currency code
  - `cover_image` (`text`, NULLABLE) — Hero cover photo URL
  - `privacy` (`trip_privacy`, DEFAULT `'PRIVATE'`, NOT NULL)
  - `status` (`trip_status`, DEFAULT `'PLANNING'`, NOT NULL)
  - `owner_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
  - `updated_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `trips_owner_idx` on `(owner_id)`
  - `trips_status_idx` on `(status)`
  - `trips_owner_status_idx` on `(owner_id, status)`
  - `trips_start_date_idx` on `(start_date)`

---

### 3.3 `trip_members`
- **Purpose**: Associates users with trips and defines their role-based authorization level.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `user_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `role` (`trip_role`, DEFAULT `'MEMBER'`, NOT NULL)
  - `joined_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes & Constraints**:
  - `trip_user_idx` UNIQUE on `(trip_id, user_id)`
  - `trip_members_trip_idx` on `(trip_id)`
  - `trip_members_trip_role_idx` on `(trip_id, role)`
  - `trip_members_user_role_idx` on `(user_id, role)`

---

### 3.4 `trip_invitations`
- **Purpose**: Manages pending single-user email invitations and universal shareable trip links.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `invited_by` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `email` (`text`, NOT NULL) — Target email address or `'*'` for universal links
  - `token` (`text`, NOT NULL, UNIQUE) — Secure random token (`inv_*` or `join_*`)
  - `role` (`trip_role`, DEFAULT `'MEMBER'`, NOT NULL)
  - `status` (`invitation_status`, DEFAULT `'PENDING'`, NOT NULL)
  - `expires_at` (`timestamptz`, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `invitations_token_idx` on `(token)`
  - `invitations_trip_idx` on `(trip_id)`

---

### 3.5 `trip_days`
- **Purpose**: Daily itinerary container for scheduled activities.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `day_number` (`integer`, NOT NULL) — 1-indexed day sequence
  - `date` (`text`, NOT NULL) — ISO `YYYY-MM-DD`
  - `title` (`text`, NULLABLE) — Day theme/title
  - `notes` (`text`, NULLABLE)
- **Indexes & Constraints**:
  - `trip_day_number_idx` UNIQUE on `(trip_id, day_number)`

---

### 3.6 `activities`
- **Purpose**: Individual itinerary agenda items with GPS coordinates, costs, and assignees.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `day_id` (`uuid`, FK ➔ `trip_days.id` ON DELETE CASCADE, NOT NULL)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `title` (`text`, NOT NULL)
  - `description` (`text`, NULLABLE)
  - `start_time` (`text`, NULLABLE) — `HH:MM`
  - `end_time` (`text`, NULLABLE) — `HH:MM`
  - `location_name` (`text`, NULLABLE)
  - `location_lat` (`double precision`, NULLABLE)
  - `location_lng` (`double precision`, NULLABLE)
  - `estimated_cost` (`numeric(10, 2)`, NULLABLE)
  - `currency` (`text`, DEFAULT `'INR'`, NOT NULL)
  - `responsible_member_id` (`uuid`, FK ➔ `profiles.id` ON DELETE SET NULL, NULLABLE)
  - `status` (`activity_status`, DEFAULT `'PLANNED'`, NOT NULL)
  - `sort_order` (`integer`, DEFAULT `0`, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
  - `updated_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `activities_day_idx` on `(day_id)`
  - `activities_trip_idx` on `(trip_id)`
  - `activities_day_sort_idx` on `(day_id, sort_order)`
  - `activities_trip_status_idx` on `(trip_id, status)`

---

### 3.7 `expenses`
- **Purpose**: Financial expenditure entries paid by a group member.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `paid_by_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `title` (`text`, NOT NULL)
  - `amount` (`numeric(12, 2)`, NOT NULL)
  - `currency` (`text`, DEFAULT `'INR'`, NOT NULL)
  - `category` (`expense_category`, DEFAULT `'FOOD'`, NOT NULL)
  - `split_type` (`split_type`, DEFAULT `'EQUAL'`, NOT NULL)
  - `date` (`text`, NOT NULL) — ISO `YYYY-MM-DD`
  - `receipt_url` (`text`, NULLABLE) — Image / receipt URL
  - `notes` (`text`, NULLABLE)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
  - `updated_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `expenses_trip_idx` on `(trip_id)`
  - `expenses_paid_by_idx` on `(paid_by_id)`
  - `expenses_trip_date_idx` on `(trip_id, date)`
  - `expenses_paid_by_date_idx` on `(paid_by_id, date)`
  - `expenses_trip_category_idx` on `(trip_id, category)`

---

### 3.8 `expense_participants`
- **Purpose**: Detailed split allocations for every expense.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `expense_id` (`uuid`, FK ➔ `expenses.id` ON DELETE CASCADE, NOT NULL)
  - `user_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `share_amount` (`numeric(12, 2)`, NOT NULL)
  - `percentage` (`double precision`, NULLABLE)
  - `shares` (`integer`, NULLABLE)
- **Indexes & Constraints**:
  - `expense_participant_user_idx` UNIQUE on `(expense_id, user_id)`
  - `expense_participants_expense_idx` on `(expense_id)`

---

### 3.9 `settlements`
- **Purpose**: Debt settlement transfer records between two travelers.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `from_user_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `to_user_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `amount` (`numeric(12, 2)`, NOT NULL)
  - `currency` (`text`, DEFAULT `'INR'`, NOT NULL)
  - `status` (`settlement_status`, DEFAULT `'PENDING'`, NOT NULL)
  - `settled_at` (`timestamptz`, NULLABLE)
  - `notes` (`text`, NULLABLE)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `settlements_trip_idx` on `(trip_id)`
  - `settlements_from_user_idx` on `(from_user_id)`
  - `settlements_to_user_idx` on `(to_user_id)`
  - `settlements_trip_status_idx` on `(trip_id, status)`
  - `settlements_from_to_idx` on `(from_user_id, to_user_id)`

---

### 3.10 `tasks`
- **Purpose**: Action items and pre-trip preparation checklist.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `title` (`text`, NOT NULL)
  - `description` (`text`, NULLABLE)
  - `assigned_to_id` (`uuid`, FK ➔ `profiles.id` ON DELETE SET NULL, NULLABLE)
  - `due_date` (`text`, NULLABLE) — ISO `YYYY-MM-DD`
  - `priority` (`task_priority`, DEFAULT `'MEDIUM'`, NOT NULL)
  - `status` (`task_status`, DEFAULT `'TODO'`, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
  - `updated_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `tasks_trip_idx` on `(trip_id)`
  - `tasks_assigned_idx` on `(assigned_to_id)`
  - `tasks_trip_status_idx` on `(trip_id, status)`
  - `tasks_assigned_due_idx` on `(assigned_to_id, due_date)`

---

### 3.11 `emergency_contacts`
- **Purpose**: Critical emergency facilities and local rescue contacts for the trip.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `name` (`text`, NOT NULL)
  - `relationship` (`text`, NOT NULL)
  - `phone` (`text`, NOT NULL)
  - `alt_phone` (`text`, NULLABLE)
  - `notes` (`text`, NULLABLE)
  - `is_primary` (`boolean`, DEFAULT `false`, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `emergency_contacts_trip_idx` on `(trip_id)`

---

### 3.12 `documents`
- **Purpose**: Trip attachments, PDF tickets, permits, and booking vouchers.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NOT NULL)
  - `user_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `title` (`text`, NOT NULL)
  - `file_url` (`text`, NOT NULL)
  - `file_type` (`text`, NOT NULL)
  - `file_size` (`integer`, NOT NULL)
  - `category` (`text`, DEFAULT `'GENERAL'`, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `documents_trip_idx` on `(trip_id)`
  - `documents_trip_cat_idx` on `(trip_id, category)`
  - `documents_user_idx` on `(user_id)`

---

### 3.13 `notifications`
- **Purpose**: System and trip notification messages for travelers.
- **Columns**:
  - `id` (`uuid`, PK, DEFAULT `gen_random_uuid()`)
  - `user_id` (`uuid`, FK ➔ `profiles.id` ON DELETE CASCADE, NOT NULL)
  - `trip_id` (`uuid`, FK ➔ `trips.id` ON DELETE CASCADE, NULLABLE)
  - `type` (`notification_type`, DEFAULT `'SYSTEM'`, NOT NULL)
  - `title` (`text`, NOT NULL)
  - `message` (`text`, NOT NULL)
  - `data` (`text`, NULLABLE)
  - `is_read` (`boolean`, DEFAULT `false`, NOT NULL)
  - `created_at` (`timestamptz`, DEFAULT `now()`, NOT NULL)
- **Indexes**:
  - `notifications_user_idx` on `(user_id)`
  - `notifications_user_read_created_idx` on `(user_id, is_read, created_at)`
