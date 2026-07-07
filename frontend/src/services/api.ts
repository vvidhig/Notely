import axios from "axios";
import type {
  User, Session, SessionType, SessionMode, Note, NoteWithSuggestion,
  Tag, ConversationResult, NotionDatabase, NotionPage, ChatMessage,
  Task, Highlight, DashboardSummary, Quadrant, Meeting,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 60000, // conversation processing can take a while
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (email: string, password: string, name: string) =>
  api.post<{ access_token: string }>("/api/auth/register", { email, password, name });

export const login = (email: string, password: string) =>
  api.post<{ access_token: string }>("/api/auth/login", { email, password });

export const getMe = () => api.get<User>("/api/auth/me");

// Sessions
export const createSession = (
  title: string,
  session_type: SessionType = "custom",
  participants?: string,
  mode: SessionMode = "quick_notes",
  notion_database_id?: string,
) =>
  api.post<Session>("/api/sessions", { title, session_type, participants, mode, notion_database_id });

export const listSessions = () => api.get<Session[]>("/api/sessions");

export const getSession = (id: number) => api.get<Session>(`/api/sessions/${id}`);

export const endSession = (id: number) => api.put<Session>(`/api/sessions/${id}/end`);

export const switchMode = (id: number, mode: SessionMode) =>
  api.put<Session>(`/api/sessions/${id}/mode`, { mode });

export const deleteSession = (id: number) => api.delete(`/api/sessions/${id}`);

// Notes (Quick Notes mode)
export const addTextNote = (session_id: number, content: string, tag?: string) =>
  api.post<NoteWithSuggestion>("/api/notes/text", { session_id, content, tag });

export const addVoiceNote = (session_id: number, audioBlob: Blob, filename: string, tag?: string, duration_seconds?: number) => {
  const form = new FormData();
  form.append("session_id", String(session_id));
  form.append("audio", audioBlob, filename);
  if (tag) form.append("tag", tag);
  if (duration_seconds !== undefined) form.append("duration_seconds", String(duration_seconds));
  return api.post<NoteWithSuggestion>("/api/notes/voice", form);
};

export const getNotes = (session_id: number) => api.get<Note[]>(`/api/notes/${session_id}`);

export const updateNote = (id: number, content: string) =>
  api.patch<Note>(`/api/notes/${id}`, { content });

export const reformatNote = (id: number) =>
  api.post<Note>(`/api/notes/${id}/reformat`);

export const deleteNote = (id: number) => api.delete(`/api/notes/${id}`);

// Conversation (Record Conversation mode)
export const processConversation = (session_id: number, audioBlob: Blob, filename: string, audio_duration_seconds?: number) => {
  const form = new FormData();
  form.append("session_id", String(session_id));
  form.append("audio", audioBlob, filename);
  if (audio_duration_seconds !== undefined) form.append("audio_duration_seconds", String(audio_duration_seconds));
  return api.post<ConversationResult>("/api/conversation/process", form, { timeout: 120000 });
};

// AI
export const getSuggestion = (session_id: number) =>
  api.post<{ suggestion: string }>("/api/ai/suggest", { session_id });

export const summarizeSession = (session_id: number) =>
  api.post<{ summary: string }>(`/api/ai/summarize/${session_id}`);

export const chatAboutConversation = (
  session_id: number,
  conversation_text: string,
  question: string,
  history: ChatMessage[],
) =>
  api.post<{ answer: string }>("/api/ai/conversation-chat", {
    session_id, conversation_text, question, history,
  });

// Tags
export const getTags = (session_type: SessionType = "custom") =>
  api.get<Tag[]>(`/api/tags?session_type=${session_type}`);

export const createTag = (name: string, color: string, session_type: SessionType = "custom") =>
  api.post<Tag>("/api/tags", { name, color, session_type });

export const deleteTag = (id: number) => api.delete(`/api/tags/${id}`);

// Notion
export const getNotionAuthUrl = () => api.get<{ url: string }>("/api/notion/auth-url");

export const getNotionDatabases = () => api.get<NotionDatabase[]>("/api/notion/databases");

export const getNotionPages = (database_id: string) =>
  api.get<NotionPage[]>(`/api/notion/pages/${database_id}`);

export const syncToNotion = (session_id: number, database_id?: string) =>
  api.post<{ notion_page_id: string; notion_page_url: string }>(
    `/api/notion/sync/${session_id}`,
    database_id ? { database_id } : {},
  );

export const disconnectNotion = () => api.delete("/api/notion/disconnect");

// Tasks
export const createTask = (data: {
  title: string; description?: string; execution_steps?: string;
  quadrant?: Quadrant; due_date?: string; due_time?: string;
  reminder_minutes?: number | null; tags?: string; status?: string;
  source?: string; highlight_id?: number; session_id?: number;
}) => api.post<Task>("/api/tasks", data);

export const listTasks = (params?: { quadrant?: Quadrant; status?: string; due_date?: string }) =>
  api.get<Task[]>("/api/tasks", { params });

export const getTask = (id: number) => api.get<Task>(`/api/tasks/${id}`);

export const updateTask = (id: number, data: Partial<{
  title: string; description: string; execution_steps: string;
  quadrant: Quadrant; due_date: string; due_time: string;
  reminder_minutes: number | null; tags: string; status: string;
}>) => api.patch<Task>(`/api/tasks/${id}`, data);

export const completeTask = (id: number) => api.patch<Task>(`/api/tasks/${id}/complete`);

export const deleteTask = (id: number) => api.delete(`/api/tasks/${id}`);

export const getTodayTasks = () => api.get<Task[]>("/api/tasks/today");

export const getOverdueTasks = () => api.get<Task[]>("/api/tasks/overdue");

// Highlights
export const createHighlight = (data: {
  session_id: number; note_id: number; highlighted_text: string;
  start_offset: number; end_offset: number; color?: string;
}) => api.post<Highlight>("/api/highlights", data);

export const listHighlights = (params?: { session_id?: number; has_task?: boolean }) =>
  api.get<Highlight[]>("/api/highlights", { params });

export const getSessionHighlights = (session_id: number) =>
  api.get<Highlight[]>(`/api/highlights/session/${session_id}`);

export const linkTaskToHighlight = (highlight_id: number, task_id: number) =>
  api.patch<Highlight>(`/api/highlights/${highlight_id}/link-task`, { task_id });

export const updateHighlight = (id: number, data: { note?: string }) =>
  api.patch<Highlight>(`/api/highlights/${id}`, data);

export const deleteHighlight = (id: number) => api.delete(`/api/highlights/${id}`);

// Dashboard
export const getDashboardSummary = () => api.get<DashboardSummary>("/api/dashboard/summary");

// Meetings
export const listMeetings = () => api.get<Meeting[]>("/api/meetings");

export const createMeeting = (data: {
  title: string; date?: string; time?: string; end_time?: string; participants?: string; notes?: string;
}) => api.post<Meeting>("/api/meetings", data);

export const updateMeeting = (id: number, data: Partial<{
  title: string; date: string; time: string; end_time: string; participants: string; notes: string; status: string;
}>) => api.patch<Meeting>(`/api/meetings/${id}`, data);

export const deleteMeeting = (id: number) => api.delete(`/api/meetings/${id}`);

export const startMeeting = (id: number) =>
  api.post<{ session_id: number; meeting_id: number }>(`/api/meetings/${id}/start`);

export default api;
