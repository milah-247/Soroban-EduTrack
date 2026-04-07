"""
In-memory event store. In production, replace with a DB or Stellar event indexer.
"""
from typing import List
from app.models import RewardEvent

_events: List[RewardEvent] = []

def record_event(event: RewardEvent):
    _events.append(event)

def get_all_events() -> List[RewardEvent]:
    return list(_events)

def clear_events():
    _events.clear()
