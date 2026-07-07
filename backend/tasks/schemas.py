from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    execution_steps: Optional[str] = None
    quadrant: str = "neither"
    due_date: Optional[str] = None  # YYYY-MM-DD
    due_time: Optional[str] = None  # HH:MM (24-hour)
    reminder_minutes: Optional[int] = None  # 5 | 10 | 20 | 30 | 60
    tags: Optional[str] = None
    status: Optional[str] = None  # override initial status (e.g. "in_progress")
    source: str = "manual"
    highlight_id: Optional[int] = None
    session_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    execution_steps: Optional[str] = None
    quadrant: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    reminder_minutes: Optional[int] = None
    tags: Optional[str] = None
    status: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    execution_steps: Optional[str]
    quadrant: str
    due_date: Optional[str]
    due_time: Optional[str]
    reminder_minutes: Optional[int]
    tags: Optional[str]
    status: str
    source: str
    highlight_id: Optional[int]
    session_id: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
