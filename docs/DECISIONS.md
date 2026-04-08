# Architecture Decision Records

Each decision is documented as: context, options considered, decision made, and consequences.

---

## ADR-001: Async SQLAlchemy + asyncpg over synchronous ORM

**Context:** The dashboard makes multiple API calls on page load (patient list, stats for dashboard cards, chart data). A synchronous ORM would block the event loop during each DB query.

**Options considered:**
1. SQLAlchemy synchronous + psycopg2 — simpler setup, well-documented, but blocks per-request
2. SQLAlchemy 2.0 async + asyncpg — non-blocking, requires async session management
3. Tortoise ORM — async-native but smaller ecosystem, less mature

**Decision:** SQLAlchemy 2.0 async with asyncpg.

**Consequences:**
- (+) A single FastAPI worker handles concurrent requests while awaiting DB queries
- (+) SQLAlchemy 2.0 has first-class async support, not a bolted-on wrapper
- (+) asyncpg is the fastest PostgreSQL driver for Python
- (-) Slightly more boilerplate (async_sessionmaker, async generators for dependency injection)

---

## ADR-002: TanStack Query over Redux / Zustand for state management

**Context:** The app needs to fetch, cache, and update patient data from the backend. Classic approaches use Redux with thunks or sagas.

**Options considered:**
1. Redux Toolkit + RTK Query — full state management + data fetching
2. Zustand — lightweight global store
3. TanStack Query — purpose-built for server state

**Decision:** TanStack Query (React Query).

**Consequences:**
- (+) No boilerplate — no reducers, actions, or selectors for server data
- (+) Automatic caching with configurable stale time (30s)
- (+) Cache invalidation on mutations is declarative (`invalidateQueries`)
- (+) Built-in loading/error states, background refetch on window focus
- (+) `placeholderData` prevents layout shift during pagination
- (-) Not suitable if we needed complex client-side state (but we don't — this is a CRUD dashboard)

---

## ADR-003: Service layer over fat route handlers

**Context:** Initial implementation had database queries directly in route handlers. This made routes long and coupled HTTP concerns with business logic.

**Options considered:**
1. Fat routes — all logic in route handlers (fast to write, hard to test)
2. Repository pattern — abstract DB access behind interfaces
3. Service layer — business logic in service classes, routes are thin

**Decision:** Service layer (`PatientService`, `NoteService`).

**Consequences:**
- (+) Routes only handle HTTP: parse params, call service, return status code
- (+) Services are testable without HTTP — pass a DB session, call methods
- (+) Adding a new transport (WebSocket, CLI) means calling the service, not duplicating logic
- (+) Sort field whitelisting lives in the service, not scattered across routes
- (-) One more layer of indirection for a small app (acceptable trade-off for code quality)

---

## ADR-004: Tailwind CSS over component library (MUI, Chakra, Ant Design)

**Context:** Need a styling approach for the dashboard UI. Must support dark mode, responsive design, and quick iteration.

**Options considered:**
1. Material UI (MUI) — comprehensive, opinionated, heavy bundle
2. Chakra UI — good DX, moderate bundle size
3. Tailwind CSS — utility-first, zero runtime, full control
4. shadcn/ui — Tailwind-based, copy-paste components (not a dependency)

**Decision:** Tailwind CSS v4 with custom design tokens.

**Consequences:**
- (+) Zero runtime CSS — styles are compiled away at build time
- (+) Dark mode via CSS custom properties and `@custom-variant dark`
- (+) Full control over every pixel — no fighting framework defaults
- (+) Very small CSS bundle (19.8KB gzipped to 4.4KB)
- (-) More verbose HTML class names (acceptable — they're co-located with the markup they style)

---

## ADR-005: Template-based patient summary over LLM integration

**Context:** The spec requires a summary endpoint that synthesizes patient data and notes. It hints that an LLM can help but a template approach is acceptable.

**Options considered:**
1. LLM integration (Claude/OpenAI API) — natural language, flexible, impressive
2. Template-based generation — deterministic, no external dependency, no API key
3. Hybrid — template fallback when no API key configured

**Decision:** Template-based generation.

**Consequences:**
- (+) Zero external dependencies — works out of the box, no API key setup
- (+) Deterministic output — same input always produces same summary (important for medical context)
- (+) No latency from external API calls
- (+) No cost per request
- (-) Less natural prose than an LLM would produce
- **Future path:** Easy to swap in an LLM behind the same endpoint signature. The service method `generate_summary()` can be replaced without touching the router or frontend.

---

## ADR-006: Sort field whitelisting over unrestricted getattr

**Context:** The patient list endpoint accepts a `sort_by` query parameter. The initial implementation used `getattr(Patient, sort_by)` to dynamically resolve the column — a security risk.

**Options considered:**
1. `getattr(Patient, sort_by, fallback)` — works but allows probing model attributes
2. Explicit whitelist of allowed sort fields
3. Enum type for sort_by parameter

**Decision:** Explicit whitelist in the service layer.

```python
ALLOWED_SORT_FIELDS = {"first_name", "last_name", "date_of_birth", "email", "status", "last_visit", "created_at", "updated_at"}
if sort_by not in ALLOWED_SORT_FIELDS:
    sort_by = "last_name"
```

**Consequences:**
- (+) Prevents information disclosure — can't probe for internal model attributes
- (+) Fails safely — invalid input falls back to default sort
- (+) Easy to extend — add a field to the set when adding sortable columns
- (-) Requires updating the set when adding new sortable fields (minor maintenance cost)

---

## ADR-007: Multi-stage Docker build for frontend

**Context:** The frontend needs to be containerized for the docker-compose setup.

**Options considered:**
1. Serve via backend (mount static files in FastAPI) — simpler, but couples deployment
2. Node.js server in production — unnecessary runtime overhead for static files
3. Multi-stage build: Node → nginx — build with Node, serve with nginx

**Decision:** Multi-stage Docker build with nginx.

**Consequences:**
- (+) Production image has no Node.js runtime — just nginx + static files (~25MB vs ~200MB)
- (+) nginx handles reverse proxy to backend — single entry point on port 3000
- (+) SPA routing handled by `try_files $uri /index.html`
- (+) Frontend and backend can scale independently
- (-) Requires an nginx.conf file (minimal — 14 lines)

---

## ADR-008: Pydantic EmailStr over custom email regex

**Context:** Initial implementation used a custom `@field_validator` with a basic `"@" in v` check for email validation.

**Options considered:**
1. Custom regex — fragile, doesn't catch edge cases
2. Custom `@field_validator` with basic checks — slightly better but still incomplete
3. Pydantic `EmailStr` — uses `email-validator` library, RFC-compliant

**Decision:** Pydantic `EmailStr`.

**Consequences:**
- (+) RFC 5321/5322 compliant email validation
- (+) Catches malformed addresses that pass basic checks
- (+) Maintained by the `email-validator` library (not our regex to debug)
- (-) Adds `email-validator` as a dependency (2 packages — email-validator + dnspython)

---

## ADR-009: React Hook Form over controlled inputs

**Context:** Patient forms have 10+ fields. With controlled inputs, every keystroke triggers a re-render of the entire form.

**Options considered:**
1. Controlled inputs with useState — simple but re-renders on every keystroke
2. Formik — popular but larger bundle, uses controlled inputs internally
3. React Hook Form — uncontrolled inputs, only re-renders on validation/submission

**Decision:** React Hook Form with Zod resolver.

**Consequences:**
- (+) Uncontrolled inputs — DOM handles state, zero re-renders during typing
- (+) Zod schema validates the entire form on submit — one schema defines both types and rules
- (+) Server error mapping — `setError('email', { message: '...' })` shows server errors on the right field
- (+) Small bundle — ~8KB gzipped
- (-) Slightly less intuitive than controlled inputs for developers new to uncontrolled forms
