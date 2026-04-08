"""Business logic for note operations."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Note, Patient
from app.schemas import NoteCreate


class NoteService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_notes(
        self, patient_id: int, page: int = 1, page_size: int = 50
    ) -> dict:
        count_result = await self.db.execute(
            select(func.count(Note.id)).where(Note.patient_id == patient_id)
        )
        total = count_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Note)
            .where(Note.patient_id == patient_id)
            .order_by(Note.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        notes = result.scalars().all()

        return {"items": notes, "total": total, "page": page, "page_size": page_size}

    async def create_note(self, patient_id: int, data: NoteCreate) -> Note:
        note = Note(
            patient_id=patient_id,
            content=data.content,
            created_at=data.created_at or datetime.now(timezone.utc),
        )
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def get_note(self, patient_id: int, note_id: int) -> Note | None:
        result = await self.db.execute(
            select(Note).where(Note.id == note_id, Note.patient_id == patient_id)
        )
        return result.scalar_one_or_none()

    async def delete_note(self, note: Note) -> None:
        await self.db.delete(note)
        await self.db.commit()

    async def get_patient_with_notes(self, patient_id: int) -> Patient | None:
        result = await self.db.execute(
            select(Patient)
            .options(selectinload(Patient.notes))
            .where(Patient.id == patient_id)
        )
        return result.scalar_one_or_none()

    def generate_summary(self, patient: Patient) -> str:
        """Generate a template-based clinical summary from patient data and notes."""
        today = datetime.now(timezone.utc).date()
        age = (
            today.year
            - patient.date_of_birth.year
            - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
        )

        lines = [
            f"{patient.first_name} {patient.last_name} is a {age}-year-old patient "
            f"(DOB: {patient.date_of_birth.strftime('%B %d, %Y')}) "
            f"with blood type {patient.blood_type or 'unknown'}. "
            f"Current status: {patient.status.value}.",
        ]

        if patient.conditions and patient.conditions.lower() != "none":
            lines.append(f"Medical conditions: {patient.conditions}.")

        if patient.allergies and patient.allergies.lower() != "none":
            lines.append(f"Known allergies: {patient.allergies}.")
        else:
            lines.append("No known allergies.")

        if patient.notes:
            lines.append("")
            lines.append(f"Clinical notes ({len(patient.notes)} total):")
            for note in sorted(patient.notes, key=lambda n: n.created_at):
                date_str = note.created_at.strftime("%Y-%m-%d")
                lines.append(f"- [{date_str}] {note.content}")
        else:
            lines.append("No clinical notes on file.")

        return "\n".join(lines)
