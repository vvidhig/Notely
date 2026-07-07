import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NewSessionModal from "../components/NewSessionModal";
import { listSessions, deleteSession } from "../services/api";
import { useHighlights } from "../hooks/useHighlights";
import type { Session } from "../types";
import { SESSION_TYPES } from "../constants/sessionTypes";
import { Plus, Search, Trash2, ArrowRight, Play } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function minsToStr(totalMins: number): string {
  if (totalMins < 1) return "0m";
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60), m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDuration(started: string, ended?: string | null, durationSeconds?: number | null) {
  if (ended) {
    // completed: use wall-clock time
    const ms = new Date(ended).getTime() - new Date(started).getTime();
    return minsToStr(Math.round(ms / 60000));
  }
  // live: use actual recorded time only
  if (durationSeconds && durationSeconds > 0) {
    return minsToStr(Math.round(durationSeconds / 60));
  }
  return "0m";
}

function totalDuration(sessions: Session[]) {
  let totalSecs = 0;
  sessions.forEach((s) => {
    if (s.ended_at) {
      totalSecs += (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
    } else if (s.duration_seconds && s.duration_seconds > 0) {
      totalSecs += s.duration_seconds;
    }
  });
  return minsToStr(Math.round(totalSecs / 60));
}

function groupByDate(sessions: Session[]): { label: string; sessions: Session[] }[] {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const groups    = new Map<string, Session[]>();
  for (const s of sessions) {
    const date  = s.started_at.slice(0, 10);
    const label =
      date === today     ? "TODAY" :
      date === yesterday ? "YESTERDAY" :
      new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(s);
  }
  return [...groups.entries()].map(([label, sessions]) => ({ label, sessions }));
}

const TYPE_COLORS: Record<string, { bg: string; emoji: string }> = {
  custom:      { bg: "rgba(55,67,117,.12)",   emoji: "⚡" },
  meeting:     { bg: "rgba(186,189,226,.25)", emoji: "🗓️" },
  coaching:    { bg: "rgba(255,236,210,.70)", emoji: "🏋️" },
  tutoring:    { bg: "rgba(225,174,161,.30)", emoji: "📚" },
  interview:   { bg: "rgba(186,189,226,.35)", emoji: "🎙️" },
  client_call: { bg: "rgba(137,81,89,.12)",   emoji: "💼" },
};

function typeColor(type: string): { bg: string; emoji: string } {
  return TYPE_COLORS[type] ?? { bg: "rgba(55,67,117,.10)", emoji: "📋" };
}

/* ─── decorative waveform ─────────────────────────────────────────────── */

function Waveform({ isLive }: { isLive: boolean }) {
  const bars = [4, 8, 12, 6, 16, 10, 14, 8, 18, 12, 6, 14, 10, 16, 8, 12, 4, 10, 14, 8];
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" className="flex-shrink-0">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={(24 - h) / 2}
          width="2.5"
          height={h}
          rx="1.25"
          fill={isLive ? "rgba(137,81,89,.35)" : "rgba(55,67,117,.18)"}
        />
      ))}
    </svg>
  );
}

/* ─── page ────────────────────────────────────────────────────────────── */

export default function SessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newOpen, setNewOpen]       = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<string>("all");
  const [search, setSearch]         = useState("");
  const [preselectedType, setPreselectedType] = useState<string | null>(null);
  const { highlights, loadAll: loadHighlights } = useHighlights();

  const load = async () => {
    setLoading(true);
    try {
      const res = await listSessions();
      setSessions(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadHighlights();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = (s: Session) =>
    navigate(s.status === "active" ? `/session/${s.id}` : `/session/${s.id}/summary`);

  /* derived */
  const liveSessions = sessions.filter((s) => s.status === "active").length;

  const filtered = sessions.filter((s) => {
    const matchType   = activeType === "all" || s.session_type === activeType;
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const grouped = groupByDate(
    [...filtered].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  );

  const pageBg = {
    backgroundColor: "#FFFCF5",
    backgroundImage: "radial-gradient(rgba(55,67,117,.06) 1.5px, transparent 1.5px)",
    backgroundSize: "28px 28px",
  };

  return (
    <div className="flex h-[100dvh]" style={pageBg}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">

          {/* ── header ────────────────────────────────────────────── */}
          <div className="px-6 py-5 flex items-center justify-between mb-5">
            <div>
              <h1 className="font-['Yeseva_One'] text-2xl font-bold" style={{ color: "#374375" }}>
                Sessions
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(55,67,117,.55)" }}>
                {sessions.length} total · {liveSessions} live now
              </p>
            </div>
            <button
              onClick={() => { setPreselectedType(null); setNewOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: "#374375" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
            >
              <Plus size={16} /> New session
            </button>
          </div>

          {/* ── stat cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
            >
              <p className="text-xl font-bold" style={{ color: "#374375" }}>{totalDuration(sessions)}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.55)" }}>⏱ Total Time</p>
            </div>
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
            >
              <p className="text-xl font-bold" style={{ color: "#374375" }}>
                {sessions.reduce((s, n) => s + n.note_count, 0)}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.55)" }}>📝 Notes Captured</p>
            </div>
            <div
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
            >
              <p className="text-xl font-bold" style={{ color: "#374375" }}>{highlights.length}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.55)" }}>✦ Highlights</p>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  {liveSessions > 0 && (
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#895159" }} />
                  )}
                  <p className="text-xl font-bold" style={{ color: "#374375" }}>{liveSessions}</p>
                </div>
                <p className="text-xs font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.55)" }}>Live Now</p>
              </div>
            </div>
          </div>

          {/* ── quick start ───────────────────────────────────────── */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(55,67,117,.55)" }}>
              QUICK START
            </p>
            <div className="grid grid-cols-6 gap-2">
              {SESSION_TYPES.map((st) => {
                const tc = typeColor(st.value);
                const isSelected = preselectedType === st.value;
                return (
                  <button
                    key={st.value}
                    onClick={() => { setPreselectedType(st.value); setNewOpen(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all text-center"
                    style={{
                      backgroundColor: isSelected ? "rgba(55,67,117,.06)" : "#ffffff",
                      border: isSelected ? "1px solid rgba(55,67,117,.20)" : "1px solid rgba(55,67,117,.08)",
                      boxShadow: "0 2px 8px rgba(55,67,117,.05)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(55,67,117,.10)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(55,67,117,.05)"; }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: tc.bg }}
                    >
                      {tc.emoji}
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: "#374375" }}>{st.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── filter tabs + search ──────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveType("all")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeType === "all" ? "#374375" : "transparent",
                  color: activeType === "all" ? "#ffffff" : "rgba(55,67,117,.55)",
                }}
              >
                All
              </button>
              {SESSION_TYPES.map((st) => (
                <button
                  key={st.value}
                  onClick={() => setActiveType(st.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor: activeType === st.value ? "#374375" : "transparent",
                    color: activeType === st.value ? "#ffffff" : "rgba(55,67,117,.55)",
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(55,67,117,.40)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions…"
                className="pl-8 pr-3 py-1.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.10)", color: "#374375", width: "180px" }}
              />
            </div>
          </div>

          {/* ── session list ──────────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#374375", borderTopColor: "transparent" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl" style={{ backgroundColor: "rgba(55,67,117,.08)" }}>
                🎙️
              </div>
              <h3 className="font-['Yeseva_One'] text-2xl font-bold mb-2" style={{ color: "#374375" }}>
                No sessions yet
              </h3>
              <p className="text-sm font-medium mb-6" style={{ color: "rgba(55,67,117,.55)" }}>
                Start your first session to capture notes and conversations.
              </p>
              <button
                onClick={() => setNewOpen(true)}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ backgroundColor: "#374375" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
              >
                Start first session
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(({ label, sessions: groupSessions }) => (
                <div key={label}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
                    style={{ color: "rgba(55,67,117,.45)" }}
                  >
                    {label}
                  </p>
                  <div className="space-y-2">
                    {groupSessions.map((s) => {
                      const tc        = typeColor(s.session_type);
                      const isActive  = s.status === "active";
                      const typeLabel = SESSION_TYPES.find((x) => x.value === s.session_type)?.label ?? s.session_type;
                      const hCount    = highlights.filter((h) => h.session_id === s.id).length;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleClick(s)}
                          className="group flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all"
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(55,67,117,.08)",
                            boxShadow: "0 2px 8px rgba(55,67,117,.05)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(55,67,117,.10)";
                            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(55,67,117,.05)";
                            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                          }}
                        >
                          {/* icon */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: tc.bg }}
                          >
                            {tc.emoji}
                          </div>

                          {/* info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-sm truncate" style={{ color: "#374375" }}>
                                {s.title}
                              </p>
                              {isActive && (
                                <span
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                                  style={{ backgroundColor: "#895159" }}
                                >
                                  LIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(55,67,117,.55)" }}>
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: "rgba(55,67,117,.08)", color: "#374375" }}
                              >
                                {typeLabel}
                              </span>
                              <span>·</span>
                              <span>{s.note_count} notes</span>
                              {hCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span>{hCount} highlights</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* waveform */}
                          <Waveform isLive={isActive} />

                          {/* duration + date */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold" style={{ color: "#374375" }}>
                              {formatDuration(s.started_at, s.ended_at, s.duration_seconds)}
                            </p>
                            <p className="text-xs" style={{ color: "rgba(55,67,117,.55)" }}>
                              {new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>

                          {/* actions */}
                          <div className="flex gap-1 ml-1 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleClick(s); }}
                              className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              style={{ color: "rgba(55,67,117,.55)" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.08)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                            >
                              {isActive ? <Play size={14} /> : <ArrowRight size={14} />}
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, s.id)}
                              disabled={deletingId === s.id}
                              className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              style={{ color: "rgba(55,67,117,.55)" }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#895159"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(55,67,117,.55)"; }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {newOpen && <NewSessionModal onClose={() => { setNewOpen(false); setPreselectedType(null); }} />}
    </div>
  );
}
