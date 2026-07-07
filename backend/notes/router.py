import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from database.connection import get_db
from database.models import Note, Session as SessionModel, User
from auth.utils import get_current_user
from notes.schemas import AddTextNoteRequest, NoteResponse, NoteWithSuggestion, UpdateNoteRequest

router = APIRouter(prefix="/api/notes", tags=["notes"])


def _build_note_response(note: Note) -> NoteResponse:
    return NoteResponse(
        id=note.id,
        session_id=note.session_id,
        content=note.content,
        source=note.source,
        tag=note.tag,
        speaker=note.speaker,
        timestamp=note.timestamp,
        is_edited=bool(note.is_edited),
    )


def _try_auto_suggest(session_id: int, db: Session) -> Optional[NoteResponse]:
    """Attempt to generate an AI suggestion and save it as a note. Returns None on any failure."""
    try:
        from ai.groq_service import get_suggestions
        suggestion_text = get_suggestions(session_id, db, manual=False)

        suggestion_note = Note(
            session_id=session_id,
            content=suggestion_text,
            source="ai_suggestion",
            tag=None,
            speaker=None,
        )
        db.add(suggestion_note)
        db.commit()
        db.refresh(suggestion_note)
        return _build_note_response(suggestion_note)
    except Exception:
        return None


@router.post("/text", response_model=NoteWithSuggestion, status_code=201)
def add_text_note(
    body: AddTextNoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _assert_session_owned(body.session_id, current_user.id, db)
    note = Note(
        session_id=body.session_id,
        content=body.content,
        source="text",
        tag=body.tag,
        speaker=None,
    )
    db.add(note)

    session.note_count = (session.note_count or 0) + 1
    db.commit()
    db.refresh(note)

    note_response = _build_note_response(note)

    suggestion = None
    if session.note_count % 3 == 0 and session.note_count > 0:
        suggestion = _try_auto_suggest(body.session_id, db)

    return NoteWithSuggestion(note=note_response, suggestion=suggestion)


@router.post("/voice", response_model=NoteWithSuggestion, status_code=201)
async def add_voice_note(
    session_id: int = Form(...),
    audio: UploadFile = File(...),
    tag: Optional[str] = Form(default=None),
    duration_seconds: Optional[int] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _assert_session_owned(session_id, current_user.id, db)

    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        from ai.whisper_service import transcribe_audio
        transcript = transcribe_audio(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Transcription error: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if not transcript.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not transcribe audio — recording may be too short or silent",
        )

    note = Note(
        session_id=session_id,
        content=transcript,
        source="voice",
        tag=tag,
        speaker=None,
    )
    db.add(note)

    session.note_count = (session.note_count or 0) + 1
    if duration_seconds:
        session.duration_seconds = (session.duration_seconds or 0) + duration_seconds
    db.commit()
    db.refresh(note)

    note_response = _build_note_response(note)

    suggestion = None
    if session.note_count % 3 == 0 and session.note_count > 0:
        suggestion = _try_auto_suggest(session_id, db)

    return NoteWithSuggestion(note=note_response, suggestion=suggestion)


@router.get("/{session_id}", response_model=list[NoteResponse])
def get_notes(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_session_owned(session_id, current_user.id, db)
    notes = (
        db.query(Note)
        .filter(Note.session_id == session_id)
        .order_by(Note.timestamp.asc())
        .all()
    )
    return [_build_note_response(n) for n in notes]


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    body: UpdateNoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_session_owned(note.session_id, current_user.id, db)
    note.content = body.content
    note.is_edited = True
    db.commit()
    db.refresh(note)
    return _build_note_response(note)


@router.post("/{note_id}/reformat", response_model=NoteResponse)
def reformat_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_session_owned(note.session_id, current_user.id, db)
    try:
        from ai.groq_service import reformat_text
        formatted = reformat_text(note.content)
        note.content = formatted
        note.is_edited = True
        db.commit()
        db.refresh(note)
    except Exception:
        pass  # if Groq unavailable, return note as-is without error
    return _build_note_response(note)


@router.delete("/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    _assert_session_owned(note.session_id, current_user.id, db)
    db.delete(note)
    db.commit()


def _assert_session_owned(session_id: int, user_id: int, db: Session) -> SessionModel:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session
