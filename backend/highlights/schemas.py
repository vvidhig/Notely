from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HighlightCreate(BaseModel):
    session_id: int
    note_id: int
    highlighted_text: str
    start_offset: int
    end_offset: int
    color: str = "yellow"
    note: Optional[str] = None


class HighlightResponse(BaseModel):
    id: int
    session_id: int
    note_id: int
    highlighted_text: str
    start_offset: int
    end_offset: int
    color: str
    task_id: Optional[int] = None
    note: Optional[str] = None
    updated_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LinkTaskRequest(BaseModel):
    task_id: int


class UpdateHighlightRequest(BaseModel):
    note: Optional[str] = None
