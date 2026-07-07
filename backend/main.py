from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from database.connection import engine
from database.models import Base

from auth.router import router as auth_router
from sessions.router import router as sessions_router
from notes.router import router as notes_router
from notion.router import router as notion_router
from ai.router import router as ai_router
from tags.router import router as tags_router
from conversation.router import router as conversation_router
from tasks.router import router as tasks_router
from dashboard.router import router as dashboard_router
from highlights.router import router as highlights_router
from meetings.router import router as meetings_router

Base.metadata.create_all(bind=engine)

from sqlalchemy import text

def run_migrations():
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE notes ADD COLUMN tag_id INTEGER REFERENCES tags(id)",
            "ALTER TABLE sessions ADD COLUMN note_count INTEGER DEFAULT 0",
            "ALTER TABLE sessions ADD COLUMN session_type TEXT DEFAULT 'custom'",
            "ALTER TABLE sessions ADD COLUMN participants TEXT",
            "ALTER TABLE sessions ADD COLUMN mode TEXT DEFAULT 'quick_notes'",
            "ALTER TABLE notes ADD COLUMN speaker TEXT",
            "ALTER TABLE notes ADD COLUMN tag TEXT",
            "ALTER TABLE tags ADD COLUMN session_type TEXT DEFAULT 'custom'",
            "ALTER TABLE tags ADD COLUMN is_default BOOLEAN DEFAULT 0",
            # Phase 7: tasks table
            """CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title TEXT NOT NULL,
                description TEXT,
                quadrant TEXT NOT NULL DEFAULT 'neither',
                due_date TEXT,
                tags TEXT,
                status TEXT DEFAULT 'active',
                source TEXT DEFAULT 'manual',
                highlight_id INTEGER,
                session_id INTEGER REFERENCES sessions(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )""",
            # Phase 7b: task scheduling fields
            "ALTER TABLE tasks ADD COLUMN due_time TEXT",
            "ALTER TABLE tasks ADD COLUMN reminder_minutes INTEGER",
            "ALTER TABLE tasks ADD COLUMN execution_steps TEXT",
            # Phase 8: highlights table
            """CREATE TABLE IF NOT EXISTS highlights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL REFERENCES sessions(id),
                note_id INTEGER NOT NULL REFERENCES notes(id),
                highlighted_text TEXT NOT NULL,
                start_offset INTEGER NOT NULL,
                end_offset INTEGER NOT NULL,
                color TEXT DEFAULT 'yellow',
                task_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title TEXT NOT NULL,
                date TEXT,
                time TEXT,
                participants TEXT,
                notes TEXT,
                session_id INTEGER REFERENCES sessions(id),
                status TEXT DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            # Feature: editable transcriptions
            "ALTER TABLE notes ADD COLUMN is_edited BOOLEAN DEFAULT 0",
            # Feature: highlight side notes
            "ALTER TABLE highlights ADD COLUMN note TEXT",
            "ALTER TABLE highlights ADD COLUMN updated_at TIMESTAMP",
            # Meeting end time
            "ALTER TABLE meetings ADD COLUMN end_time TEXT",
            # Session actual recording duration
            "ALTER TABLE sessions ADD COLUMN duration_seconds INTEGER DEFAULT 0",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # column already exists

run_migrations()

app = FastAPI(title="Notely API", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(notes_router)
app.include_router(notion_router)
app.include_router(ai_router)
app.include_router(tags_router)
app.include_router(conversation_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)
app.include_router(highlights_router)
app.include_router(meetings_router)


@app.get("/")
def root():
    return {"status": "ok", "app": "Notely API"}
