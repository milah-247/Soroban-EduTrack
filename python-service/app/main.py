from fastapi import FastAPI, HTTPException
from app.models import RewardEvent
from app.store import record_event, get_all_events
from app.analytics import top_students, detect_anomalies, distribution_trend, compute_metrics

app = FastAPI(title="EduTrack Analytics", version="1.0.0")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/events", status_code=201)
def ingest_event(event: RewardEvent):
    """Ingest a reward event from the backend."""
    record_event(event)
    return {"recorded": True}

@app.get("/analytics/top-students")
def get_top_students(n: int = 10):
    return top_students(n)

@app.get("/analytics/trends")
def get_trends():
    return distribution_trend()

@app.get("/analytics/anomalies")
def get_anomalies():
    return detect_anomalies()

@app.get("/analytics/student/{address}")
def get_student_metrics(address: str):
    metrics = [m for m in compute_metrics() if m.student_address == address]
    if not metrics:
        raise HTTPException(status_code=404, detail="Student not found")
    return metrics[0]

@app.get("/analytics/summary")
def get_summary():
    events = get_all_events()
    total_distributed = sum(e.amount for e in events)
    return {
        "total_events": len(events),
        "total_distributed": total_distributed,
        "unique_students": len({e.student_address for e in events}),
    }
