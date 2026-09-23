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
async def trainee_token(client):
    res = await client.post("/api/auth/login", json={"email": "jhanvi@capacityconnect.edu", "password": "demo1234"})
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.mark.anyio
async def test_trainee_login_and_me(client, trainee_token):
    res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {trainee_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "jhanvi@capacityconnect.edu"
    assert data["role"] == "trainee"

@pytest.mark.anyio
async def test_trainee_dashboard(client, trainee_token):
    res = await client.get("/api/trainee/dashboard", headers={"Authorization": f"Bearer {trainee_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "trainee" in data
    assert "summary" in data
    assert "enrolled_courses" in data
    assert data["trainee"]["email"] == "jhanvi@capacityconnect.edu"

@pytest.mark.anyio
async def test_trainee_cannot_access_trainer_mutation(client, trainee_token):
    res = await client.post(
        "/api/enrollments/approve",
        json={"enrollment_id": 1, "approve": True},
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert res.status_code == 403

@pytest.mark.anyio
async def test_trainee_diagnostic_evaluation(client, trainee_token):
    # 1. Fetch diagnostic questions
    diag_res = await client.get("/api/trainee/diagnostic?course_id=3", headers={"Authorization": f"Bearer {trainee_token}"})
    assert diag_res.status_code == 200
    questions = diag_res.json()["questions"]
    assert len(questions) > 0
    # Ensure correct_option_index is NOT sent to frontend
    assert "correct_option_index" not in questions[0]

    # 2. Submit diagnostic answers
    answers = {str(q["id"]): 0 for q in questions}
    sub_res = await client.post(
        "/api/trainee/diagnostic/submit?course_id=3",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert "score_percentage" in sub_data
    assert "eligibility_status" in sub_data
    assert "topic_breakdown" in sub_data

@pytest.mark.anyio
async def test_trainee_availability_and_roadmap(client, trainee_token):
    # Update availability
    avail_res = await client.put(
        "/api/trainee/availability?course_id=3",
        json={"weekly_hours": {"Mon": 3, "Tue": 3, "Wed": 3, "Thu": 3, "Fri": 3, "Sat": 5, "Sun": 4}},
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert avail_res.status_code == 200
    rm = avail_res.json()
    assert "items" in rm
    assert len(rm["items"]) > 0
    assert "reason_explanation" in rm["items"][0]

@pytest.mark.anyio
async def test_trainee_lesson_completion(client, trainee_token):
    res = await client.post(
        "/api/lessons/complete",
        json={"concept_id": 2, "resource_id": 2},
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "new_mastery_score" in data
    assert data["status"] == "completed"

@pytest.mark.anyio
async def test_trainee_assignment_submission(client, trainee_token):
    res = await client.post(
        "/api/trainee/assignments/1/submit",
        json={"assignment_id": 1, "content_url": "https://github.com/jhanvi/housing-price-prediction"},
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "submitted"
    assert data["content_url"] == "https://github.com/jhanvi/housing-price-prediction"

@pytest.mark.anyio
async def test_trainee_certificates_and_verification(client, trainee_token):
    # Fetch user certificates
    certs_res = await client.get("/api/trainee/certificates", headers={"Authorization": f"Bearer {trainee_token}"})
    assert certs_res.status_code == 200
    certs = certs_res.json()
    assert isinstance(certs, list)

    # Public verification check
    ver_res = await client.get("/api/certificates/verify/CC-AIML-2026-000184")
    assert ver_res.status_code == 200
    assert ver_res.json()["is_valid"] is True
