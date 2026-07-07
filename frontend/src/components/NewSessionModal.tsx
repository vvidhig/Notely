import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotionDatabases } from "../services/api";
import type { SessionType, SessionMode, NotionDatabase } from "../types";
import { SESSION_TYPES } from "../constants/sessionTypes";
import { Mic, MessageSquare, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

const INPUT_STYLE: React.CSSProperties = {
  background: "#F8FAFC",
  border: "1px solid rgba(55,67,117,.12)",
  borderRadius: "14px",
  color: "#374375",
  fontFamily: "Quicksand, sans-serif",
  fontSize: "0.875rem",
  fontWeight: 500,
  width: "100%",
  padding: "10px 14px",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#374375";
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(55,67,117,.12)";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(55,67,117,.12)";
  e.currentTarget.style.boxShadow   = "none";
}

export default function NewSessionModal({ onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle]           = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("custom");
  const [participants, setParticipants] = useState("");
  const [mode, setMode]             = useState<SessionMode>("quick_notes");
  const [notionDbs, setNotionDbs]   = useState<NotionDatabase[]>([]);
  const [selectedDbId, setSelectedDbId] = useState("");
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [starting, setStarting]     = useState(false);

  useEffect(() => {
    if (user?.notion_connected) {
      setLoadingDbs(true);
      getNotionDatabases()
        .then((r) => { setNotionDbs(r.data); if (r.data.length > 0) setSelectedDbId(r.data[0].id); })
        .catch(() => setNotionDbs([]))
        .finally(() => setLoadingDbs(false));
    }
  }, [user?.notion_connected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setStarting(true);
    navigate("/session/new", {
      state: {
        title: title.trim(),
        session_type: sessionType,
        participants: participants.trim() || undefined,
        mode,
        notion_database_id: selectedDbId || undefined,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(55,67,117,.25)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "#ffffff",
          borderRadius: "28px",
          border: "1px solid rgba(55,67,117,.08)",
          boxShadow: "0 24px 64px rgba(55,67,117,.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(55,67,117,.06)" }}
        >
          <h2 className="font-['Yeseva_One'] text-3xl font-bold" style={{ color: "#374375" }}>
            Start New Session
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(55,67,117,.08)", color: "rgba(55,67,117,.55)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(55,67,117,.55)" }}>
              Session title
            </label>
            <input
              autoFocus type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Riya — Maths Session"
              style={INPUT_STYLE}
              onFocus={focusStyle} onBlur={blurStyle}
              required
            />
          </div>

          {/* Session type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "rgba(55,67,117,.55)" }}>
              Session type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_TYPES.map((t) => {
                const selected = sessionType === t.value;
                return (
                  <button
                    key={t.value} type="button"
                    onClick={() => setSessionType(t.value)}
                    className="px-3 py-2.5 text-left transition-all"
                    style={{
                      background: selected ? "rgba(55,67,117,.08)" : "#F8FAFC",
                      border: selected ? "2px solid #374375" : "1px solid rgba(55,67,117,.08)",
                      borderRadius: "14px",
                      boxShadow: selected ? "0 0 0 3px rgba(55,67,117,.10)" : "none",
                    }}
                  >
                    <div className="text-lg mb-0.5">{t.emoji}</div>
                    <div className="text-xs font-bold" style={{ color: selected ? "#374375" : "rgba(55,67,117,.55)" }}>
                      {t.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(55,67,117,.55)" }}>
              Participants <span className="font-medium normal-case tracking-normal">comma-separated, optional</span>
            </label>
            <input
              type="text" value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="e.g. Vidhi, Riya"
              style={INPUT_STYLE}
              onFocus={focusStyle} onBlur={blurStyle}
            />
          </div>

          {/* Mode */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "rgba(55,67,117,.55)" }}>
              Recording mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button" onClick={() => setMode("quick_notes")}
                className="px-4 py-3 flex items-center gap-2.5 transition-all"
                style={{
                  background: mode === "quick_notes" ? "rgba(55,67,117,.05)" : "#F8FAFC",
                  border: mode === "quick_notes" ? "2px solid #374375" : "1px solid rgba(55,67,117,.08)",
                  borderRadius: "14px",
                }}
              >
                <Mic size={16} style={{ color: "#374375" }} />
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: "#374375" }}>Quick Notes</div>
                  <div className="text-[10px] font-medium" style={{ color: "rgba(55,67,117,.55)" }}>Short clips + text</div>
                </div>
              </button>
              <button
                type="button" onClick={() => setMode("record_conversation")}
                className="px-4 py-3 flex items-center gap-2.5 transition-all"
                style={{
                  background: mode === "record_conversation" ? "rgba(55,67,117,.05)" : "#F8FAFC",
                  border: mode === "record_conversation" ? "2px solid #374375" : "1px solid rgba(55,67,117,.08)",
                  borderRadius: "14px",
                }}
              >
                <MessageSquare size={16} style={{ color: "#895159" }} />
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: "#374375" }}>Conversation</div>
                  <div className="text-[10px] font-medium" style={{ color: "rgba(55,67,117,.55)" }}>Full audio recording</div>
                </div>
              </button>
            </div>
          </div>

          {/* Notion */}
          {user?.notion_connected && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(55,67,117,.55)" }}>
                Notion database <span className="font-medium normal-case tracking-normal">optional</span>
              </label>
              {loadingDbs ? (
                <p className="text-xs font-medium py-1" style={{ color: "rgba(55,67,117,.55)" }}>Loading databases…</p>
              ) : notionDbs.length > 0 ? (
                <select
                  value={selectedDbId} onChange={(e) => setSelectedDbId(e.target.value)}
                  style={INPUT_STYLE}
                  onFocus={focusStyle} onBlur={blurStyle}
                >
                  <option value="">No sync</option>
                  {notionDbs.map((db) => <option key={db.id} value={db.id}>{db.title}</option>)}
                </select>
              ) : (
                <p className="text-xs font-medium py-1" style={{ color: "rgba(55,67,117,.55)" }}>No databases found.</p>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 font-bold text-sm transition-all"
              style={{
                background: "#F8FAFC",
                border: "1px solid rgba(55,67,117,.10)",
                borderRadius: "14px",
                color: "rgba(55,67,117,.55)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,67,117,.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC"; }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={starting || !title.trim()}
              className="flex-1 py-2.5 font-bold text-sm text-white transition-all disabled:opacity-50"
              style={{
                background: "#374375",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(55,67,117,.20)",
              }}
              onMouseEnter={(e) => {
                if (!starting && title.trim())
                  (e.currentTarget as HTMLButtonElement).style.background = "#2A3562";
              }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#374375"; }}
            >
              {starting ? "Starting…" : "Start Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
