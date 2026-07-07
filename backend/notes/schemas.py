from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AddTextNoteRequest(BaseModel):
    session_id: int
    content: str
    tag: Optional[str] = None  # tag name as plain text string


class NoteResponse(BaseModel):
    id: int
    session_id: int
    content: str
    source: str
    tag: Optional[str] = None
    speaker: Optional[str] = None
    timestamp: datetime
    is_edited: bool = False

    model_config = {"from_attributes": True}


class NoteWithSuggestion(BaseModel):
    note: NoteResponse
    suggestion: Optional[NoteResponse] = None


class UpdateNoteRequest(BaseModel):
    content: str
