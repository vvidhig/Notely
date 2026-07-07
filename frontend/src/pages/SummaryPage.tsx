import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, getNotes, syncToNotion, getNotionDatabases } from "../services/api";
import type { Session, Note, NotionDatabase } from "../types";
import { useAuth } from "../context/AuthContext";
import { BookOpen, ExternalLink, Plus, Loader2 } from "lucide-react";
import { SESSION_TYPES, SUMMARY_SECTIONS } from "../constants/sessionTypes";

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadError, setLoadError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState("");
  const [actionError, setActionError] = useState("");
  const [notionDbs, setNotionDbs] = useState<NotionDatabase[]>([]);
  const [selectedDbId, setSelectedDbId] = useState("");

  useEffect(() => {
    if (!id) { setLoadError("Invalid session URL."); return; }
    Promise.all([getSession(Number(id)), getNotes(Number(id))])
      .then(([sessionRes, notesRes]) => {
        setSession(sessionRes.data);
        setNotes(notesRes.data);
        if (sessionRes.data.notion_page_id) setSynced(true);
      })
      .catch((e: unknown) => {
        const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setLoadError(detail || "Could not load session — is the backend running?");
      });
  }, [id]);

  useEffect(() => {
    if (user?.notion_connected && session && !session.notion_database_id && !synced) {
      getNotionDatabases()
        .then((r) => { setNotionDbs(r.data); if (r.data.length > 0) setSelectedDbId(r.data[0].id); })
        .catch(() => {});
    }
  }, [user?.notion_connected, session?.id, synced]);

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

  const handleSync = async () => {
    if (!session) return;
    setSyncing(true); setActionError("");
    const dbId = session.notion_database_id || selectedDbId || undefined;
    try {
      const res = await syncToNotion(session.id, dbId);
      setSynced(true); setSyncedUrl(res.data.notion_page_url);
      setSession((s) => s ? { ...s, notion_database_id: dbId ?? s.notion_database_id } : s);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(msg || "Sync to Notion failed.");
    } finally { setSyncing(false); }
  };

  if (!session && !loadError) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{
          backgroundColor: "#FDF5F7",
          backgroundImage: "radial-gradient(rgba(139,38,62,.09) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      >
        <Loader2 className="animate-spin" size={36} style={{ color: "#8B263E" }} />
        <p className="font-['Yeseva_One'] text-2xl font-semibold" style={{ color: "#8B263E" }}>Loading summary…</p>
        <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>Session #{id}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{
          backgroundColor: "#FDF5F7",
          backgroundImage: "radial-gradient(rgba(139,38,62,.09) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      >
        <p className="font-bold" style={{ color: "#8B263E" }}>Failed to load session</p>
        <p className="text-sm text-center max-w-sm font-medium" style={{ color: "#94A3B8" }}>{loadError}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-2 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm"
          style={{ backgroundColor: "#8B263E" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#6B1C2E"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#8B263E"; }}
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
        backgroundColor: "#FDF5F7",
        backgroundImage: "radial-gradient(rgba(139,38,62,.09) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        color: "#292800",
      }}
    >
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#8B263E" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={20} style={{ color: "rgba(255,255,255,.70)" }} className="flex-shrink-0" />
          <span className="font-['Yeseva_One'] text-xl font-bold truncate text-white">{session!.title}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-bold"
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
            className="text-sm font-semibold transition-all"
            style={{ color: "rgba(255,255,255,.70)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.70)"; }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/sessions")}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full font-bold transition-all shadow-sm"
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
            border: "1px solid rgba(139,38,62,.08)",
          }}
        >
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            {typeConfig && <span style={{ color: "#292800" }}>{typeConfig.emoji} {typeConfig.label}</span>}
            {session!.participants && <span style={{ color: "#8B263E" }}>👥 {session!.participants}</span>}
            <span style={{ color: "#94A3B8" }}>
              {new Date(session!.started_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            {session!.ended_at && (
              <span style={{ color: "#94A3B8" }}>
                {Math.round((new Date(session!.ended_at).getTime() - new Date(session!.started_at).getTime()) / 60000)} min
              </span>
            )}
            {userNoteCount > 0 && <span style={{ color: "#94A3B8" }}>{userNoteCount} notes</span>}
          </div>
        </div>

        {/* Notion sync */}
        {synced ? (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-bold shadow-sm"
            style={{
              backgroundColor: "rgba(120,104,37,.08)",
              border: "1px solid rgba(120,104,37,.18)",
              color: "#786825",
            }}
          >
            ✅ Synced to Notion
            {syncedUrl && (
              <a
                href={syncedUrl} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 underline font-semibold"
                style={{ color: "#786825" }}
              >
                Open <ExternalLink size={12} />
              </a>
            )}
          </div>
        ) : user?.notion_connected ? (
          <div className="space-y-2">
            {!session?.notion_database_id && notionDbs.length > 0 && (
              <select
                value={selectedDbId}
                onChange={(e) => setSelectedDbId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                style={{
                  backgroundColor: "rgba(139,38,62,.05)",
                  border: "1px solid rgba(139,38,62,.12)",
                  color: "#292800",
                }}
              >
                <option value="">Select a Notion database…</option>
                {notionDbs.map((db) => <option key={db.id} value={db.id}>{db.title}</option>)}
              </select>
            )}
            <button
              onClick={handleSync}
              disabled={syncing || (!session?.notion_database_id && !selectedDbId)}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-50 py-3 rounded-xl font-bold transition-all text-white shadow-sm"
              style={{ backgroundColor: "#8B263E" }}
              onMouseEnter={e => { if (!syncing) (e.currentTarget as HTMLElement).style.backgroundColor = "#6B1C2E"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#8B263E"; }}
            >
              {syncing
                ? <><Loader2 size={16} className="animate-spin" /> Syncing…</>
                : <><ExternalLink size={16} /> Sync to Notion</>}
            </button>
          </div>
        ) : null}

        {actionError && (
          <div
            className="text-sm px-4 py-3 rounded-xl font-medium"
            style={{
              backgroundColor: "rgba(139,38,62,.06)",
              border: "1px solid rgba(139,38,62,.15)",
              color: "#8B263E",
            }}
          >
            {actionError}
          </div>
        )}

        {/* ── CONVERSATION MODE: structured JSON summary ── */}
        {isConvoMode && conversationSummary && (
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{
              backgroundColor: "white",
              border: "1px solid rgba(139,38,62,.08)",
            }}
          >
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#292800" }}>
              📋 Conversation Summary
            </h3>
            <div className="space-y-4">
              {summaryKeys.map(({ key, label, emoji }) => {
                const items = conversationSummary![key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key}>
                    <p className="text-xs font-bold mb-2" style={{ color: "#8B263E" }}>{emoji} {label}</p>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={i} className="flex gap-2 text-sm font-medium" style={{ color: "#292800" }}>
                          <span style={{ color: "#D17484" }} className="flex-shrink-0">•</span>
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
              backgroundColor: "rgba(139,38,62,.05)",
              border: "1px solid rgba(139,38,62,.12)",
            }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: "#8B263E" }}>📊 Key Evaluations</h3>
            <div className="space-y-2">
              {conversationEvals.map((e, i) => (
                <div key={i} className="flex gap-2 text-sm font-medium" style={{ color: "#292800" }}>
                  <span style={{ color: "#D17484" }} className="flex-shrink-0">•</span>
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
              <NoteCard key={tag} label={tag} notes={tagNotes} color="#8B263E" />
            ))}
            {untaggedUserNotes.length > 0 && (
              <NoteCard label="General Notes" notes={untaggedUserNotes} color="#786825" />
            )}
          </>
        )}

        {/* AI Insights */}
        {aiNotes.length > 0 && (
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{
              backgroundColor: "rgba(120,104,37,.08)",
              border: "1px solid rgba(120,104,37,.18)",
            }}
          >
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#786825" }}>
              <span>🤖</span> AI Insights
            </h3>
            <div className="space-y-3">
              {aiNotes.map((note) => (
                <div
                  key={note.id}
                  className="text-sm leading-relaxed border-l-2 pl-3 font-medium"
                  style={{ color: "#292800", borderColor: "#786825" }}
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
                border: "1px solid rgba(139,38,62,.08)",
              }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#292800" }}>
                <span>➡️</span> Next Session Plan
              </h3>
              <PlanContent text={session!.summary} />
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 text-center shadow-sm"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(139,38,62,.08)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>
                No next session plan was generated.
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#D17484" }}>
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
        border: "1px solid rgba(139,38,62,.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-bold"
          style={{
            backgroundColor: color + "22",
            color,
            border: `1px solid ${color}44`,
          }}
        >
          {label}
        </span>
        <span className="text-xs font-semibold" style={{ color: "#94A3B8" }}>
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="flex gap-2 text-sm font-medium" style={{ color: "#292800" }}>
            <span className="flex-shrink-0 mt-0.5" style={{ color: "#94A3B8" }}>
              {note.source === "voice" ? "🎤" : "✏️"}
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
          <h2 key={i} className="font-bold mt-3 mb-1" style={{ color: "#292800" }}>{line.slice(3)}</h2>
        );
        if (line.startsWith("# ")) return (
          <h1 key={i} className="font-['Yeseva_One'] text-xl font-bold mt-4 mb-2" style={{ color: "#8B263E" }}>{line.slice(2)}</h1>
        );
        const boldMatch = line.match(/^\*\*(.+)\*\*:?$/);
        if (boldMatch) return (
          <h3 key={i} className="font-bold mt-3 mb-1" style={{ color: "#292800" }}>{boldMatch[1]}</h3>
        );
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) return (
          <div key={i} className="flex gap-2 text-sm font-medium" style={{ color: "#292800" }}>
            <span className="flex-shrink-0 font-mono" style={{ color: "#94A3B8" }}>{numberedMatch[1]}.</span>
            <span className="leading-relaxed">{numberedMatch[2].replace(/\*\*(.+?)\*\*/g, "$1")}</span>
          </div>
        );
        if (line.startsWith("- ") || line.startsWith("* ")) return (
          <div key={i} className="flex gap-2 text-sm font-medium" style={{ color: "#292800" }}>
            <span className="flex-shrink-0" style={{ color: "#D17484" }}>•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
        if (line.trim() === "") return <div key={i} className="h-1.5" />;
        return <p key={i} className="text-sm leading-relaxed font-medium" style={{ color: "#292800" }}>{line}</p>;
      })}
    </div>
  );
}
