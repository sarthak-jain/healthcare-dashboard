"""Healthcare Dashboard API — FastAPI application entry point."""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, async_session, engine
from app.routers.notes import router as notes_router
from app.routers.notes import summary_router
from app.routers.patients import router as patients_router
from app.seed import seed_database

logger = logging.getLogger("healthcare")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (Alembic is preferred for production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as session:
        await seed_database(session)
    yield
    await engine.dispose()


app = FastAPI(
    title="Healthcare Dashboard API",
    description="Patient management API for a medical practice dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %d %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        elapsed,
    )
    return response


@app.get("/health", summary="Health check", tags=["system"])
async def health_check():
    """Returns service health status including database connectivity."""
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return {"status": "degraded", "database": "disconnected"}


app.include_router(patients_router)
app.include_router(notes_router)
app.include_router(summary_router)
