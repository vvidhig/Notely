from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, func
from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    notion_access_token = Column(String, nullable=True)
    notion_workspace_name = Column(String, nullable=True)
    notion_workspace_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")
    session_type = Column(String, nullable=False, default="custom")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    notion_page_id = Column(String, nullable=True)
    notion_database_id = Column(String, nullable=True)
    status = Column(String, default="active")
    summary = Column(Text, nullable=True)
    note_count = Column(Integer, default=0)
    session_type = Column(String, nullable=False, default="custom")
    participants = Column(String, nullable=True)
    mode = Column(String, nullable=False, default="quick_notes")
    duration_seconds = Column(Integer, default=0, nullable=True)
    started_at = Column(DateTime, server_default=func.now())
    ended_at = Column(DateTime, nullable=True)


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String, nullable=False)  # voice | text | ai_suggestion | conversation_speaker | conversation_summary | conversation_evaluation
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True)  # kept for existing data, not used in new code
    tag = Column(String, nullable=True)  # tag name as plain text
    speaker = Column(String, nullable=True)  # participant name for conversation notes
    timestamp = Column(DateTime, server_default=func.now())
    is_edited = Column(Boolean, default=False, nullable=True)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quadrant = Column(String, nullable=False, default="neither")
    due_date = Column(String, nullable=True)  # ISO date string YYYY-MM-DD
    due_time = Column(String, nullable=True)  # HH:MM (24-hour)
    reminder_minutes = Column(Integer, nullable=True)  # 5 | 10 | 20 | 30 | 60
    execution_steps = Column(Text, nullable=True)  # how to execute (optional)
    tags = Column(String, nullable=True)  # comma-separated
    status = Column(String, default="active")  # active | completed | archived
    source = Column(String, default="manual")  # manual | from_highlight
    highlight_id = Column(Integer, nullable=True)  # set when created from a highlight
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)


class Highlight(Base):
    __tablename__ = "highlights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    highlighted_text = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=False)
    end_offset = Column(Integer, nullable=False)
    color = Column(String, default="yellow")
    task_id = Column(Integer, nullable=True)  # set after task created from this highlight
    note = Column(Text, nullable=True)         # user's personal note on this highlight
    updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    date = Column(String, nullable=True)        # YYYY-MM-DD
    time = Column(String, nullable=True)        # HH:MM 24-hour
    participants = Column(String, nullable=True)
    notes = Column(Text, nullable=True)         # pre-meeting details to remember
    end_time = Column(String, nullable=True)        # HH:MM 24-hour end time
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    status = Column(String, default="upcoming") # upcoming | in_progress | completed
    created_at = Column(DateTime, server_default=func.now())
