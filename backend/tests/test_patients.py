import pytest

PATIENT_DATA = {
    "first_name": "Test",
    "last_name": "Patient",
    "date_of_birth": "1990-05-15",
    "email": "test.patient@example.com",
    "phone": "555-0001",
    "address": "123 Test St",
    "blood_type": "A+",
    "status": "active",
    "allergies": "None",
    "conditions": "None",
}


@pytest.mark.asyncio
async def test_health_check(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    assert resp.json()["database"] == "connected"


@pytest.mark.asyncio
async def test_create_patient(client):
    resp = await client.post("/patients", json=PATIENT_DATA)
    assert resp.status_code == 201
    body = resp.json()
    assert body["first_name"] == "Test"
    assert body["last_name"] == "Patient"
    assert body["email"] == "test.patient@example.com"
    assert "id" in body


@pytest.mark.asyncio
async def test_create_patient_validation_error(client):
    resp = await client.post("/patients", json={"first_name": "", "last_name": "X", "date_of_birth": "1990-01-01", "email": "bad", "phone": "555"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_patient_duplicate_email(client):
    await client.post("/patients", json=PATIENT_DATA)
    resp = await client.post("/patients", json=PATIENT_DATA)
    assert resp.status_code == 409
    assert "email" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_patients(client):
    await client.post("/patients", json=PATIENT_DATA)
    resp = await client.get("/patients")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert "total" in body
    assert "page" in body
    assert "pages" in body
    assert body["total"] >= 1


@pytest.mark.asyncio
async def test_list_patients_pagination(client):
    for i in range(3):
        data = {**PATIENT_DATA, "email": f"test{i}@example.com"}
        await client.post("/patients", json=data)
    resp = await client.get("/patients", params={"page": 1, "page_size": 2})
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["pages"] == 2


@pytest.mark.asyncio
async def test_list_patients_search(client):
    await client.post("/patients", json=PATIENT_DATA)
    resp = await client.get("/patients", params={"search": "Test"})
    assert resp.json()["total"] >= 1

    resp2 = await client.get("/patients", params={"search": "zzzznonexistent"})
    assert resp2.json()["total"] == 0


@pytest.mark.asyncio
async def test_list_patients_filter_by_status(client):
    await client.post("/patients", json=PATIENT_DATA)
    data2 = {**PATIENT_DATA, "email": "critical@example.com", "status": "critical"}
    await client.post("/patients", json=data2)

    resp = await client.get("/patients", params={"status": "critical"})
    for item in resp.json()["items"]:
        assert item["status"] == "critical"


@pytest.mark.asyncio
async def test_get_patient(client):
    create_resp = await client.post("/patients", json=PATIENT_DATA)
    pid = create_resp.json()["id"]

    resp = await client.get(f"/patients/{pid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == pid


@pytest.mark.asyncio
async def test_get_patient_not_found(client):
    resp = await client.get("/patients/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_patient(client):
    create_resp = await client.post("/patients", json=PATIENT_DATA)
    pid = create_resp.json()["id"]

    updated = {**PATIENT_DATA, "first_name": "Updated"}
    resp = await client.put(f"/patients/{pid}", json=updated)
    assert resp.status_code == 200
    assert resp.json()["first_name"] == "Updated"


@pytest.mark.asyncio
async def test_update_patient_not_found(client):
    resp = await client.put("/patients/99999", json=PATIENT_DATA)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_patient(client):
    create_resp = await client.post("/patients", json=PATIENT_DATA)
    pid = create_resp.json()["id"]

    resp = await client.delete(f"/patients/{pid}")
    assert resp.status_code == 204

    resp2 = await client.get(f"/patients/{pid}")
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_delete_patient_not_found(client):
    resp = await client.delete("/patients/99999")
    assert resp.status_code == 404
