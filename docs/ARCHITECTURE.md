# Architecture

## System Overview

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   Browser    │──────▶│   Frontend   │──────▶│   Backend    │──────▶ PostgreSQL
│             │◀──────│  (nginx)     │◀──────│  (FastAPI)   │◀──────
│             │  :3000│  Static +    │  :8000│  Async       │  :5432
│             │       │  Reverse     │       │  REST API    │
│             │       │  Proxy       │       │              │
└─────────────┘       └──────────────┘       └──────────────┘
```

### Request Flow

1. Browser requests hit nginx on port 3000
2. Static assets (JS, CSS, HTML) are served directly from the built React app
3. API requests (`/api/*`) are reverse-proxied to the FastAPI backend on port 8000
4. FastAPI processes the request through middleware (logging) → router → service → database
5. Responses flow back through the same chain with proper HTTP status codes

### In Development

The Vite dev server replaces nginx, providing HMR and proxying `/api/*` to the backend. No nginx is needed locally.

---

## Backend Architecture

### Layered Design

```
HTTP Request
    │
    ▼
┌─────────────────┐
│  Middleware      │  Request logging, CORS
├─────────────────┤
│  Router Layer   │  HTTP concerns: parse params, return status codes, raise HTTPException
│  (routers/)     │  Thin — no business logic
├─────────────────┤
│  Service Layer  │  Business logic: validation rules, query composition, summary generation
│  (services/)    │  Testable without HTTP, reusable across endpoints
├─────────────────┤
│  Data Layer     │  SQLAlchemy models + async session
│  (models.py)    │  Single source of truth for schema
└─────────────────┘
    │
    ▼
  PostgreSQL
```

**Why this layering matters:**
- Routers only handle HTTP — they don't know how to query the database
- Services contain the actual logic — sort field whitelisting, email uniqueness checks, summary generation
- Testing the service doesn't require HTTP — pass it a session and call methods directly
- Adding a new transport (e.g., WebSocket, CLI) only requires calling the service, not duplicating logic

### Async Throughout

Every layer is async. The database driver (asyncpg) doesn't block the event loop, so a single FastAPI worker can handle many concurrent requests while waiting for DB queries. This is critical for a dashboard that makes multiple parallel API calls on page load.

### Error Handling Strategy

| Layer | Responsibility |
|-------|---------------|
| Pydantic schemas | Structural validation (types, required fields, email format, string lengths) → 422 |
| Service layer | Business rule validation (duplicate email check, sort field whitelisting) |
| Router layer | Maps service results to HTTP status codes (404, 409) |
| Global middleware | Logs all requests with timing for observability |

Errors are specific and actionable:
- `422` — Pydantic returns field-level errors with path, message, and input value
- `404` — "Patient not found" or "Note not found"
- `409` — "A patient with this email already exists"

---

## Frontend Architecture

### State Management

**No global state store.** The app uses TanStack Query for all server state:

```
Component
    │
    ▼
Custom Hook (usePatients, useNotes)
    │
    ▼
TanStack Query
    │  - Caches responses by query key
    │  - Background refetch on window focus
    │  - Automatic cache invalidation on mutations
    │  - placeholderData keeps previous page visible during navigation
    │
    ▼
API Client (axios)
    │
    ▼
Backend
```

**Why no Redux/Zustand:** This is a CRUD dashboard. All state comes from the server. TanStack Query handles caching, loading states, error states, and cache invalidation declaratively. Adding a client-side store would just duplicate server state.

The only client-side state is UI state (search input, current page, sort order, dark mode preference), managed with React `useState` in the components that own it.

### Component Architecture

```
App
├── QueryClientProvider        (TanStack Query context)
└── BrowserRouter
    └── Layout                 (Header + Sidebar + Outlet)
        ├── DashboardPage      (stat cards + StatusChart)
        ├── PatientsPage       (PatientList)
        ├── PatientDetailPage  (tabs: Details | Notes | Summary)
        ├── PatientNewPage     (PatientForm)
        ├── PatientEditPage    (PatientForm with prefilled data)
        └── NotFoundPage
```

**Code splitting:** Every page is wrapped in `React.lazy()` and loaded on demand. The initial bundle only contains the layout shell and shared dependencies.

### Form Architecture

Patient forms use React Hook Form (uncontrolled inputs — no re-render on every keystroke) with Zod schema validation:

```
User types → DOM (uncontrolled) → Submit → Zod validates → API call
                                              │
                                              ▼ (if invalid)
                                         Field-level errors shown

API responds with error → Map server errors to form fields → Display
```

Server errors (409 duplicate email, 422 validation) are mapped back to the correct form fields so the user sees contextual error messages, not generic alerts.

---

## Database Design

### Schema

```sql
patients (20 seeded records)
├── id              SERIAL PK
├── first_name      VARCHAR(100) NOT NULL
├── last_name       VARCHAR(100) NOT NULL
├── date_of_birth   DATE NOT NULL
├── email           VARCHAR(255) NOT NULL UNIQUE    ← enforced at DB level
├── phone           VARCHAR(20) NOT NULL
├── address         VARCHAR(500)
├── blood_type      VARCHAR(5)
├── status          VARCHAR(10) DEFAULT 'active'    ← active | inactive | critical
├── allergies       TEXT
├── conditions      TEXT
├── last_visit      TIMESTAMPTZ                     ← nullable, tracks most recent visit
├── created_at      TIMESTAMPTZ DEFAULT now()
└── updated_at      TIMESTAMPTZ DEFAULT now()

notes (12 seeded records)
├── id              SERIAL PK
├── patient_id      INTEGER FK → patients(id) ON DELETE CASCADE
├── content         TEXT NOT NULL
└── created_at      TIMESTAMPTZ DEFAULT now()

INDEX ix_notes_patient_id ON notes(patient_id)
```

### Key Constraints

- **Email uniqueness** is enforced at both application level (409 response) and database level (UNIQUE constraint). The app checks first for a friendly error message; the constraint is a safety net for race conditions.
- **Cascade delete** — deleting a patient automatically deletes all their notes. No orphaned data.
- **Index on patient_id** — notes are always queried by patient, so this index prevents full table scans.

### Migration Strategy

Alembic manages schema versions. The initial migration (`001_initial_schema.py`) creates both tables. The app also calls `Base.metadata.create_all` on startup as a convenience for development — in production, you'd rely solely on Alembic.

---

## Performance Considerations

### Backend
- **Async I/O** — asyncpg driver never blocks the event loop; one worker handles many concurrent connections
- **Server-side pagination** — `LIMIT/OFFSET` in SQL; frontend never loads all patients
- **Server-side search** — `ILIKE` queries in PostgreSQL; no client-side filtering of full dataset
- **Indexed foreign key** — notes lookup by patient_id is O(log n), not O(n)

### Frontend
- **Code splitting** — each page is a separate chunk loaded on demand (~50-90KB each vs one 500KB+ bundle)
- **Virtualization** — for lists over 50 rows, only visible rows are rendered in the DOM using @tanstack/react-virtual
- **Memoized rows** — `memo(PatientRow)` prevents re-render of unchanged rows when the list updates
- **Debounced search** — 300ms debounce prevents firing an API call on every keystroke
- **placeholderData** — TanStack Query shows the previous page while the next loads, avoiding layout shift

### Scalability Path

The current architecture supports growth to:
- **1000s of patients** — server-side pagination + virtualization already in place
- **Multiple user types** — add a users table + JWT auth middleware; service layer is already decoupled
- **Real-time updates** — FastAPI supports WebSocket; TanStack Query can integrate with a subscription layer
- **Horizontal scaling** — stateless backend behind a load balancer; database handles concurrency
