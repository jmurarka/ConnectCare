import pytest
from httpx import ASGITransport, AsyncClient
from main import app
import seed

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed.seed_database()

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as c:
        yield c

@pytest.fixture
async def trainer_token(client):
    res = await client.post("/api/auth/login", json={"email": "rajesh@capacityconnect.edu", "password": "demo1234"})
    return res.json()["access_token"]

@pytest.mark.anyio
async def test_get_trainer_enrollments(client, trainer_token):
    res = await client.get(
        "/api/trainer/enrollments?status=approval_pending",
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) > 0

@pytest.mark.anyio
async def test_approve_and_reject_enrollment(client, trainer_token):
    # Fetch pending
    res = await client.get(
        "/api/trainer/enrollments?status=approval_pending",
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    pending_items = res.json()["items"]
    assert len(pending_items) >= 2
    
    e1_id = pending_items[0]["enrollment_id"]
    e2_id = pending_items[1]["enrollment_id"]

    # Approve e1
    app_res = await client.post(
        f"/api/trainer/enrollments/{e1_id}/approve",
        json={"notes": "Approved in test"},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"

    # Reject e2
    rej_res = await client.post(
        f"/api/trainer/enrollments/{e2_id}/reject",
        json={"notes": "Rejected in test"},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"

@pytest.mark.anyio
async def test_course_overview_and_at_risk(client, trainer_token):
    res = await client.get(
        "/api/trainer/courses/3/overview",
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "enrolled_count" in data
    assert "avg_mastery_percentage" in data

    ar_res = await client.get(
        "/api/trainer/courses/3/at-risk",
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert ar_res.status_code == 200
    assert isinstance(ar_res.json(), list)

@pytest.mark.anyio
async def test_certificate_issuance_idempotent(client, trainer_token):
    # Check eligible
    el_res = await client.get(
        "/api/trainer/courses/2/completion-eligible",
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert el_res.status_code == 200

    # Issue cert
    issue_res1 = await client.post(
        "/api/trainer/certificates/issue",
        json={"trainee_id": 1, "course_id": 3},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert issue_res1.status_code == 200
    cert1 = issue_res1.json()
    assert "certificate_code" in cert1

    # Re-issue (idempotency check)
    issue_res2 = await client.post(
        "/api/trainer/certificates/issue",
        json={"trainee_id": 1, "course_id": 3},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert issue_res2.status_code == 200
    cert2 = issue_res2.json()
    assert cert2["certificate_code"] == cert1["certificate_code"]
