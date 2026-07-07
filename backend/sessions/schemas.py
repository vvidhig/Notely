from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CreateSessionRequest(BaseModel):
    title: str
    notion_database_id: Optional[str] = None
    session_type: str = "custom"
    participants: Optional[str] = None
    mode: str = "quick_notes"


class SwitchModeRequest(BaseModel):
    mode: str


class SessionResponse(BaseModel):
    id: int
    user_id: int = 0
    title: str
    notion_page_id: Optional[str] = None
    notion_database_id: Optional[str] = None
    status: str
    summary: Optional[str] = None
    note_count: int = 0
    session_type: str = "custom"
    participants: Optional[str] = None
    mode: str = "quick_notes"
    duration_seconds: int = 0
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EndSessionResponse(BaseModel):
    id: int
    status: str
    summary: Optional[str] = None
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
