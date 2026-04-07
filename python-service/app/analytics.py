from collections import defaultdict
from typing import List
from app.models import RewardEvent, StudentMetrics, AnomalyReport
from app.store import get_all_events
import os

ANOMALY_THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", "1000"))

def compute_metrics() -> List[StudentMetrics]:
    totals: dict = defaultdict(lambda: {"total": 0.0, "activities": []})
    for e in get_all_events():
        totals[e.student_address]["total"] += e.amount
        totals[e.student_address]["activities"].append(e.activity_id)

    return [
        StudentMetrics(
            student_address=addr,
            total_earned=data["total"],
            activity_count=len(data["activities"]),
            activities=data["activities"],
        )
        for addr, data in totals.items()
    ]

def top_students(n: int = 10) -> List[StudentMetrics]:
    return sorted(compute_metrics(), key=lambda m: m.total_earned, reverse=True)[:n]

def detect_anomalies() -> List[AnomalyReport]:
    return [
        AnomalyReport(
            student_address=m.student_address,
            total_earned=m.total_earned,
            reason=f"Earned {m.total_earned} exceeds threshold {ANOMALY_THRESHOLD}",
        )
        for m in compute_metrics()
        if m.total_earned > ANOMALY_THRESHOLD
    ]

def distribution_trend() -> dict:
    """Returns total tokens distributed per activity type."""
    trend: dict = defaultdict(float)
    for e in get_all_events():
        activity_type = e.activity_id.split(":")[0] if ":" in e.activity_id else e.activity_id
        trend[activity_type] += e.amount
    return dict(trend)
