from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database.connection import get_db
from database.models import Session as SessionModel, Note, User
from auth.utils import get_current_user
from sessions.schemas import CreateSessionRequest, SessionResponse, EndSessionResponse, SwitchModeRequest

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(
    body: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = SessionModel(
        user_id=current_user.id,
        title=body.title,
        notion_database_id=body.notion_database_id,
        session_type=body.session_type,
        participants=body.participants,
        mode=body.mode,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[SessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.started_at.desc())
        .all()
    )


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, current_user.id, db)
    return session


@router.put("/{session_id}/end", response_model=EndSessionResponse)
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, current_user.id, db)
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Session already ended")

    notes = db.query(Note).filter(Note.session_id == session_id).all()

    summary = None
    try:
        if session.mode in ("conversation", "record_conversation"):
            summary = _build_conversation_summary(session, notes)
        else:
            notes_text = "\n".join(
                f"[{n.source}]{' [' + n.tag + ']' if n.tag else ''} {n.content}"
                for n in notes
                if n.source not in ("ai_suggestion",)
            )
            if notes_text.strip():
                from ai.groq_service import generate_next_session_plan
                summary = generate_next_session_plan(
                    notes_text,
                    session_type=session.session_type or "custom",
                    participants=session.participants or "participants",
                )
    except Exception:
        pass

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)
    session.summary = summary
    db.commit()
    db.refresh(session)
    # Mark linked meeting as completed if any
    try:
        from database.models import Meeting as MeetingModel
        linked = db.query(MeetingModel).filter(MeetingModel.session_id == session_id).first()
        if linked:
            linked.status = "completed"
            db.commit()
    except Exception:
        pass
    return session


@router.put("/{session_id}/mode")
def switch_mode(
    session_id: int,
    body: SwitchModeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.mode not in ("quick_notes", "conversation", "record_conversation"):
        raise HTTPException(status_code=400, detail="mode must be 'quick_notes' or 'conversation'")
    session = _get_owned_session(session_id, current_user.id, db)
    session.mode = body.mode
    db.commit()
    return {"mode": body.mode}


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, current_user.id, db)
    db.query(Note).filter(Note.session_id == session_id).delete()
    db.delete(session)
    db.commit()


def _build_conversation_summary(session: SessionModel, notes: list) -> str:
    """Format conversation analysis notes into clean markdown without a second LLM call."""
    import json
    from constants import SUMMARY_SECTIONS

    session_type = session.session_type or "custom"
    sections = SUMMARY_SECTIONS.get(session_type, SUMMARY_SECTIONS["custom"])

    summary_note = next((n for n in notes if n.source == "conversation_summary"), None)
    eval_note = next((n for n in notes if n.source == "conversation_evaluation"), None)

    lines: list[str] = []

    if summary_note:
        try:
            data = json.loads(summary_note.content)
            for section in sections:
                key = section.lower().replace(" ", "_").replace("-", "_")
                items = data.get(key, [])
                if items:
                    lines.append(f"## {section}")
                    for item in items:
                        lines.append(f"- {item}")
                    lines.append("")
        except (json.JSONDecodeError, AttributeError):
            lines.append(summary_note.content)

    if eval_note:
        try:
            evals = json.loads(eval_note.content)
            if evals:
                lines.append("## Key Evaluations")
                for item in evals:
                    lines.append(f"- {item}")
                lines.append("")
        except (json.JSONDecodeError, AttributeError):
            pass

    return "\n".join(lines)


def _get_owned_session(session_id: int, user_id: int, db: Session) -> SessionModel:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your session")
    return session
