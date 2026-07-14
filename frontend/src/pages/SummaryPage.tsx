import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, getNotes } from "../services/api";
import type { Session, Note } from "../types";
import { BookOpen, Plus, Loader2, ClipboardList, BarChart3, Bot, ArrowRight, Mic, Pencil } from "lucide-react";
import { SESSION_TYPES, SUMMARY_SECTIONS } from "../constants/sessionTypes";

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!id) { setLoadError("Invalid session URL."); return; }
    Promise.all([getSession(Number(id)), getNotes(Number(id))])
      .then(([sessionRes, notesRes]) => {
        setSession(sessionRes.data);
        setNotes(notesRes.data);
      })
      .catch((e: unknown) => {
        const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setLoadError(detail || "Could not load session — is the backend running?");
      });
  }, [id]);

  const { tagGroups, aiNotes, untaggedUserNotes, conversationSummary, conversationEvals } = useMemo(() => {
    const userNotes = notes.filter((n) => ["voice", "text"].includes(n.source));
    const aiNotes = notes.filter((n) => n.source === "ai_suggestion");
    const convSummaryNote = notes.find((n) => n.source === "conversation_summary");
    const convEvalNote = notes.find((n) => n.source === "conversation_evaluation");

    const tagMap = new Map<string | null, Note[]>();
    for (const note of userNotes) {
      const key = note.tag ?? null;
      if (!tagMap.has(key)) tagMap.set(key, []);
      tagMap.get(key)!.push(note);
    }
    const tagged = [...tagMap.entries()]
      .filter(([k]) => k !== null)
      .map(([tag, notes]) => ({ tag: tag!, notes }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
    const untagged = tagMap.get(null) ?? [];

    let conversationSummary: Record<string, string[]> | null = null;
    let conversationEvals: string[] | null = null;
    try { if (convSummaryNote) conversationSummary = JSON.parse(convSummaryNote.content); } catch {}
    try { if (convEvalNote) conversationEvals = JSON.parse(convEvalNote.content); } catch {}

    return { tagGroups: tagged, aiNotes, untaggedUserNotes: untagged, conversationSummary, conversationEvals };
  }, [notes]);

  if (!session && !loadError) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          backgroundColor: "#FFFFFF",
        }}
      >
        <Loader2 className="animate-spin" size={36} style={{ color: "#111111" }} />
        <p className="font-['Yeseva_One'] text-4xl font-semibold" style={{ color: "#111111" }}>Loading summary…</p>
        <p className="text-lg font-medium" style={{ color: "#8A8A8A" }}>Session #{id}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{
          backgroundColor: "#FFFFFF",
        }}
      >
        <p className="font-bold" style={{ color: "#111111" }}>Failed to load session</p>
        <p className="text-lg text-center max-w-sm font-medium" style={{ color: "#8A8A8A" }}>{loadError}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-2 text-white px-5 py-2.5 rounded-full text-lg font-bold transition-all shadow-sm"
          style={{ backgroundColor: "#111111" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#000000"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#111111"; }}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const typeConfig = SESSION_TYPES.find((t) => t.value === session!.session_type);
  const userNoteCount = notes.filter((n) => ["voice", "text"].includes(n.source)).length;
  const isConvoMode = session!.mode === "record_conversation";
  const summaryKeys = SUMMARY_SECTIONS[session!.session_type ?? "custom"];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#FFFFFF",
        color: "#111111",
      }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#111111" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={20} style={{ color: "rgba(255,255,255,.70)" }} className="flex-shrink-0" />
          <span className="font-['Yeseva_One'] text-3xl font-bold truncate text-white">{session!.title}</span>
          <span
            className="text-base px-2 py-0.5 rounded-full flex-shrink-0 font-bold"
            style={{
              backgroundColor: "rgba(255,255,255,.15)",
              color: "rgba(255,255,255,.80)",
              border: "1px solid rgba(255,255,255,.25)",
            }}
          >
            completed
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-lg font-semibold transition-all"
            style={{ color: "rgba(255,255,255,.70)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.70)"; }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/sessions")}
            className="flex items-center gap-1.5 text-lg px-4 py-1.5 rounded-full font-bold transition-all shadow-sm"
            style={{
              backgroundColor: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.25)",
              color: "white",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,.25)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,.15)"; }}
          >
            <Plus size={14} /> New Session
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {/* Session meta */}
        <div
          className="rounded-2xl px-5 py-4 shadow-sm"
          style={{
            backgroundColor: "white",
            border: "1px solid rgba(17,17,17,.08)",
          }}
        >
          <div className="flex flex-wrap gap-3 text-lg font-semibold">
            {typeConfig && (
              <span className="inline-flex items-center gap-1.5" style={{ color: "#111111" }}>
                <typeConfig.icon size={16} /> {typeConfig.label}
              </span>
            )}
            {session!.participants && <span style={{ color: "#111111" }}>{session!.participants}</span>}
            <span style={{ color: "#8A8A8A" }}>
              {new Date(session!.started_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {session!.ended_at && (
              <span style={{ color: "#8A8A8A" }}>
                {Math.round((new Date(session!.ended_at).getTime() - new Date(session!.started_at).getTime()) / 60000)} min
              </span>
            )}
            {userNoteCount > 0 && <span style={{ color: "#8A8A8A" }}>{userNoteCount} notes</span>}
          </div>
        </div>

        {/* ── CONVERSATION MODE: structured JSON summary ── */}
        {isConvoMode && conversationSummary && (
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{
              backgroundColor: "white",
              border: "1px solid rgba(17,17,17,.08)",
            }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#111111" }}>
              <ClipboardList size={18} /> Conversation Summary
            </h3>
            <div className="space-y-4">
              {summaryKeys.map(({ key, label, icon: SectionIcon }) => {
                const items = conversationSummary![key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-base font-bold mb-2 flex items-center gap-1.5" style={{ color: "#111111" }}>
                      <SectionIcon size={15} /> {label}
                    </p>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
                          <span style={{ color: "#8A8A8A" }} className="flex-shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversation key evaluations */}
        {isConvoMode && conversationEvals && conversationEvals.length > 0 && (
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{
              backgroundColor: "rgba(17,17,17,.05)",
              border: "1px solid rgba(17,17,17,.12)",
            }}
          >
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#111111" }}>
              <BarChart3 size={18} /> Key Evaluations
            </h3>
            <div className="space-y-2">
              {conversationEvals.map((e, i) => (
                <div key={i} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
                  <span style={{ color: "#8A8A8A" }} className="flex-shrink-0">•</span>
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── QUICK NOTES MODE: tag-grouped cards ── */}
        {!isConvoMode && (
          <>
            {tagGroups.map(({ tag, notes: tagNotes }) => (
              <NoteCard key={tag} label={tag} notes={tagNotes} color="#111111" />
            ))}
            {untaggedUserNotes.length > 0 && (
              <NoteCard label="General Notes" notes={untaggedUserNotes} color="#111111" />
            )}
          </>
        )}

        {/* AI Insights */}
        {aiNotes.length > 0 && (
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{
              backgroundColor: "rgba(17,17,17,.08)",
              border: "1px solid rgba(17,17,17,.18)",
            }}
          >
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#111111" }}>
              <Bot size={18} /> AI Insights
            </h3>
            <div className="space-y-3">
              {aiNotes.map((note) => (
                <div
                  key={note.id}
                  className="text-lg leading-relaxed border-l-2 pl-3 font-medium"
                  style={{ color: "#111111", borderColor: "#111111" }}
                >
                  {note.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Session Plan */}
        {!isConvoMode && (
          session!.summary ? (
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(17,17,17,.08)",
              }}
            >
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#111111" }}>
                <ArrowRight size={18} /> Next Session Plan
              </h3>
              <PlanContent text={session!.summary} />
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 text-center shadow-sm"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(17,17,17,.08)",
              }}
            >
              <p className="text-lg font-medium" style={{ color: "#8A8A8A" }}>
                No next session plan was generated.
              </p>
              <p className="text-base mt-1 font-medium" style={{ color: "#8A8A8A" }}>
                Ensure GROQ_API_KEY is set in backend/.env
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}

function NoteCard({ label, notes, color }: { label: string; notes: Note[]; color: string }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{
        backgroundColor: "white",
        border: "1px solid rgba(17,17,17,.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-base px-2.5 py-1 rounded-full font-bold"
          style={{
            backgroundColor: color + "22",
            color,
            border: `1px solid ${color}44`,
          }}
        >
          {label}
        </span>
        <span className="text-base font-semibold" style={{ color: "#8A8A8A" }}>
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
            <span className="flex-shrink-0 mt-0.5" style={{ color: "#8A8A8A" }}>
              {note.source === "voice" ? <Mic size={15} /> : <Pencil size={15} />}
            </span>
            <span className="leading-relaxed">{note.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanContent({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return (
    <div className="space-y-1">
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (line.startsWith("## ")) return (
          <h2 key={i} className="font-bold mt-3 mb-1" style={{ color: "#111111" }}>{line.slice(3)}</h2>
        );
        if (line.startsWith("# ")) return (
          <h1 key={i} className="font-['Yeseva_One'] text-3xl font-bold mt-4 mb-2" style={{ color: "#111111" }}>{line.slice(2)}</h1>
        );
        const boldMatch = line.match(/^\*\*(.+)\*\*:?$/);
        if (boldMatch) return (
          <h3 key={i} className="font-bold mt-3 mb-1" style={{ color: "#111111" }}>{boldMatch[1]}</h3>
        );
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) return (
          <div key={i} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
            <span className="flex-shrink-0 font-mono" style={{ color: "#8A8A8A" }}>{numberedMatch[1]}.</span>
            <span className="leading-relaxed">{numberedMatch[2].replace(/\*\*(.+?)\*\*/g, "$1")}</span>
          </div>
        );
        if (line.startsWith("- ") || line.startsWith("* ")) return (
          <div key={i} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
            <span className="flex-shrink-0" style={{ color: "#8A8A8A" }}>•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        return <p key={i} className="text-lg leading-relaxed font-medium" style={{ color: "#111111" }}>{line}</p>;
      })}
    </div>
  );
}
