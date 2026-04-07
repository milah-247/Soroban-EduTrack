from pydantic import BaseModel
from typing import List

class RewardEvent(BaseModel):
    student_address: str
    activity_id: str
    amount: float
    timestamp: str

class StudentMetrics(BaseModel):
    student_address: str
    total_earned: float
    activity_count: int
    activities: List[str]

class AnomalyReport(BaseModel):
    student_address: str
    total_earned: float
    reason: str
