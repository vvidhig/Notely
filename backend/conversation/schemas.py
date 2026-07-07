from typing import Optional
from pydantic import BaseModel
from notes.schemas import NoteResponse


class ConversationResult(BaseModel):
    notes: list[NoteResponse]
    duration_seconds: float
    raw_transcript: Optional[str] = None
