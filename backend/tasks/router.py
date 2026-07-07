from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DbSession

from auth.utils import get_current_user
from database.connection import get_db
from database.models import Task
from tasks.schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

VALID_QUADRANTS = {"urgent_important", "important_not_urgent", "urgent_not_important", "neither"}
VALID_STATUSES = {"active", "in_progress", "completed", "archived"}


def _own_task(task_id: int, user_id: int, db: DbSession) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ── Static sub-routes MUST come before /{id} ──────────────────────────────────

@router.get("/today", response_model=list[TaskResponse])
def get_today_tasks(
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    today = date.today().isoformat()
    return (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.due_date == today,
            Task.status == "active",
        )
        .order_by(Task.created_at.asc())
        .all()
    )


@router.get("/overdue", response_model=list[TaskResponse])
def get_overdue_tasks(
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    today = date.today().isoformat()
    return (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.due_date < today,
            Task.due_date.isnot(None),
            Task.status == "active",
        )
        .order_by(Task.due_date.asc())
        .all()
    )


# ── Collection routes ─────────────────────────────────────────────────────────

@router.post("", response_model=TaskResponse, status_code=201)
def create_task(
    body: TaskCreate,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    if body.quadrant not in VALID_QUADRANTS:
        raise HTTPException(status_code=422, detail=f"quadrant must be one of {VALID_QUADRANTS}")
    task = Task(
        user_id=current_user.id,
        title=body.title.strip(),
        description=body.description,
        execution_steps=body.execution_steps,
        quadrant=body.quadrant,
        due_date=body.due_date,
        due_time=body.due_time,
        reminder_minutes=body.reminder_minutes,
        tags=body.tags,
        status=body.status if body.status in VALID_STATUSES else "active",
        source=body.source,
        highlight_id=body.highlight_id,
        session_id=body.session_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    quadrant: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    due_date: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    q = db.query(Task).filter(Task.user_id == current_user.id)
    if quadrant:
        q = q.filter(Task.quadrant == quadrant)
    if status:
        q = q.filter(Task.status == status)
    if due_date:
        q = q.filter(Task.due_date == due_date)
    return q.order_by(Task.created_at.desc()).all()


# ── Item routes ───────────────────────────────────────────────────────────────

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    return _own_task(task_id, current_user.id, db)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    body: TaskUpdate,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    task = _own_task(task_id, current_user.id, db)
    if body.title is not None:
        task.title = body.title.strip()
    if body.description is not None:
        task.description = body.description
    if body.execution_steps is not None:
        task.execution_steps = body.execution_steps
    if body.quadrant is not None:
        if body.quadrant not in VALID_QUADRANTS:
            raise HTTPException(status_code=422, detail=f"quadrant must be one of {VALID_QUADRANTS}")
        task.quadrant = body.quadrant
    if body.due_date is not None:
        task.due_date = body.due_date or None
    if body.due_time is not None:
        task.due_time = body.due_time or None
    if body.reminder_minutes is not None:
        task.reminder_minutes = body.reminder_minutes
    if body.tags is not None:
        task.tags = body.tags
    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
        task.status = body.status
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    task = _own_task(task_id, current_user.id, db)
    if task.status == "completed":
        # Toggle back to active
        task.status = "active"
        task.completed_at = None
    else:
        task.status = "completed"
        task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    task = _own_task(task_id, current_user.id, db)
    db.delete(task)
    db.commit()
