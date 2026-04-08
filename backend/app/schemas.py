from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class PatientBase(BaseModel):
    """Base schema for patient data with validation."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=20)
    address: str = Field("", max_length=500)
    blood_type: str = Field("", max_length=5)
    status: str = Field("active")
    allergies: str = Field("")
    conditions: str = Field("")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"active", "inactive", "critical"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: int
    last_visit: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    items: list[PatientResponse]
    total: int
    page: int
    page_size: int
    pages: int


class NoteBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    created_at: datetime | None = None


class NoteCreate(NoteBase):
    pass


class NoteResponse(NoteBase):
    id: int
    patient_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientSummary(BaseModel):
    patient_id: int
    summary: str
