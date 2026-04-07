import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.store import clear_events

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_store():
    clear_events()
    yield
    clear_events()

def post_event(addr, activity, amount):
    return client.post("/events", json={
        "student_address": addr,
        "activity_id": activity,
        "amount": amount,
        "timestamp": "2026-04-07T00:00:00Z",
    })

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_ingest_event():
    r = post_event("GABC", "course:1", 100)
    assert r.status_code == 201

def test_top_students():
    post_event("G1", "course:1", 300)
    post_event("G2", "quiz:1", 100)
    post_event("G1", "exam:1", 200)
    r = client.get("/analytics/top-students")
    assert r.status_code == 200
    data = r.json()
    assert data[0]["student_address"] == "G1"
    assert data[0]["total_earned"] == 500

def test_trends():
    post_event("G1", "course:1", 100)
    post_event("G2", "quiz:1", 50)
    r = client.get("/analytics/trends")
    assert r.status_code == 200
    data = r.json()
    assert data["course"] == 100
    assert data["quiz"] == 50

def test_anomaly_detection():
    post_event("G1", "course:1", 1500)  # above threshold
    post_event("G2", "quiz:1", 50)
    r = client.get("/analytics/anomalies")
    assert r.status_code == 200
    anomalies = r.json()
    assert len(anomalies) == 1
    assert anomalies[0]["student_address"] == "G1"

def test_student_metrics():
    post_event("GABC", "course:1", 100)
    post_event("GABC", "quiz:1", 50)
    r = client.get("/analytics/student/GABC")
    assert r.status_code == 200
    data = r.json()
    assert data["total_earned"] == 150
    assert data["activity_count"] == 2

def test_student_not_found():
    r = client.get("/analytics/student/GNOTEXIST")
    assert r.status_code == 404

def test_summary():
    post_event("G1", "course:1", 100)
    post_event("G2", "quiz:1", 200)
    r = client.get("/analytics/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_events"] == 2
    assert data["total_distributed"] == 300
    assert data["unique_students"] == 2
