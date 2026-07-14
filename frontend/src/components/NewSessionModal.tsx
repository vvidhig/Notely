import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { SessionType, SessionMode } from "../types";
import { SESSION_TYPES } from "../constants/sessionTypes";
import { Mic, MessageSquare, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

const INPUT_STYLE: React.CSSProperties = {
  background: "#F8FAFC",
  border: "1px solid rgba(17,17,17,.12)",
  borderRadius: "14px",
  color: "#111111",
  fontFamily: "Quicksand, sans-serif",
  fontSize: "0.875rem",
  fontWeight: 500,
  width: "100%",
  padding: "10px 14px",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#111111";
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(17,17,17,.12)";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "rgba(17,17,17,.12)";
  e.currentTarget.style.boxShadow   = "none";
}

export default function NewSessionModal({ onClose }: Props) {
  const navigate = useNavigate();

  const [title, setTitle]           = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("custom");
  const [participants, setParticipants] = useState("");
  const [mode, setMode]             = useState<SessionMode>("quick_notes");
  const [starting, setStarting]     = useState(false);

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
      },
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(17,17,17,.25)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{
          background: "#ffffff",
          borderRadius: "28px",
          border: "1px solid rgba(17,17,17,.08)",
          boxShadow: "0 24px 64px rgba(17,17,17,.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}
        >
          <h2 className="font-['Yeseva_One'] text-3xl font-bold" style={{ color: "#111111" }}>
            Start New Session
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(17,17,17,.08)", color: "rgba(17,17,17,.55)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(17,17,17,.55)" }}>
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
            <label className="text-sm font-bold uppercase tracking-widest mb-2 block" style={{ color: "rgba(17,17,17,.55)" }}>
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
                      background: selected ? "rgba(17,17,17,.08)" : "#F8FAFC",
                      border: selected ? "2px solid #111111" : "1px solid rgba(17,17,17,.08)",
                      borderRadius: "14px",
                      boxShadow: selected ? "0 0 0 3px rgba(17,17,17,.10)" : "none",
                    }}
                  >
                    <div className="mb-1" style={{ color: "#111111" }}><t.icon size={22} /></div>
                    <div className="text-base font-bold" style={{ color: selected ? "#111111" : "rgba(17,17,17,.55)" }}>
                      {t.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-sm font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(17,17,17,.55)" }}>
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
            <label className="text-sm font-bold uppercase tracking-widest mb-2 block" style={{ color: "rgba(17,17,17,.55)" }}>
              Recording mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button" onClick={() => setMode("quick_notes")}
                className="px-4 py-3 flex items-center gap-2.5 transition-all"
                style={{
                  background: mode === "quick_notes" ? "rgba(17,17,17,.05)" : "#F8FAFC",
                  border: mode === "quick_notes" ? "2px solid #111111" : "1px solid rgba(17,17,17,.08)",
                  borderRadius: "14px",
                }}
              >
                <Mic size={16} style={{ color: "#111111" }} />
                <div className="text-left">
                  <div className="text-lg font-bold" style={{ color: "#111111" }}>Quick Notes</div>
                  <div className="text-sm font-medium" style={{ color: "rgba(17,17,17,.55)" }}>Short clips + text</div>
                </div>
              </button>
              <button
                type="button" onClick={() => setMode("record_conversation")}
                className="px-4 py-3 flex items-center gap-2.5 transition-all"
                style={{
                  background: mode === "record_conversation" ? "rgba(17,17,17,.05)" : "#F8FAFC",
                  border: mode === "record_conversation" ? "2px solid #111111" : "1px solid rgba(17,17,17,.08)",
                  borderRadius: "14px",
                }}
              >
                <MessageSquare size={16} style={{ color: "#111111" }} />
                <div className="text-left">
                  <div className="text-lg font-bold" style={{ color: "#111111" }}>Conversation</div>
                  <div className="text-sm font-medium" style={{ color: "rgba(17,17,17,.55)" }}>Full audio recording</div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 font-bold text-lg transition-all"
              style={{
                background: "#F8FAFC",
                border: "1px solid rgba(17,17,17,.10)",
                borderRadius: "14px",
                color: "rgba(17,17,17,.55)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(17,17,17,.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC"; }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={starting || !title.trim()}
              className="flex-1 py-2.5 font-bold text-lg text-white transition-all disabled:opacity-50"
              style={{
                background: "#111111",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(17,17,17,.20)",
              }}
              onMouseEnter={(e) => {
                if (!starting && title.trim())
                  (e.currentTarget as HTMLButtonElement).style.background = "#000000";
              }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#111111"; }}
            >
              {starting ? "Starting…" : "Start Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
