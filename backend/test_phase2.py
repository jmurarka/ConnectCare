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

@pytest.fixture
async def trainee_token(client):
    res = await client.post("/api/auth/login", json={"email": "jhanvi@capacityconnect.edu", "password": "demo1234"})
    return res.json()["access_token"]

@pytest.mark.anyio
async def test_dag_prerequisite_cycle_rejection(client, trainer_token):
    # Concept 1: AIML01-C1 (id=1), Concept 2: AIML01-C2 (id=2, depends on C1)
    # Adding reverse edge C1 depending on C2 should fail with 400 DAG Cycle Error
    res = await client.post(
        "/api/trainer/concepts/1/prerequisites",
        json={"prerequisite_concept_id": 2},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert res.status_code == 400
    assert "Cycle" in res.json()["detail"] or "circular" in res.json()["detail"]

@pytest.mark.anyio
async def test_question_bank_crud(client, trainer_token):
    # Add question
    add_res = await client.post(
        "/api/trainer/assessments/1/questions",
        json={
            "question_text": "What is PyTorch?",
            "options": ["A DL framework", "A database", "An OS", "A browser"],
            "correct_option_index": 0,
            "explanation": "PyTorch is an open-source deep learning framework.",
            "topic": "Neural Networks",
            "concept_id": 10
        },
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert add_res.status_code == 200
    q_data = add_res.json()
    assert q_data["question_text"] == "What is PyTorch?"

    # Invalid option index check
    inv_res = await client.post(
        "/api/trainer/assessments/1/questions",
        json={
            "question_text": "Invalid Q",
            "options": ["Opt A", "Opt B"],
            "correct_option_index": 5, # out of range
            "explanation": "Invalid",
            "topic": "General"
        },
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert inv_res.status_code == 400

@pytest.mark.anyio
async def test_assignment_grading_and_notification(client, trainer_token, trainee_token):
    # Grade submission #1 (Jhanvi's housing submission)
    grade_res = await client.post(
        "/api/trainer/submissions/1/grade",
        json={"grade": 95.0, "feedback": "Great implementation of Ridge Regression!"},
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert grade_res.status_code == 200
    assert grade_res.json()["grade"] == 95.0

    # Verify trainee received notification
    notif_res = await client.get(
        "/api/notifications",
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) > 0
    assert "assignment" in notifs[0]["type"] or "graded" in notifs[0]["message"]

@pytest.mark.anyio
async def test_lesson_completion_mastery_nudge(client, trainee_token):
    # Complete lesson for concept 2
    res = await client.post(
        "/api/lessons/complete",
        json={"concept_id": 2, "resource_id": 2},
        headers={"Authorization": f"Bearer {trainee_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "new_mastery_score" in data
    assert data["new_mastery_score"] > 0
