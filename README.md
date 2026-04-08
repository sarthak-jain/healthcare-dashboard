# Healthcare Dashboard

A full-stack patient management dashboard built with React (TypeScript) and FastAPI.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Alembic, Pydantic v2
**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router v6, React Hook Form + Zod, Recharts
**Tooling:** ESLint, Prettier, pytest, GitHub Actions CI

## Architecture

```
healthcare-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, logging middleware
│   │   ├── database.py          # Async SQLAlchemy engine
│   │   ├── models.py            # Patient, Note ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/             # HTTP endpoint handlers
│   │   │   ├── patients.py      # Patient CRUD
│   │   │   └── notes.py         # Notes + summary endpoints
│   │   ├── services/            # Business logic layer
│   │   │   ├── patient_service.py
│   │   │   └── note_service.py
│   │   └── seed.py              # 20 realistic patients + clinical notes
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest API tests (24 tests)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, patient components, charts
│   │   ├── pages/               # Route pages (code-split with React.lazy)
│   │   ├── hooks/               # TanStack Query hooks
│   │   └── lib/                 # API client, types, utilities
│   ├── Dockerfile               # Multi-stage: Node build → nginx
│   └── nginx.conf               # Reverse proxy to backend
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

## Quick Start with Docker

```bash
cp .env.example .env
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Quick Start (without Docker)

```bash
# Install everything (backend, frontend, databases)
./scripts/setup.sh

# Start both servers (Ctrl+C to stop)
./scripts/dev.sh

# Run all tests + lint + type check
./scripts/test.sh
```

## Local Development (manual)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Create database
createdb healthcare

# Start server (adjust DATABASE_URL for your setup)
DATABASE_URL="postgresql+asyncpg://youruser@localhost:5432/healthcare" \
  uvicorn app.main:app --reload --port 8000
```

The database schema is created automatically on first startup. Alembic is available for migration management:

```bash
alembic upgrade head
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on port 3000 and proxies `/api/*` to the backend at port 8000.

### Running Tests

```bash
cd backend
createdb healthcare_test
pip install -r requirements-dev.txt
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with DB connectivity |
| GET | `/patients` | List patients (paginated, searchable, sortable) |
| GET | `/patients/{id}` | Get single patient |
| POST | `/patients` | Create patient |
| PUT | `/patients/{id}` | Update patient |
| DELETE | `/patients/{id}` | Delete patient (cascades notes) |
| GET | `/patients/{id}/notes` | List patient notes |
| POST | `/patients/{id}/notes` | Add clinical note |
| DELETE | `/patients/{id}/notes/{note_id}` | Delete note |
| GET | `/patients/{id}/summary` | Generated patient summary |

Query parameters for `GET /patients`: `page`, `page_size`, `search`, `sort_by`, `sort_order`, `status`

## Key Design Decisions

- **Async SQLAlchemy + asyncpg:** Non-blocking database access for handling concurrent requests efficiently.
- **Service layer:** Business logic separated from HTTP handlers for testability and reuse.
- **TanStack Query:** Server state management with automatic caching, background refetching, and optimistic updates.
- **Sort field whitelisting:** Prevents arbitrary column access via query parameters.
- **Code splitting:** Every page is lazy-loaded, reducing initial bundle size.
- **Virtualization:** Large patient lists (50+ rows) use `@tanstack/react-virtual` for efficient rendering.
- **Template-based summary:** The patient summary endpoint generates a structured clinical narrative from patient data and notes without requiring an external LLM API.

## Documentation

- **[plan.md](plan.md)** — Implementation plan with phased approach and technology rationale
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design, data flow diagrams, layered architecture, performance considerations
- **[docs/DECISIONS.md](docs/DECISIONS.md)** — 9 Architecture Decision Records (ADRs) with context, options considered, and trade-offs
- **[docs/API.md](docs/API.md)** — Complete API reference with request/response examples and error formats

## Stretch Goals Completed

- **Performance:** Virtualization, code splitting (React.lazy), memoized components
- **Advanced Backend:** Alembic migrations, request logging middleware, sort/filter query params
- **Advanced UI/UX:** Dark/light theme, search with status filter, patient status pie chart
- **Testing:** 24 API endpoint tests covering CRUD, validation, edge cases
- **Developer Experience:** GitHub Actions CI pipeline (backend tests, frontend lint+build, Docker build)
