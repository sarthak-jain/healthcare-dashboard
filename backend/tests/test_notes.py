import pytest

PATIENT_DATA = {
    "first_name": "Note",
    "last_name": "Tester",
    "date_of_birth": "1985-03-20",
    "email": "note.tester@example.com",
    "phone": "555-0002",
    "address": "",
    "blood_type": "O+",
    "status": "active",
    "allergies": "Penicillin",
    "conditions": "Hypertension",
}


async def create_patient(client):
    resp = await client.post("/patients", json=PATIENT_DATA)
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_create_note(client):
    pid = await create_patient(client)
    resp = await client.post(f"/patients/{pid}/notes", json={"content": "Initial visit. BP 120/80."})
    assert resp.status_code == 201
    body = resp.json()
    assert body["content"] == "Initial visit. BP 120/80."
    assert body["patient_id"] == pid


@pytest.mark.asyncio
async def test_create_note_patient_not_found(client):
    resp = await client.post("/patients/99999/notes", json={"content": "Test"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_note_empty_content(client):
    pid = await create_patient(client)
    resp = await client.post(f"/patients/{pid}/notes", json={"content": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_notes(client):
    pid = await create_patient(client)
    await client.post(f"/patients/{pid}/notes", json={"content": "Note 1"})
    await client.post(f"/patients/{pid}/notes", json={"content": "Note 2"})

    resp = await client.get(f"/patients/{pid}/notes")
    assert resp.status_code == 200
    notes = resp.json()
    assert len(notes) == 2


@pytest.mark.asyncio
async def test_list_notes_patient_not_found(client):
    resp = await client.get("/patients/99999/notes")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_note(client):
    pid = await create_patient(client)
    create_resp = await client.post(f"/patients/{pid}/notes", json={"content": "To be deleted"})
    note_id = create_resp.json()["id"]

    resp = await client.delete(f"/patients/{pid}/notes/{note_id}")
    assert resp.status_code == 204

    list_resp = await client.get(f"/patients/{pid}/notes")
    assert len(list_resp.json()) == 0


@pytest.mark.asyncio
async def test_delete_note_not_found(client):
    pid = await create_patient(client)
    resp = await client.delete(f"/patients/{pid}/notes/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patient_summary(client):
    pid = await create_patient(client)
    await client.post(f"/patients/{pid}/notes", json={"content": "BP elevated at 150/95."})

    resp = await client.get(f"/patients/{pid}/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["patient_id"] == pid
    summary = body["summary"]
    assert "Note Tester" in summary
    assert "O+" in summary
    assert "Hypertension" in summary
    assert "Penicillin" in summary
    assert "BP elevated" in summary


@pytest.mark.asyncio
async def test_patient_summary_not_found(client):
    resp = await client.get("/patients/99999/summary")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_notes_cascade_on_patient_delete(client):
    pid = await create_patient(client)
    await client.post(f"/patients/{pid}/notes", json={"content": "Will be cascaded"})
    await client.delete(f"/patients/{pid}")
    # Patient deleted, notes should be gone too (cascade)
    resp = await client.get(f"/patients/{pid}/notes")
    assert resp.status_code == 404
