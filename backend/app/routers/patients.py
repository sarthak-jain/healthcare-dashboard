"""Patient CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import PatientCreate, PatientListResponse, PatientResponse, PatientUpdate
from app.services.patient_service import PatientService

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get(
    "",
    response_model=PatientListResponse,
    summary="List patients",
    description="Returns a paginated list of patients with optional search, sort, and status filter.",
)
async def list_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str = Query("", max_length=200, description="Search by name or email"),
    sort_by: str = Query("last_name", description="Sort field"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction"),
    status: str | None = Query(None, description="Filter by status: active, inactive, critical"),
    db: AsyncSession = Depends(get_db),
):
    service = PatientService(db)
    return await service.list_patients(
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        status=status,
    )


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Get patient",
    description="Returns a single patient by ID.",
)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    service = PatientService(db)
    patient = await service.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post(
    "",
    response_model=PatientResponse,
    status_code=201,
    summary="Create patient",
    description="Creates a new patient record. Email must be unique.",
)
async def create_patient(data: PatientCreate, db: AsyncSession = Depends(get_db)):
    service = PatientService(db)
    if await service.get_patient_by_email(data.email):
        raise HTTPException(status_code=409, detail="A patient with this email already exists")
    return await service.create_patient(data)


@router.put(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Update patient",
    description="Updates an existing patient. Email must remain unique.",
)
async def update_patient(
    patient_id: int, data: PatientUpdate, db: AsyncSession = Depends(get_db)
):
    service = PatientService(db)
    patient = await service.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if await service.get_patient_by_email(data.email, exclude_id=patient_id):
        raise HTTPException(status_code=409, detail="A patient with this email already exists")
    return await service.update_patient(patient, data)


@router.delete(
    "/{patient_id}",
    status_code=204,
    summary="Delete patient",
    description="Permanently deletes a patient and all associated notes.",
)
async def delete_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    service = PatientService(db)
    patient = await service.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await service.delete_patient(patient)
