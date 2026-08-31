# 🗺️ TripSync — Routing Intelligence & Route Map

> **Complete Map of Client Pages, App Router Layouts, Dynamic Segments, Middleware & Access Rules**

---

## 1. App Router Route Hierarchy

```text
apps/web/src/app/
├── layout.tsx                     # Global Root Layout (ClerkProvider, AuthProvider, ApiAuthBridge, Navbar, Footer, Sentinel)
├── globals.css                    # Global Tailwind Styles & Design Tokens
├── icon.svg                       # PWA Icon
├── not-found.tsx                  # 404 Fallback Page
│
├── page.tsx                       # Landing Page / Public Marketing Showcase (/)
│
├── (auth)/                        # Authentication Routes
│   ├── login/page.tsx             # Login Redirect Shim (➔ /sign-in)
│   ├── register/page.tsx          # Register Redirect Shim (➔ /sign-up)
│   ├── verify-email/page.tsx      # Direct Supabase OTP Email Confirmation
│   ├── sign-in/[[...sign-in]]/    # Clerk Catch-All Sign-In Component (/sign-in)
│   └── sign-up/[[...sign-up]]/    # Clerk Catch-All Sign-Up Component (/sign-up)
│
├── dashboard/                     # User Dashboard
│   └── page.tsx                   # My Trips Workspace, Inspiration Templates, Packing & Split Tool
│
├── trips/[id]/                    # Trip Workspace Detail (Dynamic Route)
│   └── page.tsx                   # Multi-tab collaborative workspace (/trips/:id)
│
├── invite/[token]/                # Invitation Acceptance (Dynamic Route)
│   └── page.tsx                   # Preview & Join Trip by Token (/invite/:token)
│
└── (legal & support)/             # Static Informational & Trust Pages
    ├── privacy/page.tsx           # Privacy Policy & Zero Ad-Tracking Pledge (/privacy)
    ├── terms/page.tsx             # Terms of Service & Community Rules (/terms)
    ├── safety/page.tsx            # Traveler Safety Guide & Offline SOS (/safety)
    └── support/page.tsx           # Help Center & FAQ Hub (/support)
```

---

## 2. Exhaustive Routes Table

| Route Pattern | File Path | Route Type | Auth Required | Purpose & Key Features |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `apps/web/src/app/page.tsx` | Public Page | No | Landing page with animated rotating headlines, interactive live product preview, feature cards, and CTA links. |
| `/dashboard` | `apps/web/src/app/dashboard/page.tsx` | Protected Page | Yes (Clerk) | Main user cockpit: list trips, search/filter/sort, pagination, plan trip modal with OpenStreetMap geocoding + Wikimedia photos, packing checklist, inspiration templates. |
| `/trips/[id]` | `apps/web/src/app/trips/[id]/page.tsx` | Dynamic Workspace | Yes (Clerk / Bearer) | Core 8-tab trip workspace: Overview, Itinerary with Route Map, Expenses with Receipt Scanner, Min-Cash-Flow Settlements with UPI modal, Task checklist, Document Vault with PIN security, Offline Emergency SOS Hub, Analytics charts, and Member RBAC management. |
| `/invite/[token]` | `apps/web/src/app/invite/[token]/page.tsx` | Dynamic Invitation | Optional / Conditional | Preview trip details (inviter name, trip title, destination, role) and auto-accept membership if logged in, or redirect to sign-up/sign-in. Supports universal (`join_*`) and individual (`inv_*`) tokens. |
| `/sign-in/[[...sign-in]]` | `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk Auth Catch-All | No | Clerk hosted/embedded sign-in form supporting Email/Password, OAuth providers (Google, etc.), and OTP. |
| `/sign-up/[[...sign-up]]` | `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx` | Clerk Auth Catch-All | No | Clerk registration form with account creation and verification. |
| `/login` | `apps/web/src/app/login/page.tsx` | Auth Redirect Shim | No | Client-side redirection router to `/sign-in` for backwards compatibility. |
| `/register` | `apps/web/src/app/register/page.tsx` | Auth Redirect Shim | No | Client-side redirection router to `/sign-up` for backwards compatibility. |
| `/verify-email` | `apps/web/src/app/verify-email/page.tsx` | Direct OTP Verification | No | Direct verification interface for Supabase 6-8 digit email confirmation codes. |
| `/privacy` | `apps/web/src/app/privacy/page.tsx` | Public Legal Page | No | Privacy policy, GDPR rights, zero ad-tracking pledge, data encryption specifications. |
| `/terms` | `apps/web/src/app/terms/page.tsx` | Public Legal Page | No | Terms of service, acceptable use policies, disclaimer of warranties, governing law. |
| `/safety` | `apps/web/src/app/safety/page.tsx` | Public Safety Page | No | Mountain & group travel safety guidelines, offline emergency prep, SOS numbers. |
| `/support` | `apps/web/src/app/support/page.tsx` | Public Support Page | No | Help Center, searchable FAQs, troubleshooting guides, feedback and support contact. |
| `/not-found` | `apps/web/src/app/not-found.tsx` | System Fallback | No | 404 error page with quick links back to Dashboard or Landing. |

---

## 3. Trip Workspace Sub-Tab Architecture (`/trips/[id]`)

Inside `apps/web/src/app/trips/[id]/page.tsx`, the workspace dynamic interface is subdivided into tabbed views managed by local state (`activeTab`):

```text
/trips/[id]
├── Tab: overview    ➔ Trip Hero, Countdown, Weather Widget, Quick Stats, Recent Activity
├── Tab: itinerary   ➔ Day-by-Day Accordion, Activity Cards, ItineraryRouteMap GPS Embed
├── Tab: expenses    ➔ Category Summary, Expense Table, Receipt Zoom Modal, Add Expense Form
├── Tab: tasks       ➔ Kanban / Checklist, Priority Badges, Assignee Dropdowns, Due Dates
├── Tab: documents   ➔ DocumentVaultSection, Category Filtering, PIN-Lock, Base64 Upload
├── Tab: emergency   ➔ Primary SOS Call Buttons, Hospital / Police Directory, Offline Print Packet
├── Tab: analytics   ➔ Spending velocity, Budget burn-down, Recharts Pie & Bar Breakdowns
└── Tab: members     ➔ Member Directory, Role Badges, Universal Share Link, Bulk Invite Modal
```

---

## 4. Modal and Drawer Overlays

| Overlay Component | Trigger | Purpose |
| :--- | :--- | :--- |
| `UPISettlementModal` | "Settle Up" button on Debt card | Launches instant UPI app link (`gpay://`, `phonepe://`, `paytmmp://`) or generates dynamic QR code for instant debt repayment. |
| `ReceiptPreviewModal` | "View Receipt" icon on Expense row | Displays scanned receipt image with zoom-in, zoom-out, and 90° rotation toolbar. |
| `CrewChatDrawer` | Floating Message icon in Workspace | Slide-over chat drawer with real-time multi-tab sync, pinned announcements, and quick-reply chips. |
| `LiveActivityFeedDrawer` | Bell icon in Workspace | Slide-over audit feed showing real-time schedule edits, bill logs, and emergency updates. |
| `MountainOfflineSentinel` | Automatic on `window.offline` | Top floating status pill notifying travelers when entering zero-connectivity mountain zones. |
| `PWAInstallPrompt` | Automatic on `beforeinstallprompt` | Bottom prompt offering one-tap progressive web app installation to home screen. |
