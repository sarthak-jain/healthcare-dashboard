"""Patient notes and summary endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import NoteCreate, NoteResponse, PatientSummary
from app.services.note_service import NoteService
from app.services.patient_service import PatientService

router = APIRouter(prefix="/patients/{patient_id}/notes", tags=["notes"])


async def _get_patient_or_404(patient_id: int, db: AsyncSession):
    service = PatientService(db)
    patient = await service.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get(
    "",
    response_model=list[NoteResponse],
    summary="List notes",
    description="Returns notes for a patient, ordered by most recent first.",
)
async def list_notes(
    patient_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    await _get_patient_or_404(patient_id, db)
    service = NoteService(db)
    result = await service.list_notes(patient_id, page=page, page_size=page_size)
    return result["items"]


@router.post(
    "",
    response_model=NoteResponse,
    status_code=201,
    summary="Add note",
    description="Adds a clinical note to a patient. Optionally accepts a custom timestamp.",
)
async def create_note(
    patient_id: int, data: NoteCreate, db: AsyncSession = Depends(get_db)
):
    await _get_patient_or_404(patient_id, db)
    service = NoteService(db)
    return await service.create_note(patient_id, data)


@router.delete(
    "/{note_id}",
    status_code=204,
    summary="Delete note",
    description="Permanently deletes a specific note.",
)
async def delete_note(
    patient_id: int, note_id: int, db: AsyncSession = Depends(get_db)
):
    service = NoteService(db)
    note = await service.get_note(patient_id, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await service.delete_note(note)


summary_router = APIRouter(prefix="/patients/{patient_id}", tags=["patients"])


@summary_router.get(
    "/summary",
    response_model=PatientSummary,
    summary="Patient summary",
    description="Generates a human-readable clinical summary from patient profile and notes.",
)
async def get_patient_summary(patient_id: int, db: AsyncSession = Depends(get_db)):
    service = NoteService(db)
    patient = await service.get_patient_with_notes(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    summary = service.generate_summary(patient)
    return PatientSummary(patient_id=patient.id, summary=summary)
