from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DbSession

from auth.utils import get_current_user
from database.connection import get_db
from database.models import Session as SessionModel, Task, Highlight
from dashboard.schemas import DashboardSummary, CalendarDot, RecentSession, UpcomingTask

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    current_user=Depends(get_current_user),
    db: DbSession = Depends(get_db),
):
    today = date.today()
    today_str = today.isoformat()

    # Tasks due today
    tasks_due_today = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.due_date == today_str,
            Task.status == "active",
        )
        .count()
    )

    # Sessions this week (Mon–Sun)
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=7)
    sessions_this_week = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == current_user.id,
            SessionModel.started_at >= datetime.combine(week_start, datetime.min.time()),
            SessionModel.started_at < datetime.combine(week_end, datetime.min.time()),
        )
        .count()
    )

    # Highlights without tasks
    try:
        highlights_without_tasks = (
            db.query(Highlight)
            .join(SessionModel, Highlight.session_id == SessionModel.id)
            .filter(
                SessionModel.user_id == current_user.id,
                Highlight.task_id.is_(None),
            )
            .count()
        )
    except Exception:
        highlights_without_tasks = 0

    # Recent sessions (last 3)
    recent_sessions_raw = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.started_at.desc())
        .limit(3)
        .all()
    )
    recent_sessions = [
        RecentSession(
            id=s.id,
            title=s.title,
            session_type=s.session_type or "custom",
            status=s.status or "active",
            mode=s.mode or "quick_notes",
            note_count=s.note_count or 0,
            started_at=s.started_at,
            ended_at=s.ended_at,
        )
        for s in recent_sessions_raw
    ]

    # Upcoming tasks (next 5 with due dates, active only)
    upcoming_tasks_raw = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.status == "active",
            Task.due_date.isnot(None),
            Task.due_date >= today_str,
        )
        .order_by(Task.due_date.asc())
        .limit(5)
        .all()
    )
    upcoming_tasks = [
        UpcomingTask(
            id=t.id,
            title=t.title,
            quadrant=t.quadrant,
            due_date=t.due_date,
            status=t.status,
            tags=t.tags,
        )
        for t in upcoming_tasks_raw
    ]

    # Calendar dots — tasks and sessions for the current month ± 1 month buffer
    month_start = today.replace(day=1)
    # Cover 3 months for calendar navigation
    range_start = (month_start - timedelta(days=32)).replace(day=1)
    range_end = (month_start + timedelta(days=62)).replace(day=1)
    range_start_str = range_start.isoformat()
    range_end_str = range_end.isoformat()

    # Tasks in range
    tasks_in_range = (
        db.query(Task.due_date)
        .filter(
            Task.user_id == current_user.id,
            Task.due_date.isnot(None),
            Task.due_date >= range_start_str,
            Task.due_date < range_end_str,
            Task.status == "active",
        )
        .all()
    )
    task_dates = {row[0] for row in tasks_in_range}

    # Sessions in range
    sessions_in_range = (
        db.query(SessionModel.started_at)
        .filter(
            SessionModel.user_id == current_user.id,
            SessionModel.started_at >= datetime.combine(range_start, datetime.min.time()),
            SessionModel.started_at < datetime.combine(range_end, datetime.min.time()),
        )
        .all()
    )
    session_dates = {row[0].date().isoformat() for row in sessions_in_range}

    all_dot_dates = task_dates | session_dates
    calendar_dots = [
        CalendarDot(
            date=d,
            has_task=(d in task_dates),
            has_session=(d in session_dates),
        )
        for d in sorted(all_dot_dates)
    ]

    return DashboardSummary(
        tasks_due_today=tasks_due_today,
        sessions_this_week=sessions_this_week,
        highlights_without_tasks=highlights_without_tasks,
        recent_sessions=recent_sessions,
        upcoming_tasks=upcoming_tasks,
        calendar_dots=calendar_dots,
    )
