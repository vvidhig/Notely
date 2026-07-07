from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Tag, User
from auth.utils import get_current_user
from tags.schemas import TagCreate, TagResponse

router = APIRouter(prefix="/api/tags", tags=["tags"])

DEFAULT_TAGS = {
    "tutoring": [
        ("Homework", "#3b82f6"), ("Struggled", "#ef4444"), ("Good At", "#10b981"),
        ("Important", "#f59e0b"), ("Next Time", "#8b5cf6"),
    ],
    "coaching": [
        ("Goal", "#06b6d4"), ("Progress", "#10b981"), ("Blocker", "#ef4444"),
        ("Action Item", "#eab308"), ("Follow Up", "#f97316"),
    ],
    "client_call": [
        ("Requirement", "#8b5cf6"), ("Decision", "#6366f1"), ("Question", "#ec4899"),
        ("Deliverable", "#14b8a6"), ("Deadline", "#f43f5e"),
    ],
    "meeting": [
        ("Decision", "#6366f1"), ("Action Item", "#eab308"), ("FYI", "#94a3b8"),
        ("Blocker", "#ef4444"), ("Follow Up", "#f97316"),
    ],
    "interview": [
        ("Strength", "#10b981"), ("Concern", "#ef4444"), ("Question", "#ec4899"),
        ("Follow Up", "#f97316"),
    ],
    "custom": [
        ("Important", "#f59e0b"), ("Action Item", "#eab308"), ("Question", "#ec4899"),
        ("Follow Up", "#f97316"),
    ],
}


@router.get("", response_model=list[TagResponse])
def list_tags(
    session_type: str = "custom",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Tag)
        .filter(Tag.user_id == current_user.id, Tag.session_type == session_type)
        .all()
    )
    if not existing:
        defaults = DEFAULT_TAGS.get(session_type, DEFAULT_TAGS["custom"])
        for name, color in defaults:
            db.add(Tag(
                user_id=current_user.id,
                name=name,
                color=color,
                session_type=session_type,
                is_default=True,
            ))
        db.commit()
        existing = (
            db.query(Tag)
            .filter(Tag.user_id == current_user.id, Tag.session_type == session_type)
            .all()
        )
    return existing


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(
    body: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tag = Tag(
        user_id=current_user.id,
        name=body.name,
        color=body.color,
        session_type=body.session_type,
        is_default=False,
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your tag")
    db.delete(tag)
    db.commit()
