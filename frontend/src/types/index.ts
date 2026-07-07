export type SessionType = "tutoring" | "coaching" | "client_call" | "meeting" | "interview" | "custom";
export type SessionMode = "quick_notes" | "record_conversation";
export type NoteSource = "voice" | "text" | "ai_suggestion" | "conversation_speaker" | "conversation_summary" | "conversation_evaluation";
export type Quadrant = "urgent_important" | "important_not_urgent" | "urgent_not_important" | "neither";
export type TaskStatus = "active" | "in_progress" | "completed" | "archived";
export type TaskSource = "manual" | "from_highlight";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  notion_workspace_name: string | null;
  notion_workspace_id: string | null;
  notion_connected: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  session_type: SessionType;
  is_default: boolean;
}

export interface Session {
  id: number;
  title: string;
  session_type: SessionType;
  participants: string | null;
  mode: SessionMode;
  notion_page_id: string | null;
  notion_database_id: string | null;
  status: "active" | "completed";
  summary: string | null;
  note_count: number;
  duration_seconds?: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface Note {
  id: number;
  session_id: number;
  content: string;
  source: NoteSource;
  tag: string | null;
  speaker: string | null;
  timestamp: string;
  is_edited?: boolean;
}

export interface NoteWithSuggestion {
  note: Note;
  suggestion: Note | null;
}

export interface ConversationResult {
  notes: Note[];
  duration_seconds: number;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  execution_steps?: string | null;
  quadrant: Quadrant;
  due_date?: string | null;
  due_time?: string | null;
  reminder_minutes?: number | null;
  tags?: string | null;
  status: TaskStatus;
  source: TaskSource;
  highlight_id?: number | null;
  session_id?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface Highlight {
  id: number;
  session_id: number;
  note_id: number;
  highlighted_text: string;
  start_offset: number;
  end_offset: number;
  color: string;
  task_id?: number | null;
  note?: string | null;
  updated_at?: string | null;
  created_at: string;
}

export interface CalendarDot {
  date: string;
  has_task: boolean;
  has_session: boolean;
}

export interface RecentSession {
  id: number;
  title: string;
  session_type: string;
  status: string;
  mode: string;
  note_count: number;
  started_at: string;
  ended_at?: string | null;
}

export interface UpcomingTask {
  id: number;
  title: string;
  quadrant: Quadrant;
  due_date?: string | null;
  status: string;
  tags?: string | null;
}

export interface DashboardSummary {
  tasks_due_today: number;
  sessions_this_week: number;
  highlights_without_tasks: number;
  recent_sessions: RecentSession[];
  upcoming_tasks: UpcomingTask[];
  calendar_dots: CalendarDot[];
}

export interface Meeting {
  id: number;
  user_id: number;
  title: string;
  date?: string | null;
  time?: string | null;
  end_time?: string | null;
  participants?: string | null;
  notes?: string | null;
  session_id?: number | null;
  status: "upcoming" | "in_progress" | "completed";
  created_at: string;
}
