import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.anyio
async def test_notifications_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login as trainer
        login_res = await ac.post("/api/auth/login", json={
            "email": "rajesh@capacityconnect.edu",
            "password": "demo1234"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch notifications
        notif_res = await ac.get("/api/notifications", headers=headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        assert isinstance(notifs, list)

        if notifs:
            nid = notifs[0]["id"]
            read_res = await ac.post(f"/api/notifications/{nid}/read", headers=headers)
            assert read_res.status_code == 200

@pytest.mark.anyio
async def test_discussion_moderation_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", json={
            "email": "rajesh@capacityconnect.edu",
            "password": "demo1234"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a new discussion post
        post_res = await ac.post("/api/discussions", headers=headers, json={
            "course_id": 3,
            "title": "Test Discussion Question",
            "content": "How do we handle edge cases in custom neural net backpropagation?"
        })
        assert post_res.status_code == 200
        post_id = post_res.json()["id"]

        # 2. Get discussions list
        disc_res = await ac.get("/api/trainer/discussions?course_id=3", headers=headers)
        assert disc_res.status_code == 200
        items = disc_res.json()["items"]
        assert any(p["id"] == post_id for p in items)

        # 3. Pin post
        pin_res = await ac.post(f"/api/trainer/discussions/{post_id}/pin", headers=headers, json={"is_pinned": True})
        assert pin_res.status_code == 200
        assert pin_res.json()["is_pinned"] is True

        # 4. Flag post
        flag_res = await ac.post(f"/api/trainer/discussions/{post_id}/flag", headers=headers, json={"is_flagged": True})
        assert flag_res.status_code == 200
        assert flag_res.json()["is_flagged"] is True

        # 5. Delete post
        del_res = await ac.delete(f"/api/trainer/discussions/{post_id}", headers=headers)
        assert del_res.status_code == 200

@pytest.mark.anyio
async def test_ratings_and_cohorts_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/auth/login", json={
            "email": "rajesh@capacityconnect.edu",
            "password": "demo1234"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Get trainer ratings
        ratings_res = await ac.get("/api/trainer/ratings", headers=headers)
        assert ratings_res.status_code == 200
        r_data = ratings_res.json()
        assert "average_rating" in r_data
        assert "rating_distribution" in r_data

        # 2. Post a rating
        post_r = await ac.post("/api/ratings", headers=headers, json={
            "course_id": 3,
            "score": 5.0,
            "comment": "Outstanding course structure and personalized guidance!"
        })
        assert post_r.status_code == 200

        # 3. Create a cohort batch
        cohort_res = await ac.post("/api/trainer/courses/3/cohorts", headers=headers, json={
            "name": "Spring 2026 Batch Alpha",
            "start_date": "2026-03-01",
            "end_date": "2026-06-30"
        })
        assert cohort_res.status_code == 200
        cohort_id = cohort_res.json()["id"]

        # 4. Add member to cohort
        member_res = await ac.post(f"/api/trainer/cohorts/{cohort_id}/members", headers=headers, json={
            "trainee_id": 1
        })
        assert member_res.status_code == 200

        # 5. List cohorts
        list_cohorts = await ac.get("/api/trainer/courses/3/cohorts", headers=headers)
        assert list_cohorts.status_code == 200
        cohorts = list_cohorts.json()
        assert any(c["id"] == cohort_id for c in cohorts)
