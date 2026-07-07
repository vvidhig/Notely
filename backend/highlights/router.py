from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DbSession

from auth.utils import get_current_user
from database.connection import get_db
from database.models import Highlight, Session as SessionModel
from highlights.schemas import HighlightCreate, HighlightResponse, LinkTaskRequest, UpdateHighlightRequest

router = APIRouter(prefix="/api/highlights", tags=["highlights"])


def _own_highlight(highlight_id: int, user_id: int, db: DbSession) -> Highlight:
    h = (
        db.query(Highlight)
        .join(SessionModel, Highlight.session_id == SessionModel.id)
        .filter(Highlight.id == highlight_id, SessionModel.user_id == user_id)
        .first()
    )
    if not h:
        raise HTTPException(status_code=404, detail="Highlight not found")
    return h


@router.post("", response_model=HighlightResponse, status_code=201)
def create_highlight(
    body: HighlightCreate,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == body.session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    h = Highlight(
        session_id=body.session_id,
        note_id=body.note_id,
        highlighted_text=body.highlighted_text,
        start_offset=body.start_offset,
        end_offset=body.end_offset,
        color=body.color,
        note=body.note,
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.get("", response_model=list[HighlightResponse])
def list_highlights(
    session_id: Optional[int] = Query(None),
    has_task: Optional[bool] = Query(None),
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    q = (
        db.query(Highlight)
        .join(SessionModel, Highlight.session_id == SessionModel.id)
        .filter(SessionModel.user_id == current_user.id)
    )
    if session_id is not None:
        q = q.filter(Highlight.session_id == session_id)
    if has_task is True:
        q = q.filter(Highlight.task_id.isnot(None))
    elif has_task is False:
        q = q.filter(Highlight.task_id.is_(None))
    return q.order_by(Highlight.created_at.desc()).all()


@router.get("/session/{session_id}", response_model=list[HighlightResponse])
def get_session_highlights(
    session_id: int,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return (
        db.query(Highlight)
        .filter(Highlight.session_id == session_id)
        .order_by(Highlight.start_offset.asc())
        .all()
    )


@router.patch("/{highlight_id}", response_model=HighlightResponse)
def update_highlight(
    highlight_id: int,
    body: UpdateHighlightRequest,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    from datetime import datetime
    h = _own_highlight(highlight_id, current_user.id, db)
    if body.note is not None:
        h.note = body.note
    h.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(h)
    return h


@router.patch("/{highlight_id}/link-task", response_model=HighlightResponse)
def link_task(
    highlight_id: int,
    body: LinkTaskRequest,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    h = _own_highlight(highlight_id, current_user.id, db)
    h.task_id = body.task_id
    db.commit()
    db.refresh(h)
    return h


@router.delete("/{highlight_id}", status_code=204)
def delete_highlight(
    highlight_id: int,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    h = _own_highlight(highlight_id, current_user.id, db)
    db.delete(h)
    db.commit()
