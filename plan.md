# Healthcare Dashboard — Implementation Plan

## Overview

Patient management dashboard for a medical practice. Designed to be scalable for future multi-user workflows, real-time features, and growing data volumes.

---

## Architecture & Technology Choices

### Backend — FastAPI + PostgreSQL

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | FastAPI (async) | Native async support, auto-generated OpenAPI docs, Pydantic integration |
| ORM | SQLAlchemy 2.0 + asyncpg | Non-blocking DB access for concurrent request handling |
| Migrations | Alembic | Industry standard for PostgreSQL schema versioning; supports rollbacks |
| Validation | Pydantic v2 + EmailStr | Type-safe request/response schemas with proper email validation |
| Architecture | Service layer pattern | Business logic decoupled from HTTP handlers for testability and reuse |
| Security | Sort field whitelisting | Prevents arbitrary column access via user-supplied query params |

**Project structure:**
```
backend/
  app/
    main.py                # App entry, CORS, request logging middleware, health check
    database.py            # Async engine + session factory
    models.py              # Patient, Note entities (with last_visit field)
    schemas.py             # Pydantic schemas with validation
    routers/
      patients.py          # Patient CRUD (thin — delegates to service)
      notes.py             # Notes CRUD + summary endpoint
    services/
      patient_service.py   # Patient business logic, sort whitelisting
      note_service.py      # Notes logic, summary generation
    seed.py                # 20 realistic patients + 12 clinical notes
  alembic/                 # Versioned migrations
  tests/                   # 24 pytest API tests
  Dockerfile
```

### Frontend — React + TypeScript + Vite

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Build tool | Vite | Fast HMR, native TS/React support, optimized production builds |
| Styling | Tailwind CSS v4 | Utility-first, built-in dark mode, zero runtime cost |
| Server state | TanStack Query | Automatic caching, background refetching, pagination support |
| Routing | React Router v6 | Nested layouts, code splitting with React.lazy |
| Forms | React Hook Form + Zod | Performant (uncontrolled), schema-based client-side validation |
| Charts | Recharts | Declarative, composable, lightweight for the donut chart use case |
| Virtualization | @tanstack/react-virtual | Efficient rendering for large patient lists (50+ rows) |

**Project structure:**
```
frontend/
  src/
    components/
      layout/              # Header (nav + theme toggle), Sidebar (NavLink), Layout (Outlet)
      patients/            # PatientList, PatientForm, PatientNotes, PatientSummary, StatusBadge, StatusChart
    pages/                 # DashboardPage, PatientsPage, PatientDetailPage, PatientNewPage, PatientEditPage, NotFoundPage
    hooks/                 # usePatients, useNotes, useTheme (all thin wrappers around TanStack Query)
    lib/
      api.ts               # Axios client, all API functions
      types.ts             # TypeScript interfaces (Patient, Note, PatientSummary)
      utils.ts             # cn(), formatDate(), calculateAge()
  Dockerfile               # Multi-stage: Node build → nginx
  nginx.conf               # Reverse proxy /api/ → backend
```

### Database Schema

```
patients
  id              SERIAL PRIMARY KEY
  first_name      VARCHAR(100) NOT NULL
  last_name       VARCHAR(100) NOT NULL
  date_of_birth   DATE NOT NULL
  email           VARCHAR(255) NOT NULL UNIQUE
  phone           VARCHAR(20) NOT NULL
  address         VARCHAR(500)
  blood_type      VARCHAR(5)
  status          VARCHAR(10) DEFAULT 'active'   -- active | inactive | critical
  allergies       TEXT
  conditions      TEXT
  last_visit      TIMESTAMPTZ                    -- tracks most recent visit
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()

notes
  id              SERIAL PRIMARY KEY
  patient_id      INTEGER REFERENCES patients(id) ON DELETE CASCADE
  content         TEXT NOT NULL
  created_at      TIMESTAMPTZ DEFAULT now()

INDEX ix_notes_patient_id ON notes(patient_id)
```

---

## Implementation Plan

### Phase 1: Foundation (Part 1)
1. Initialize FastAPI backend with async SQLAlchemy, health check endpoint
2. Define Patient and Note models, set up Alembic migration
3. Create seed script with 20 realistic patients and clinical notes
4. Scaffold Vite + React + TypeScript frontend
5. Configure Tailwind CSS, ESLint, Prettier, path aliases

### Phase 2: Core Backend (Part 2)
6. Implement PatientService with CRUD operations
7. Build patient endpoints: GET (paginated, searchable, sortable, filterable), GET by ID, POST, PUT, DELETE
8. Add sort field whitelisting to prevent injection
9. Add request logging middleware
10. Validate with proper HTTP status codes: 201 (created), 204 (deleted), 404, 409 (duplicate email), 422 (validation)

### Phase 3: Notes & Summary (Part 3)
11. Implement NoteService with CRUD + summary generation
12. Build note endpoints: GET (paginated), POST (with optional timestamp), DELETE
13. Build summary endpoint with template-based narrative synthesis
14. Summary includes: patient identifiers, age, blood type, conditions, allergies, chronological note narrative

### Phase 4: Frontend (Parts 2, 3, 4)
15. Build responsive layout: Header with nav + dark/light toggle, collapsible Sidebar, main content area
16. Set up React Router with code-split pages (React.lazy)
17. Build PatientList: sortable table, debounced search (300ms), status filter dropdown, pagination controls
18. Add @tanstack/react-virtual for 50+ row virtualization, memo(PatientRow) to prevent re-renders
19. Build PatientDetailPage with tabbed view: Details, Notes, Summary
20. Build PatientForm with React Hook Form + Zod: client-side validation, server error mapping (field-level + root)
21. Build Dashboard with stat cards and Recharts donut chart for status distribution

### Phase 5: Containerization & Quality (Part 5 + Stretch)
22. Create backend Dockerfile (Python 3.11 slim)
23. Create frontend Dockerfile (multi-stage: Node build → nginx with reverse proxy)
24. Create docker-compose.yml with all 3 services (db, backend, frontend) and env var substitution
25. Write 24 pytest API tests covering all endpoints, validation, edge cases, cascading deletes
26. Set up GitHub Actions CI: backend tests, frontend lint + type check + build, Docker image builds
27. Create .env.example, .gitignore, .dockerignore, comprehensive README

---

## Stretch Goals Completed (all 5 categories)

| Category | Features |
|----------|----------|
| **Performance** | List virtualization (@tanstack/react-virtual), code splitting (React.lazy on all pages), memoized row components |
| **Advanced Backend** | Alembic migrations, request logging middleware, sort/filter query params with field whitelisting |
| **Advanced UI/UX** | Dark/light theme toggle (Tailwind), search + status filter, patient status donut chart (Recharts) |
| **Testing** | 24 pytest tests — CRUD, validation errors, 404s, duplicate emails, cascade deletes, health check |
| **Developer Experience** | GitHub Actions CI pipeline (3 jobs: backend tests, frontend checks, Docker builds) |

---

## Key Design Decisions

1. **Service layer over fat routes** — Business logic lives in `PatientService` and `NoteService`, not in route handlers. This makes the code testable without HTTP and reusable across endpoints.

2. **Server-side pagination + search** — All filtering, sorting, and pagination happens in PostgreSQL queries. The frontend never loads all patients into memory. This scales to thousands of records.

3. **Sort field whitelisting** — Rather than passing user input directly to `getattr()`, the service validates against an explicit allowlist. Prevents information disclosure via arbitrary column access.

4. **TanStack Query for server state** — No Redux or global state store needed. Query caching, background refetch, and cache invalidation on mutations are handled declaratively. `placeholderData` keeps the previous page visible while the next loads.

5. **Template-based summary** — The spec allows either LLM or template-based. Template approach has zero external dependencies, deterministic output, and no API key requirement. It generates a structured clinical narrative from patient data and notes.

6. **Multi-stage Docker build** — Frontend is built in a Node container and served via nginx. The nginx config handles both static file serving and API reverse proxying, so the frontend container has no Node runtime in production.

7. **Health check with DB verification** — The `/health` endpoint actually queries the database rather than just returning `{"status": "ok"}`. Reports `connected`/`disconnected` so orchestrators can detect real failures.
