from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Note, Session as SessionModel, User
from auth.utils import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


class SuggestRequest(BaseModel):
    session_id: int


class SuggestResponse(BaseModel):
    suggestion: str


class ConversationChatRequest(BaseModel):
    session_id: int
    conversation_text: str
    question: str
    history: list[dict] = []


@router.post("/suggest", response_model=SuggestResponse)
def suggest(
    body: SuggestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_session_owned(body.session_id, current_user.id, db)
    # Check there are notes to suggest from
    notes = (
        db.query(Note)
        .filter(Note.session_id == body.session_id, Note.source != "ai_suggestion")
        .all()
    )
    if not notes:
        raise HTTPException(status_code=400, detail="No notes to base suggestions on")
    try:
        from ai.groq_service import get_suggestions
        suggestion = get_suggestions(body.session_id, db, manual=True)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return SuggestResponse(suggestion=suggestion)


@router.post("/summarize/{session_id}")
def summarize(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _assert_session_owned(session_id, current_user.id, db)
    notes = _get_notes_text(session_id, db)
    if not notes.strip():
        raise HTTPException(status_code=400, detail="No notes to summarize")
    try:
        from ai.groq_service import generate_next_session_plan
        summary = generate_next_session_plan(
            notes,
            session_type=session.session_type or "custom",
            participants=session.participants or "participants",
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    session.summary = summary
    db.commit()
    return {"summary": summary}


@router.post("/conversation-chat")
def conversation_chat(
    body: ConversationChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _assert_session_owned(body.session_id, current_user.id, db)
    if not body.conversation_text.strip():
        raise HTTPException(status_code=400, detail="No conversation text provided")
    try:
        from ai.groq_service import chat_about_chunk
        answer = chat_about_chunk(
            conversation_text=body.conversation_text,
            session_type=session.session_type or "custom",
            participants=session.participants or "participants",
            question=body.question,
            history=body.history,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {"answer": answer}


def _get_notes_text(session_id: int, db: Session) -> str:
    notes = (
        db.query(Note)
        .filter(Note.session_id == session_id, Note.source != "ai_suggestion")
        .order_by(Note.timestamp.asc())
        .all()
    )
    return "\n".join(
        f"[{n.source}]{' [' + n.tag + ']' if n.tag else ''} {n.content}"
        for n in notes
    )


def _assert_session_owned(session_id: int, user_id: int, db: Session) -> SessionModel:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session
