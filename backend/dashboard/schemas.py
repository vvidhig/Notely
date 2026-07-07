from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CalendarDot(BaseModel):
    date: str  # YYYY-MM-DD
    has_task: bool
    has_session: bool


class RecentSession(BaseModel):
    id: int
    title: str
    session_type: str
    status: str
    mode: str
    note_count: int
    started_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True


class UpcomingTask(BaseModel):
    id: int
    title: str
    quadrant: str
    due_date: Optional[str]
    status: str
    tags: Optional[str]

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    tasks_due_today: int
    sessions_this_week: int
    highlights_without_tasks: int
    recent_sessions: list[RecentSession]
    upcoming_tasks: list[UpcomingTask]
    calendar_dots: list[CalendarDot]
