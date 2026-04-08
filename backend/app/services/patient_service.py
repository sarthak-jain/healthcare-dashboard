"""Business logic for patient operations."""

import math

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Patient
from app.schemas import PatientCreate, PatientUpdate

ALLOWED_SORT_FIELDS = {"first_name", "last_name", "date_of_birth", "email", "status", "last_visit", "created_at", "updated_at"}


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_patients(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str = "",
        sort_by: str = "last_name",
        sort_order: str = "asc",
        status: str | None = None,
    ) -> dict:
        query = select(Patient)
        count_query = select(func.count(Patient.id))

        if search:
            search_filter = or_(
                Patient.first_name.ilike(f"%{search}%"),
                Patient.last_name.ilike(f"%{search}%"),
                Patient.email.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        if status:
            query = query.where(Patient.status == status)
            count_query = count_query.where(Patient.status == status)

        # Whitelist sort fields to prevent injection
        if sort_by not in ALLOWED_SORT_FIELDS:
            sort_by = "last_name"
        sort_column = getattr(Patient, sort_by)
        if sort_order == "desc":
            sort_column = sort_column.desc()
        query = query.order_by(sort_column)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        result = await self.db.execute(query)
        patients = result.scalars().all()

        return {
            "items": patients,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": math.ceil(total / page_size) if total > 0 else 0,
        }

    async def get_patient(self, patient_id: int) -> Patient | None:
        result = await self.db.execute(select(Patient).where(Patient.id == patient_id))
        return result.scalar_one_or_none()

    async def get_patient_by_email(self, email: str, exclude_id: int | None = None) -> Patient | None:
        query = select(Patient).where(Patient.email == email)
        if exclude_id is not None:
            query = query.where(Patient.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_patient(self, data: PatientCreate) -> Patient:
        patient = Patient(**data.model_dump())
        self.db.add(patient)
        await self.db.commit()
        await self.db.refresh(patient)
        return patient

    async def update_patient(self, patient: Patient, data: PatientUpdate) -> Patient:
        for field, value in data.model_dump().items():
            setattr(patient, field, value)
        await self.db.commit()
        await self.db.refresh(patient)
        return patient

    async def delete_patient(self, patient: Patient) -> None:
        await self.db.delete(patient)
        await self.db.commit()
