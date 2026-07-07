from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from auth.utils import get_current_user
from database.connection import get_db
from database.models import Meeting, Session as SessionModel
from meetings.schemas import MeetingCreate, MeetingUpdate, MeetingResponse

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _own(mid: int, uid: int, db: DbSession) -> Meeting:
    m = db.query(Meeting).filter(Meeting.id == mid, Meeting.user_id == uid).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return m


@router.get("", response_model=list[MeetingResponse])
def list_meetings(current_user=Depends(get_current_user), db: DbSession = Depends(get_db)):
    return (
        db.query(Meeting)
        .filter(Meeting.user_id == current_user.id)
        .order_by(Meeting.date.asc(), Meeting.time.asc())
        .all()
    )


@router.post("", response_model=MeetingResponse, status_code=201)
def create_meeting(data: MeetingCreate, current_user=Depends(get_current_user), db: DbSession = Depends(get_db)):
    m = Meeting(user_id=current_user.id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.patch("/{mid}", response_model=MeetingResponse)
def update_meeting(mid: int, data: MeetingUpdate, current_user=Depends(get_current_user), db: DbSession = Depends(get_db)):
    m = _own(mid, current_user.id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{mid}", status_code=204)
def delete_meeting(mid: int, current_user=Depends(get_current_user), db: DbSession = Depends(get_db)):
    m = _own(mid, current_user.id, db)
    db.delete(m)
    db.commit()


@router.post("/{mid}/start")
def start_meeting(mid: int, current_user=Depends(get_current_user), db: DbSession = Depends(get_db)):
    m = _own(mid, current_user.id, db)
    if m.session_id:
        return {"session_id": m.session_id, "meeting_id": m.id}
    session = SessionModel(
        user_id=current_user.id,
        title=m.title,
        session_type="meeting",
        participants=m.participants,
        mode="record_conversation",
        status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    m.session_id = session.id
    m.status = "in_progress"
    db.commit()
    return {"session_id": session.id, "meeting_id": m.id}
