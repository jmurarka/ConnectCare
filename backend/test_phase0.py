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

@pytest.mark.anyio
async def test_login_success(client):
    res = await client.post("/api/auth/login", json={"email": "rajesh@capacityconnect.edu", "password": "demo1234"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "trainer"

@pytest.mark.anyio
async def test_login_wrong_password(client):
    res = await client.post("/api/auth/login", json={"email": "rajesh@capacityconnect.edu", "password": "demo1234_wrong"})
    assert res.status_code == 401

@pytest.mark.anyio
async def test_trainer_route_requires_auth(client):
    res = await client.post("/api/enrollments/approve", json={"enrollment_id": 1, "approve": True})
    assert res.status_code in [401, 403]

@pytest.mark.anyio
async def test_trainee_cannot_access_trainer_mutation(client):
    t_login = await client.post("/api/auth/login", json={"email": "jhanvi@capacityconnect.edu", "password": "demo1234"})
    token = t_login.json()["access_token"]

    res = await client.post(
        "/api/enrollments/approve",
        json={"enrollment_id": 1, "approve": True},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

@pytest.mark.anyio
async def test_trainer_can_approve_enrollment(client):
    tr_login = await client.post("/api/auth/login", json={"email": "rajesh@capacityconnect.edu", "password": "demo1234"})
    token = tr_login.json()["access_token"]

    res = await client.post(
        "/api/enrollments/approve",
        json={"enrollment_id": 3, "approve": True},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "approved"

@pytest.mark.anyio
async def test_register_new_user(client):
    res = await client.post("/api/auth/register", json={
        "full_name": "Dr. Sunita Sharma",
        "email": "sunita@capacityconnect.edu",
        "password": "securepassword123",
        "role": "trainer",
        "education": "Ph.D. AI & Robotics",
        "current_role": "Senior Professor"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "sunita@capacityconnect.edu"
    assert data["role"] == "trainer"

