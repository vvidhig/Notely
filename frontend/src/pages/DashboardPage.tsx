import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listSessions, deleteSession, getNotionAuthUrl, disconnectNotion, getNotionDatabases,
} from "../services/api";
import type { Session, SessionType, SessionMode, NotionDatabase } from "../types";
import { SESSION_TYPES } from "../constants/sessionTypes";
import {
  Plus, Trash2, BookOpen, ExternalLink, Link, Link2Off, LogOut, Clock, Mic, MessageSquare,
} from "lucide-react";

// Pastel per session type — sticky note colors
const TYPE_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  tutoring:    { bg: "bg-[#FCEEE5]", border: "border-[#B8D4E4]/60", badge: "bg-[#B8D4E4] text-[#2D4B6E]" },
  coaching:    { bg: "bg-[#FCE4E6]", border: "border-[#F7C4B4]/60", badge: "bg-[#F7C4B4] text-[#3D4A28]" },
  client_call: { bg: "bg-[#D6E9F2]", border: "border-[#9BC3D8]/60", badge: "bg-[#9BC3D8] text-[#2D4B6E]" },
  meeting:     { bg: "bg-[#FCE4E6]", border: "border-[#F7C4B4]/60", badge: "bg-[#F7C4B4] text-[#B02233]" },
  interview:   { bg: "bg-[#ECCCA6]", border: "border-[#B8D4E4]/60", badge: "bg-[#B8D4E4] text-[#7A5A28]" },
  custom:      { bg: "bg-white",     border: "border-[#B8D4E4]",    badge: "bg-[#DEC88A] text-[#4A7A92]" },
};

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("custom");
  const [participants, setParticipants] = useState("");
  const [mode, setMode] = useState<SessionMode>("quick_notes");
  const [notionDbs, setNotionDbs] = useState<NotionDatabase[]>([]);
  const [selectedDbId, setSelectedDbId] = useState("");
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    listSessions()
      .then((r) => setSessions(r.data))
      .catch(() => setLoadError("Could not load sessions — is the backend running?"))
      .finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get("notion") === "connected") {
      refreshUser();
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  useEffect(() => {
    if (showModal && user?.notion_connected) {
      setLoadingDbs(true);
      getNotionDatabases()
        .then((r) => { setNotionDbs(r.data); if (r.data.length > 0) setSelectedDbId(r.data[0].id); })
        .catch(() => setNotionDbs([]))
        .finally(() => setLoadingDbs(false));
    }
    if (!showModal) {
      setTitle(""); setSessionType("custom"); setParticipants("");
      setMode("quick_notes"); setNotionDbs([]); setSelectedDbId("");
    }
  }, [showModal, user?.notion_connected]);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setStarting(true);
    navigate("/session/new", {
      state: {
        title: title.trim(), session_type: sessionType,
        participants: participants.trim() || undefined,
        mode, notion_database_id: selectedDbId || undefined,
      },
    });
  };

  const handleDelete = async (id: number) => {
    setSessions((s) => s.filter((x) => x.id !== id));
    try { await deleteSession(id); }
    catch { setSessions((s) => s); showToast("Could not delete session — try again."); }
  };

  const handleConnectNotion = async () => {
    try {
      const res = await getNotionAuthUrl();
      window.location.href = res.data.url;
    } catch {
      showToast("Notion integration not configured — add NOTION_CLIENT_ID to backend/.env");
    }
  };

  const formatDuration = (s: Session) => {
    if (!s.ended_at) return "In progress";
    const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
    const mins = Math.floor(ms / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const typeConfig = (t: SessionType) => SESSION_TYPES.find((x) => x.value === t);

  return (
    <div className="min-h-screen bg-[#ECCCA6] text-[#1E3550]">
      {/* Navbar */}
      <nav className="border-b border-[#B8D4E4] px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <BookOpen className="text-[#47748B]" size={20} />
          <span className="font-['Yeseva_One'] text-2xl font-bold text-[#1E3550]">Notely</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#4A7A92] text-sm font-semibold">{user?.name}</span>

          {user?.notion_connected ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#47748B]">
                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                {user.notion_workspace_name}
              </div>
              <button
                onClick={async () => { await disconnectNotion(); refreshUser(); }}
                className="text-sm text-[#6B9DB5] hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
              >
                <Link2Off size={14} /> Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectNotion}
              className="flex items-center gap-1.5 text-sm bg-[#DEC88A] hover:bg-[#B8D4E4] text-[#2D4B6E] px-3 py-1.5 rounded-full transition-colors font-semibold border border-[#B8D4E4]"
            >
              <Link size={14} /> Connect Notion
            </button>
          )}

          <button onClick={logout} className="text-[#6B9DB5] hover:text-[#2D4B6E] transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-['Yeseva_One'] text-4xl font-bold text-[#1E3550]">My Sessions</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#47748B] hover:bg-[#27456C] text-white px-5 py-2.5 rounded-full font-bold transition-colors shadow-sm"
          >
            <Plus size={18} /> New Session
          </button>
        </div>

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-2xl mb-4 font-medium">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-[#B8D4E4] rounded-2xl px-5 py-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 bg-[#DEC88A] rounded-full w-40" />
                  <div className="h-4 bg-[#DEC88A] rounded-full w-16" />
                </div>
                <div className="h-3 bg-[#DEC88A] rounded-full w-24" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📓</div>
            <p className="font-['Yeseva_One'] text-2xl text-[#4A7A92] mb-2">No sessions yet</p>
            <p className="text-sm text-[#6B9DB5] font-medium">Start a new session to begin capturing conversations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const tc = typeConfig(s.session_type ?? "custom");
              const colors = TYPE_COLORS[s.session_type ?? "custom"] ?? TYPE_COLORS.custom;
              return (
                <div
                  key={s.id}
                  className={`${colors.bg} border ${colors.border} rounded-2xl px-5 py-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer shadow-sm`}
                  onClick={() => navigate(s.status === "active" ? `/session/${s.id}` : `/session/${s.id}/summary`)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-bold text-[#1E3550]">{s.title}</span>
                      {tc && (
                        <span className={`text-xs ${colors.badge} px-2 py-0.5 rounded-full font-semibold flex-shrink-0`}>
                          {tc.emoji} {tc.label}
                        </span>
                      )}
                      {s.status === "active" && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          ● Active
                        </span>
                      )}
                      {s.mode === "record_conversation" && (
                        <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          🎙️ Conversation
                        </span>
                      )}
                      {s.notion_page_id && <ExternalLink size={12} className="text-[#47748B] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#4A7A92] font-semibold flex-wrap">
                      <span>{new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(s)}</span>
                      {s.note_count > 0 && <span>{s.note_count} notes</span>}
                      {s.participants && <span>👥 {s.participants}</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="text-[#8ABDD4] hover:text-red-400 transition-colors p-2 ml-3 flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E3550] text-white text-sm px-5 py-2.5 rounded-full shadow-xl z-50 whitespace-nowrap font-semibold">
          {toast}
        </div>
      )}

      {/* New Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-[#B8D4E4] shadow-[0_8px_40px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto">
            <h2 className="font-['Yeseva_One'] text-3xl font-bold text-[#1E3550] mb-5">Start New Session</h2>

            <form onSubmit={handleStartSession} className="space-y-5">
              {/* Title */}
              <div>
                <label className="text-sm font-bold text-[#4A7A92] mb-1.5 block">Session title</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Riya — Maths Session"
                  className="w-full bg-[#ECCCA6] text-[#1E3550] rounded-xl px-4 py-2.5 border border-[#B8D4E4] focus:outline-none focus:border-[#47748B] focus:ring-2 focus:ring-[#47748B]/10 font-medium transition-all"
                  required
                />
              </div>

              {/* Session type */}
              <div>
                <label className="text-sm font-bold text-[#4A7A92] mb-2 block">Session type</label>
                <div className="grid grid-cols-3 gap-2">
                  {SESSION_TYPES.map((t) => {
                    const colors = TYPE_COLORS[t.value] ?? TYPE_COLORS.custom;
                    const selected = sessionType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setSessionType(t.value)}
                        className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                          selected
                            ? `${colors.bg} ${colors.border} shadow-sm ring-2 ring-[#47748B]/20`
                            : "border-[#B8D4E4] bg-[#ECCCA6] hover:bg-[#DEC88A]"
                        }`}
                      >
                        <div className="text-lg mb-0.5">{t.emoji}</div>
                        <div className="text-xs font-bold text-[#2D4B6E]">{t.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="text-sm font-bold text-[#4A7A92] mb-1.5 block">
                  Participants <span className="text-[#6B9DB5] font-medium">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="e.g. Vidhi, Riya"
                  className="w-full bg-[#ECCCA6] text-[#1E3550] rounded-xl px-4 py-2.5 border border-[#B8D4E4] focus:outline-none focus:border-[#47748B] focus:ring-2 focus:ring-[#47748B]/10 font-medium transition-all"
                />
              </div>

              {/* Mode */}
              <div>
                <label className="text-sm font-bold text-[#4A7A92] mb-2 block">Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("quick_notes")}
                    className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                      mode === "quick_notes"
                        ? "border-[#47748B]/40 bg-[#FCE4E6] ring-2 ring-[#47748B]/20"
                        : "border-[#B8D4E4] bg-[#ECCCA6] hover:bg-[#DEC88A]"
                    }`}
                  >
                    <Mic size={16} className="text-[#47748B]" />
                    <div className="text-left">
                      <div className="text-sm font-bold text-[#2D4B6E]">Quick Notes</div>
                      <div className="text-xs text-[#4A7A92] font-medium">Short clips + text</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("record_conversation")}
                    className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                      mode === "record_conversation"
                        ? "border-violet-400/40 bg-[#FCE4E6] ring-2 ring-violet-400/20"
                        : "border-[#B8D4E4] bg-[#ECCCA6] hover:bg-[#DEC88A]"
                    }`}
                  >
                    <MessageSquare size={16} className="text-violet-600" />
                    <div className="text-left">
                      <div className="text-sm font-bold text-[#2D4B6E]">Conversation</div>
                      <div className="text-xs text-[#4A7A92] font-medium">Record full audio</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notion database */}
              {user?.notion_connected && (
                <div>
                  <label className="text-sm font-bold text-[#4A7A92] mb-1.5 block">Notion database <span className="text-[#6B9DB5] font-medium">(optional)</span></label>
                  {loadingDbs ? (
                    <p className="text-xs text-[#6B9DB5] py-1 font-medium">Loading databases…</p>
                  ) : notionDbs.length > 0 ? (
                    <select
                      value={selectedDbId}
                      onChange={(e) => setSelectedDbId(e.target.value)}
                      className="w-full bg-[#ECCCA6] text-[#1E3550] rounded-xl px-3 py-2.5 border border-[#B8D4E4] focus:outline-none focus:border-[#47748B] text-sm font-medium"
                    >
                      <option value="">No sync</option>
                      {notionDbs.map((db) => <option key={db.id} value={db.id}>{db.title}</option>)}
                    </select>
                  ) : (
                    <p className="text-xs text-[#6B9DB5] py-1 font-medium">No databases found in your workspace.</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-[#DEC88A] hover:bg-[#B8D4E4] py-2.5 rounded-xl transition-colors text-sm font-bold text-[#2D4B6E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={starting || !title.trim()}
                  className="flex-1 bg-[#47748B] hover:bg-[#27456C] disabled:opacity-50 py-2.5 rounded-xl font-bold transition-colors text-sm text-white shadow-sm"
                >
                  {starting ? "Starting…" : "Start Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
