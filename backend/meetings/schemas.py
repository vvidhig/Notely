from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class MeetingCreate(BaseModel):
    title: str
    date: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    participants: Optional[str] = None
    notes: Optional[str] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    participants: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class MeetingResponse(BaseModel):
    id: int
    user_id: int
    title: str
    date: Optional[str] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    participants: Optional[str] = None
    notes: Optional[str] = None
    session_id: Optional[int] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
