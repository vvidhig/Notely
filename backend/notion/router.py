import json
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database.connection import get_db
from database.models import User, Session as SessionModel, Note
from auth.utils import get_current_user
from notion.schemas import DatabaseItem, PageItem, SyncRequest, SyncResponse

router = APIRouter(prefix="/api/notion", tags=["notion"])

NOTION_API_BASE = "https://api.notion.com/v1"


def _notion_env() -> tuple[str, str, str]:
    client_id = os.getenv("NOTION_CLIENT_ID", "")
    client_secret = os.getenv("NOTION_CLIENT_SECRET", "")
    redirect_uri = os.getenv("NOTION_REDIRECT_URI", "http://localhost:8000/api/notion/callback")
    if not client_id or client_id == "your-notion-client-id":
        raise HTTPException(status_code=503, detail="Notion integration not configured")
    return client_id, client_secret, redirect_uri


@router.get("/auth-url")
def get_auth_url(current_user: User = Depends(get_current_user)):
    client_id, _, redirect_uri = _notion_env()
    # Encode the user's JWT as `state` so we can authenticate the callback redirect
    from auth.utils import create_access_token
    state = create_access_token(current_user.id)
    url = (
        f"https://api.notion.com/v1/oauth/authorize"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&owner=user"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
    )
    return {"url": url}


@router.get("/callback")
def notion_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
):
    # Authenticate via the state token set in auth-url
    JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    frontend_url = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    try:
        payload = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return RedirectResponse(url=f"{frontend_url}/dashboard?notion=error")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return RedirectResponse(url=f"{frontend_url}/dashboard?notion=error")

    _, client_secret, redirect_uri = _notion_env()
    client_id = os.getenv("NOTION_CLIENT_ID", "")
    with httpx.Client() as client:
        resp = client.post(
            "https://api.notion.com/v1/oauth/token",
            auth=(client_id, client_secret),
            json={"grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri},
        )
        resp.raise_for_status()
    data = resp.json()

    user.notion_access_token = data["access_token"]
    user.notion_workspace_name = data.get("workspace_name")
    user.notion_workspace_id = data.get("workspace_id")
    db.commit()

    return RedirectResponse(url=f"{frontend_url}/dashboard?notion=connected")


@router.get("/databases", response_model=list[DatabaseItem])
def get_databases(current_user: User = Depends(get_current_user)):
    _require_notion(current_user)
    from notion.client import list_databases
    try:
        return list_databases(current_user.notion_access_token)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {e.response.text}")


@router.get("/pages/{database_id}", response_model=list[PageItem])
def get_pages(
    database_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_notion(current_user)
    from notion.client import list_pages
    try:
        return list_pages(current_user.notion_access_token, database_id)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {e.response.text}")


@router.post("/sync/{session_id}", response_model=SyncResponse)
def sync_session(
    session_id: int,
    body: SyncRequest = SyncRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_notion(current_user)
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    database_id = body.database_id or session.notion_database_id
    if not database_id:
        raise HTTPException(status_code=400, detail="No Notion database specified")
    if not session.summary:
        raise HTTPException(status_code=400, detail="End the session first to generate a summary")

    # Collect conversation-specific data for richer Notion page
    notes = (
        db.query(Note)
        .filter(Note.session_id == session_id)
        .order_by(Note.timestamp)
        .all()
    )

    speaker_notes: list[dict] | None = None
    key_evaluations: list[str] | None = None

    if session.mode in ("conversation", "record_conversation"):
        speaker_notes = [
            {"speaker": n.speaker, "text": n.content}
            for n in notes
            if n.source == "conversation_speaker"
        ]
        eval_note = next((n for n in notes if n.source == "conversation_evaluation"), None)
        if eval_note:
            try:
                key_evaluations = json.loads(eval_note.content)
            except (json.JSONDecodeError, TypeError):
                pass

    # Calculate duration
    duration_minutes: int | None = None
    if session.started_at and session.ended_at:
        delta = session.ended_at - session.started_at
        duration_minutes = max(1, int(delta.total_seconds() / 60))

    from notion.client import create_session_page
    try:
        result = create_session_page(
            token=current_user.notion_access_token,
            database_id=database_id,
            title=session.title,
            session_type=session.session_type or "custom",
            participants=session.participants,
            started_at=session.started_at,
            duration_minutes=duration_minutes,
            mode=session.mode or "quick_notes",
            summary=session.summary,
            speaker_notes=speaker_notes,
            key_evaluations=key_evaluations,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Notion API error: {e.response.text}")

    session.notion_page_id = result["id"]
    if body.database_id:
        session.notion_database_id = body.database_id
    db.commit()
    return SyncResponse(notion_page_id=result["id"], notion_page_url=result["url"])


@router.delete("/disconnect", status_code=204)
def disconnect_notion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.notion_access_token = None
    current_user.notion_workspace_name = None
    current_user.notion_workspace_id = None
    db.commit()


def _require_notion(user: User):
    if not user.notion_access_token:
        raise HTTPException(status_code=400, detail="Notion not connected")
