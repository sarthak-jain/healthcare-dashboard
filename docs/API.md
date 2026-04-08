# API Documentation

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs` (Swagger UI) or `/redoc` (ReDoc)

---

## System

### Health Check

```
GET /health
```

Verifies service and database connectivity.

**Response 200:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**Response 200 (degraded):**
```json
{
  "status": "degraded",
  "database": "disconnected"
}
```

---

## Patients

### List Patients

```
GET /patients
```

Returns a paginated list of patients with optional search, sort, and status filter.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 10 | Items per page (1-100) |
| `search` | string | "" | Search by first name, last name, or email (case-insensitive, max 200 chars) |
| `sort_by` | string | "last_name" | Sort field. Allowed: `first_name`, `last_name`, `date_of_birth`, `email`, `status`, `last_visit`, `created_at`, `updated_at` |
| `sort_order` | string | "asc" | `asc` or `desc` |
| `status` | string | null | Filter by status: `active`, `inactive`, `critical` |

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "first_name": "James",
      "last_name": "Anderson",
      "date_of_birth": "1985-03-15",
      "email": "james.anderson@email.com",
      "phone": "555-0101",
      "address": "123 Oak Street, Springfield, IL 62701",
      "blood_type": "A+",
      "status": "active",
      "allergies": "Penicillin",
      "conditions": "Hypertension",
      "last_visit": "2026-03-28T10:30:00Z",
      "created_at": "2026-04-06T03:00:58.432397Z",
      "updated_at": "2026-04-06T03:00:58.432397Z"
    }
  ],
  "total": 20,
  "page": 1,
  "page_size": 10,
  "pages": 2
}
```

**Examples:**
```bash
# Search by name
GET /patients?search=garcia

# Filter critical patients, sorted by last visit
GET /patients?status=critical&sort_by=last_visit&sort_order=desc

# Page 2 with 5 per page
GET /patients?page=2&page_size=5
```

---

### Get Patient

```
GET /patients/{id}
```

**Response 200:** Single patient object (same shape as list items)

**Response 404:**
```json
{ "detail": "Patient not found" }
```

---

### Create Patient

```
POST /patients
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "date_of_birth": "1992-06-15",
  "email": "jane.doe@email.com",
  "phone": "555-0200",
  "address": "100 Main St, City, ST 12345",
  "blood_type": "O+",
  "status": "active",
  "allergies": "None",
  "conditions": "None"
}
```

**Required fields:** `first_name`, `last_name`, `date_of_birth`, `email`, `phone`

**Response 201:** Created patient object with `id`, `created_at`, `updated_at`

**Response 409:**
```json
{ "detail": "A patient with this email already exists" }
```

**Response 422 (validation error):**
```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "first_name"],
      "msg": "String should have at least 1 character",
      "input": ""
    },
    {
      "type": "value_error",
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "input": "not-an-email"
    }
  ]
}
```

---

### Update Patient

```
PUT /patients/{id}
Content-Type: application/json
```

Same request body as Create. All fields are required (full replacement).

**Response 200:** Updated patient object

**Response 404:** Patient not found

**Response 409:** Duplicate email

**Response 422:** Validation error

---

### Delete Patient

```
DELETE /patients/{id}
```

Permanently deletes the patient and all associated notes (cascade).

**Response 204:** No content (success)

**Response 404:** Patient not found

---

## Notes

### List Notes

```
GET /patients/{patient_id}/notes
```

Returns notes for a patient, ordered by most recent first.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 50 | Items per page (1-200) |

**Response 200:**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "content": "Patient presents with elevated blood pressure 150/95...",
    "created_at": "2026-04-06T03:00:58.432397Z"
  }
]
```

**Response 404:** Patient not found

---

### Add Note

```
POST /patients/{patient_id}/notes
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Follow-up visit. Blood pressure improved to 130/85.",
  "created_at": "2026-04-07T10:00:00Z"
}
```

`created_at` is optional — defaults to current UTC time if omitted.

**Response 201:** Created note object

**Response 404:** Patient not found

**Response 422:** Empty content

---

### Delete Note

```
DELETE /patients/{patient_id}/notes/{note_id}
```

**Response 204:** Success

**Response 404:** Note not found (or doesn't belong to this patient)

---

## Patient Summary

### Get Summary

```
GET /patients/{patient_id}/summary
```

Generates a human-readable clinical summary from patient profile and notes.

**Response 200:**
```json
{
  "patient_id": 1,
  "summary": "James Anderson is a 41-year-old patient (DOB: March 15, 1985) with blood type A+. Current status: active.\nMedical conditions: Hypertension.\nKnown allergies: Penicillin.\n\nClinical notes (2 total):\n- [2026-04-06] Patient presents with elevated blood pressure 150/95. Adjusted lisinopril dosage to 20mg daily.\n- [2026-04-06] Blood pressure improved to 135/85. Continue current medication."
}
```

**Summary includes:**
- Patient name, age, date of birth, blood type
- Current status
- Medical conditions
- Known allergies
- Chronological narrative from all clinical notes

**Response 404:** Patient not found

---

## Error Response Format

All errors follow a consistent format:

**Single error (404, 409):**
```json
{ "detail": "Human-readable error message" }
```

**Validation errors (422):**
```json
{
  "detail": [
    {
      "type": "error_type",
      "loc": ["body", "field_name"],
      "msg": "Human-readable message",
      "input": "the invalid value"
    }
  ]
}
```

## HTTP Status Codes Used

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 404 | Not Found | Patient/note doesn't exist |
| 409 | Conflict | Duplicate email |
| 422 | Unprocessable Entity | Validation failure (bad input) |
