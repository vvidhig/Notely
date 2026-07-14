import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  createSession, getSession, getNotes, addTextNote, addVoiceNote,
  getSuggestion, endSession, deleteNote, getTags, createTag, processConversation, switchMode,
  chatAboutConversation, updateNote, reformatNote,
} from "../services/api";
import type { Session, Note, Tag, SessionMode, ChatMessage, Highlight } from "../types";
import { SESSION_TYPES } from "../constants/sessionTypes";
import {
  Mic, MicOff, Send, Sparkles, Square, Trash2, BookOpen, Plus, Check, X,
  MessageSquare, ChevronDown, Pencil, Bot, StickyNote, ClipboardList, BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTextHighlight } from "../hooks/useTextHighlight";
import { useHighlights } from "../hooks/useHighlights";
import { useTasks } from "../hooks/useTasks";
import HighlightToolbar from "../components/HighlightToolbar";
import HighlightSidePanel from "../components/HighlightSidePanel";
import TaskModal from "../components/TaskModal";

const PRESET_COLORS = ["#111111", "#333333", "#555555", "#777777", "#222222", "#444444", "#666666", "#888888"];
const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

/* ── Helper: render note content with yellow highlight spans ────────── */
function renderWithHighlights(
  content: string,
  hlights: Highlight[],
  onClick: (h: Highlight) => void,
): React.ReactNode {
  if (!hlights.length) return content;

  const sorted = [...hlights].sort((a, b) => a.start_offset - b.start_offset);
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const h of sorted) {
    const start = Math.max(0, Math.min(h.start_offset, content.length));
    const end   = Math.max(start, Math.min(h.end_offset, content.length));
    if (start > last) parts.push(content.slice(last, start));
    parts.push(
      <mark
        key={h.id}
        onClick={(e) => { e.stopPropagation(); onClick(h); }}
        style={{
          backgroundColor: "rgba(17,17,17,.14)",
          color: "inherit",
          cursor: "pointer",
          borderRadius: 3,
          padding: "0 1px",
        }}
      >
        {content.slice(start, end)}
        {h.note && <StickyNote size={11} style={{ display: "inline", marginLeft: 2, verticalAlign: "baseline" }} />}
      </mark>,
    );
    last = end;
  }

  if (last < content.length) parts.push(content.slice(last));
  return <>{parts}</>;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showModeMenu, setShowModeMenu] = useState(false);

  // Quick Notes state
  const [textInput, setTextInput] = useState("");
  const [qRecording, setQRecording] = useState(false);
  const [qSeconds, setQSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [sending, setSending] = useState(false);
  const [manualSuggesting, setManualSuggesting] = useState(false);

  // Conversation mode state
  const [cRecording, setCRecording] = useState(false);
  const [cSeconds, setCSeconds] = useState(0);
  const [cProcessing, setCProcessing] = useState<"transcribing" | "analyzing" | null>(null);

  // Common state
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  // Prevents StrictMode double-mount from calling createSession twice
  const sessionCreated = useRef(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const qTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qSecondsRef = useRef(0);
  const cSecondsRef = useRef(0);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Highlights + tasks
  const sessionId = id !== "new" ? Number(id) : undefined;
  const { highlights, load: loadHighlights, add: addHighlight, update: updateHL, remove: removeHighlight, forNote } = useHighlights(sessionId);
  const { add: addTask } = useTasks();
  const { selection, clearSelection } = useTextHighlight(timelineRef);
  const [taskPrefill, setTaskPrefill] = useState<{ text: string; noteId: number } | null>(null);

  // Side panel for highlight notes
  const [activePanelHighlightId, setActivePanelHighlightId] = useState<number | null>(null);
  const activePanelHighlight = highlights.find((h) => h.id === activePanelHighlightId) ?? null;

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      if (id === "new") {
        if (sessionCreated.current) return;
        sessionCreated.current = true;
        const state = location.state as {
          title?: string; session_type?: string; participants?: string;
          mode?: SessionMode; notion_database_id?: string;
        } | null;
        const res = await createSession(
          state?.title || "Untitled Session",
          (state?.session_type as any) || "custom",
          state?.participants,
          state?.mode || "quick_notes",
          state?.notion_database_id,
        );
        navigate(`/session/${res.data.id}`, { replace: true, state: {} });
        setSession(res.data);
        setNotes([]);
      } else {
        const [sessionRes, notesRes] = await Promise.all([
          getSession(Number(id)),
          getNotes(Number(id)),
        ]);
        setSession(sessionRes.data);
        setNotes(notesRes.data);
        if (sessionRes.data.status === "completed") {
          navigate(`/session/${id}/summary`, { replace: true });
        }
      }
    };
    init();
  }, [id]);

  // Load tags when session type is known
  useEffect(() => {
    if (!session) return;
    getTags(session.session_type).then((r) => setTags(r.data)).catch(() => {});
  }, [session?.session_type]);

  // Load highlights
  useEffect(() => {
    if (session?.id) loadHighlights();
  }, [session?.id]);

  // Auto-scroll
  useEffect(() => {
    if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
  }, [notes, transcribing, manualSuggesting, cProcessing]);

  // ── Helpers ──
  const showToast = (msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 3500);
  };

  const pushNotes = (note: Note, suggestion: Note | null) => {
    setNotes((prev) => {
      const updated = [...prev, note];
      if (suggestion) updated.push(suggestion);
      return updated;
    });
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setNotes((prev) => prev.map((n) => n.id === updatedNote.id ? updatedNote : n));
  };

  // ── Quick Notes recording ──
  const startQTimer = () => {
    qSecondsRef.current = 0; setQSeconds(0);
    qTimerRef.current = setInterval(() => {
      qSecondsRef.current += 1; setQSeconds(qSecondsRef.current);
    }, 1000);
  };
  const stopQTimer = () => { if (qTimerRef.current) { clearInterval(qTimerRef.current); qTimerRef.current = null; } };

  const startQRecording = async () => {
    if (!session) return;
    setError("");
    const sessionId = session.id;
    const tag = activeTag;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 8000) { setError("Recording too short — speak for at least 2 seconds."); return; }
        setTranscribing(true);
        try {
          const res = await addVoiceNote(sessionId, blob, "recording.webm", tag ?? undefined, qSecondsRef.current);
          pushNotes(res.data.note, res.data.suggestion);
        } catch (e: unknown) {
          const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setError(detail || "Transcription failed.");
        } finally { setTranscribing(false); }
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      startQTimer(); setQRecording(true);
    } catch { setError("Microphone access denied — check browser permissions."); }
  };

  const stopQRecording = () => {
    if (qSecondsRef.current < 2) {
      setError("Too short — speak for at least 2 seconds."); mediaRecorderRef.current?.stop(); stopQTimer(); setQRecording(false); return;
    }
    stopQTimer(); mediaRecorderRef.current?.stop(); setQRecording(false);
  };

  // ── Conversation recording ──
  const startCTimer = () => {
    cSecondsRef.current = 0; setCSeconds(0);
    cTimerRef.current = setInterval(() => {
      cSecondsRef.current += 1; setCSeconds(cSecondsRef.current);
      if (cSecondsRef.current === 300) showToast("5 minute mark — consider wrapping up this chunk.");
    }, 1000);
  };
  const stopCTimer = () => { if (cTimerRef.current) { clearInterval(cTimerRef.current); cTimerRef.current = null; } };

  const startCRecording = async () => {
    if (!session) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 8000) { setError("Recording too short."); return; }
        const durationLabel = fmtTimer(cSecondsRef.current);
        setCProcessing("transcribing");
        try {
          const res = await processConversation(session.id, blob, "conversation.webm", cSecondsRef.current);
          setCProcessing("analyzing");
          await new Promise((r) => setTimeout(r, 800));
          setNotes((prev) => [...prev, ...res.data.notes]);
          showToast(`Conversation processed — ${durationLabel} analyzed.`);
        } catch (e: unknown) {
          const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          setError(detail || "Conversation processing failed.");
        } finally { setCProcessing(null); }
      };
      recorder.start(500);
      mediaRecorderRef.current = recorder;
      startCTimer(); setCRecording(true);
    } catch { setError("Microphone access denied — check browser permissions."); }
  };

  const stopCRecording = () => {
    stopCTimer(); mediaRecorderRef.current?.stop(); setCRecording(false);
  };

  // ── Quick Notes actions ──
  const handleSendText = async () => {
    if (!textInput.trim() || !session) return;
    const content = textInput.trim(); setTextInput(""); setSending(true);
    try {
      const res = await addTextNote(session.id, content, activeTag ?? undefined);
      pushNotes(res.data.note, res.data.suggestion);
    } catch { setError("Failed to send note."); } finally { setSending(false); }
  };

  const handleManualSuggest = async () => {
    if (!session) return;
    setManualSuggesting(true);
    try {
      const res = await getSuggestion(session.id);
      const aiNote: Note = {
        id: Date.now(), session_id: session.id, content: res.data.suggestion,
        source: "ai_suggestion", tag: null, speaker: null, timestamp: new Date().toISOString(),
      };
      setNotes((n) => [...n, aiNote]);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Could not get suggestions.");
    } finally { setManualSuggesting(false); }
  };

  const handleEndSession = async () => {
    if (!session) return;
    setEnding(true);
    try { await endSession(session.id); navigate(`/session/${session.id}/summary`); }
    catch { setError("Failed to end session."); setEnding(false); }
  };

  const handleDeleteNote = async (noteId: number) => {
    try { await deleteNote(noteId); setNotes((n) => n.filter((x) => x.id !== noteId)); }
    catch { setError("Could not delete note."); }
  };

  const handleSwitchMode = async (newMode: SessionMode) => {
    if (!session || newMode === session.mode) return;
    setShowModeMenu(false);
    try {
      await switchMode(session.id, newMode);
      setSession((s) => s ? { ...s, mode: newMode } : s);
      if (newMode === "quick_notes") getTags(session.session_type).then((r) => setTags(r.data));
    } catch { setError("Could not switch mode."); }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !session) return;
    try {
      const res = await createTag(newTagName.trim(), newTagColor, session.session_type);
      setTags((t) => [...t, res.data]);
      setActiveTag(res.data.name);
      setNewTagName(""); setNewTagColor(PRESET_COLORS[0]); setShowNewTag(false);
    } catch { setError("Could not create tag."); }
  };

  // ── Derived ──
  const isQuickNotes = session?.mode === "quick_notes";
  const userNoteCount = notes.filter((n) => n.source !== "ai_suggestion").length;
  const typeConfig = SESSION_TYPES.find((t) => t.value === session?.session_type);

  const speakerOrder = useMemo(() => {
    const seen: string[] = [];
    for (const n of notes) {
      if (n.source === "conversation_speaker" && n.speaker && !seen.includes(n.speaker)) {
        seen.push(n.speaker);
      }
    }
    return seen;
  }, [notes]);

  type RenderItem =
    | { kind: "note"; note: Note }
    | { kind: "chunk"; speakers: Note[]; summary: Note | null; evaluation: Note | null };

  const renderItems = useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];
    const CONV = new Set(["conversation_speaker", "conversation_summary", "conversation_evaluation"]);
    let i = 0;
    while (i < notes.length) {
      if (notes[i].source === "conversation_speaker") {
        const speakers: Note[] = [];
        let summary: Note | null = null;
        let evaluation: Note | null = null;
        while (i < notes.length && CONV.has(notes[i].source)) {
          const n = notes[i];
          if (n.source === "conversation_speaker") speakers.push(n);
          else if (n.source === "conversation_summary") summary = n;
          else if (n.source === "conversation_evaluation") { evaluation = n; i++; break; }
          i++;
        }
        items.push({ kind: "chunk", speakers, summary, evaluation });
      } else {
        items.push({ kind: "note", note: notes[i] });
        i++;
      }
    }
    return items;
  }, [notes]);

  return (
    <div className="h-[100dvh] flex flex-col" style={{
      backgroundColor: "#FFFFFF",
      color: "#111111",
    }}>
      {/* Header */}
      <header
        className="flex-shrink-0 px-5 py-3 flex items-center gap-3"
        style={{ backgroundColor: "#111111" }}
      >
        <BookOpen size={18} style={{ color: "rgba(255,255,255,.70)" }} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-['Yeseva_One'] text-2xl font-bold truncate text-white">
              {session?.title || "Loading…"}
            </span>
            {typeConfig && (
              <span className="text-base font-semibold flex-shrink-0 inline-flex items-center gap-1.5" style={{ color: "rgba(255,255,255,.60)" }}>
                <typeConfig.icon size={15} /> {typeConfig.label}
              </span>
            )}
            {userNoteCount > 0 && (
              <span className="text-base font-semibold flex-shrink-0" style={{ color: "rgba(255,255,255,.60)" }}>
                · {userNoteCount} notes
              </span>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowModeMenu((v) => !v)}
            className="flex items-center gap-1.5 text-base px-3 py-1.5 rounded-full font-bold transition-all"
            style={{
              backgroundColor: "rgba(255,255,255,.15)",
              border: "1px solid rgba(255,255,255,.25)",
              color: "white",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,.22)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,.15)"; }}
          >
            {isQuickNotes ? <Mic size={12} /> : <MessageSquare size={12} />}
            {isQuickNotes ? "Quick Notes" : "Conversation"}
            <ChevronDown size={12} />
          </button>
          {showModeMenu && (
            <div
              className="absolute top-full right-0 mt-1 rounded-2xl z-20 overflow-hidden w-44"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(17,17,17,.12)",
                boxShadow: "0 8px 24px rgba(17,17,17,.15)",
              }}
            >
              <button
                onClick={() => handleSwitchMode("quick_notes")}
                className="w-full text-left px-4 py-3 text-lg flex items-center gap-2 font-semibold transition-all"
                style={{ color: isQuickNotes ? "#111111" : "#111111" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(17,17,17,.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <Mic size={14} /> Quick Notes
              </button>
              <button
                onClick={() => handleSwitchMode("record_conversation")}
                className="w-full text-left px-4 py-3 text-lg flex items-center gap-2 font-semibold transition-all"
                style={{ color: !isQuickNotes ? "#111111" : "#111111" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(17,17,17,.06)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <MessageSquare size={14} /> Conversation
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleEndSession}
          disabled={ending || !session}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-base font-bold transition-all disabled:opacity-40"
          style={{
            backgroundColor: "rgba(255,255,255,.12)",
            border: "1px solid rgba(255,255,255,.30)",
            color: "white",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,.22)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,.12)"; }}
        >
          <Square size={11} />{ending ? "Ending…" : "End Session"}
        </button>
      </header>

      {/* Tag bar — Quick Notes only */}
      {isQuickNotes && (
        <div
          className="flex-shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto"
          style={{
            backgroundColor: "rgba(17,17,17,.04)",
            borderBottom: "1px solid rgba(17,17,17,.08)",
          }}
        >
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex-shrink-0 text-base flex items-center gap-1 pr-1 font-semibold transition-all"
              style={{ color: "#111111" }}
            >
              <X size={12} /> Clear
            </button>
          )}
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
              className="flex-shrink-0 text-base px-3 py-1 rounded-full border transition-all font-bold"
              style={{
                backgroundColor: tag.color + (activeTag === tag.name ? "33" : "18"),
                color: tag.color,
                borderColor: tag.color + (activeTag === tag.name ? "aa" : "44"),
                boxShadow: activeTag === tag.name ? `0 0 0 2px ${tag.color}44` : "none",
              }}
            >
              {tag.name}
            </button>
          ))}
          {showNewTag ? (
            <form onSubmit={handleCreateTag} className="flex items-center gap-1.5 flex-shrink-0">
              <input
                autoFocus type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="text-base rounded-full px-3 py-1 w-24 focus:outline-none font-medium"
                style={{
                  background: "white",
                  border: "1px solid rgba(17,17,17,.20)",
                  color: "#111111",
                }}
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setNewTagColor(c)}
                    className="w-4 h-4 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: c,
                      boxShadow: newTagColor === c ? `0 0 0 2px ${c}` : "none",
                      transform: newTagColor === c ? "scale(1.2)" : "scale(1)",
                      outline: newTagColor === c ? "2px solid white" : "none",
                    }} />
                ))}
              </div>
              <button type="submit" style={{ color: "#111111" }}><Check size={14} /></button>
              <button type="button" onClick={() => setShowNewTag(false)} style={{ color: "#8A8A8A" }}><X size={14} /></button>
            </form>
          ) : (
            <button
              onClick={() => setShowNewTag(true)}
              className="flex-shrink-0 text-base px-2.5 py-1 rounded-full flex items-center gap-1 font-bold transition-all"
              style={{
                border: "1px dashed rgba(17,17,17,.30)",
                color: "#111111",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#111111"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(17,17,17,.30)"; }}
            >
              <Plus size={10} /> Tag
            </button>
          )}
        </div>
      )}

      {/* Chat timeline */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
        style={{
          backgroundColor: "#FFFFFF",
        }}
      >
        {notes.length === 0 && !transcribing && !cProcessing && (
          <div className="text-center py-20">
            <div className="mb-3 flex justify-center" style={{ color: "#111111" }}><Mic size={44} /></div>
            {isQuickNotes ? (
              <>
                <p className="font-['Yeseva_One'] text-4xl font-semibold" style={{ color: "#111111" }}>
                  Tap the mic or type a note
                </p>
                {tags.length > 0 && (
                  <p className="text-base mt-1 font-medium" style={{ color: "#8A8A8A" }}>
                    Select a tag before recording to categorize it
                  </p>
                )}
              </>
            ) : (
              <p className="font-['Yeseva_One'] text-4xl font-semibold" style={{ color: "#111111" }}>
                Tap Record to capture a conversation
              </p>
            )}
          </div>
        )}

        {renderItems.map((item, idx) => {
          if (item.kind === "note") {
            return (
              <NoteBubble
                key={item.note.id}
                note={item.note}
                speakerOrder={speakerOrder}
                tags={tags}
                onDelete={handleDeleteNote}
                onNoteUpdate={handleNoteUpdate}
                noteHighlights={forNote(item.note.id)}
                onHighlightClick={(h) => setActivePanelHighlightId(h.id)}
              />
            );
          }
          return (
            <div key={`chunk-${item.speakers[0]?.id ?? idx}`} className="space-y-3">
              {item.speakers.map((n) => (
                <NoteBubble
                  key={n.id}
                  note={n}
                  speakerOrder={speakerOrder}
                  tags={tags}
                  onDelete={handleDeleteNote}
                  onNoteUpdate={handleNoteUpdate}
                  noteHighlights={forNote(n.id)}
                  onHighlightClick={(h) => setActivePanelHighlightId(h.id)}
                />
              ))}
              {item.summary && (
                <NoteBubble
                  key={item.summary.id}
                  note={item.summary}
                  speakerOrder={speakerOrder}
                  tags={tags}
                  onDelete={handleDeleteNote}
                  onNoteUpdate={handleNoteUpdate}
                  noteHighlights={forNote(item.summary.id)}
                  onHighlightClick={(h) => setActivePanelHighlightId(h.id)}
                />
              )}
              {item.evaluation && (
                <NoteBubble
                  key={item.evaluation.id}
                  note={item.evaluation}
                  speakerOrder={speakerOrder}
                  tags={tags}
                  onDelete={handleDeleteNote}
                  onNoteUpdate={handleNoteUpdate}
                  noteHighlights={forNote(item.evaluation.id)}
                  onHighlightClick={(h) => setActivePanelHighlightId(h.id)}
                />
              )}
              {item.evaluation && session && (
                <ConversationChat speakerNotes={item.speakers} sessionId={session.id} />
              )}
            </div>
          );
        })}

        {/* Quick Notes placeholders */}
        {transcribing && (
          <div className="flex items-end justify-end gap-3">
            <div
              className="max-w-[78%] rounded-[28px] px-5 py-3.5 shadow-md"
              style={{
                backgroundColor: "rgba(17,17,17,.08)",
                border: "1px solid rgba(17,17,17,.15)",
              }}
            >
              <p className="text-lg animate-pulse font-medium" style={{ color: "#111111" }}>Transcribing…</p>
            </div>
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-base font-bold shadow-md border-2 border-white/50 text-white"
              style={{ backgroundColor: "#111111" }}
            >
              Me
            </div>
          </div>
        )}
        {manualSuggesting && (
          <div className="flex items-end gap-3">
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center shadow-md border-2 border-white"
              style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
            >
              <Bot size={22} />
            </div>
            <div
              className="max-w-[78%] rounded-[28px] px-5 py-3.5 shadow-md"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(17,17,17,.15)",
              }}
            >
              <p className="text-lg animate-pulse font-medium" style={{ color: "#111111" }}>Generating suggestion…</p>
            </div>
          </div>
        )}

        {/* Conversation processing placeholder */}
        {cProcessing && (
          <div
            className="rounded-2xl px-5 py-4 mx-2 shadow-sm"
            style={{
              backgroundColor: "rgba(17,17,17,.06)",
              border: "1px solid rgba(17,17,17,.12)",
            }}
          >
            <p className="text-lg animate-pulse font-semibold" style={{ color: "#111111" }}>
              {cProcessing === "transcribing" ? "Transcribing audio…" : "Identifying speakers and analyzing…"}
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex-shrink-0 mx-4 mb-2 text-lg px-4 py-2 rounded-xl flex items-center justify-between font-medium"
          style={{
            backgroundColor: "rgba(17,17,17,.06)",
            border: "1px solid rgba(17,17,17,.18)",
            color: "#111111",
          }}
        >
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-3 opacity-60 hover:opacity-100 transition-all">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Active tag indicator */}
      {isQuickNotes && activeTag && (
        <div className="flex-shrink-0 px-4 pb-1">
          <p className="text-base font-semibold" style={{ color: "#8A8A8A" }}>
            Next note tagged: <span className="font-bold" style={{ color: "#111111" }}>{activeTag}</span>
          </p>
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{
          backgroundColor: "white",
          borderTop: "1px solid rgba(17,17,17,.08)",
        }}
      >
        {isQuickNotes ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={qRecording ? stopQRecording : startQRecording}
                disabled={transcribing || sending || !session}
                className={`flex-shrink-0 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-40 ${
                  qRecording
                    ? "bg-red-500 hover:bg-red-600 ring-4 ring-red-400/25 px-4 gap-2 min-w-[88px] text-white"
                    : "w-11"
                }`}
                style={!qRecording ? {
                  backgroundColor: "rgba(17,17,17,.10)",
                  color: "#111111",
                } : {}}
              >
                {qRecording
                  ? <><MicOff size={16} /><span className="text-lg font-mono">{fmtTimer(qSeconds)}</span></>
                  : <Mic size={18} />}
              </button>
              <input
                type="text" value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !qRecording && handleSendText()}
                placeholder={qRecording ? "Recording…" : "Type a note…"}
                disabled={qRecording || sending}
                className="flex-1 rounded-xl px-4 py-2.5 text-lg disabled:opacity-50 font-medium focus:outline-none"
                style={{
                  backgroundColor: "rgba(17,17,17,.05)",
                  border: "1px solid rgba(17,17,17,.12)",
                  color: "#111111",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#111111";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,17,17,.10)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "rgba(17,17,17,.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                onClick={handleSendText}
                disabled={!textInput.trim() || qRecording || sending || !session}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 text-white"
                style={{ backgroundColor: "#111111" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#000000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#111111"; }}
              >
                <Send size={15} />
              </button>
              <button
                onClick={handleManualSuggest}
                disabled={manualSuggesting || qRecording || userNoteCount === 0}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  backgroundColor: "rgba(17,17,17,.10)",
                  border: "1px solid rgba(17,17,17,.18)",
                }}
                title="Get AI suggestion"
              >
                <Sparkles size={15} style={{ color: "#111111" }} />
              </button>
            </div>
            <p className="text-base mt-2 text-center font-medium" style={{ color: "#8A8A8A" }}>
              {qRecording
                ? `Recording ${fmtTimer(qSeconds)} — tap mic to stop`
                : "Tap mic · Enter to send · Sparkles for AI suggestions"}
            </p>
          </>
        ) : (
          /* Conversation mode input */
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={cRecording ? stopCRecording : startCRecording}
              disabled={!!cProcessing || !session}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 ${
                cRecording
                  ? "bg-black hover:bg-neutral-800 ring-8 ring-black/10 scale-105 text-white"
                  : ""
              }`}
              style={!cRecording ? {
                backgroundColor: "rgba(17,17,17,.10)",
                border: "2px solid rgba(17,17,17,.20)",
                color: "#111111",
              } : {}}
            >
              {cRecording ? (
                <>
                  <Square size={22} />
                  <span className="text-base font-mono">{fmtTimer(cSeconds)}</span>
                </>
              ) : (
                <>
                  <Mic size={24} />
                  <span className="text-base font-semibold">Record</span>
                </>
              )}
            </button>
            <p className="text-base font-semibold" style={{ color: "#8A8A8A" }}>
              {cProcessing
                ? (cProcessing === "transcribing" ? "Transcribing…" : "Analyzing…")
                : cRecording ? "Tap to stop and process" : "Tap to record a conversation chunk"}
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 text-lg px-5 py-2.5 rounded-full shadow-xl z-50 whitespace-nowrap font-semibold text-white"
          style={{ backgroundColor: "#111111" }}
        >
          {toast}
        </div>
      )}

      {showModeMenu && <div className="fixed inset-0 z-10" onClick={() => setShowModeMenu(false)} />}

      {/* Highlight toolbar */}
      {selection && session && (
        <HighlightToolbar
          selection={selection}
          onHighlight={async (sel) => {
            clearSelection();
            const h = await addHighlight({
              session_id: session.id,
              note_id: sel.noteId,
              highlighted_text: sel.text,
              start_offset: sel.startOffset,
              end_offset: sel.endOffset,
            });
            setActivePanelHighlightId(h.id);
            showToast("Highlighted!");
          }}
          onCreateTask={(sel) => {
            clearSelection();
            setTaskPrefill({ text: sel.text, noteId: sel.noteId });
          }}
          onDismiss={clearSelection}
        />
      )}

      {/* Highlight side panel */}
      {activePanelHighlight && (
        <HighlightSidePanel
          highlight={activePanelHighlight}
          onClose={() => setActivePanelHighlightId(null)}
          onSaveNote={async (id, note) => { await updateHL(id, { note }); }}
          onDelete={async (id) => { await removeHighlight(id); }}
          onCreateTask={(h) => {
            setActivePanelHighlightId(null);
            setTaskPrefill({ text: h.highlighted_text, noteId: h.note_id });
          }}
        />
      )}

      {/* Task modal from highlight */}
      {taskPrefill && session && (
        <TaskModal
          prefillTitle={taskPrefill.text.slice(0, 80)}
          onSave={async (data) => {
            const task = await addTask({
              ...data,
              source: "from_highlight",
              session_id: session.id,
            });
            await addHighlight({
              session_id: session.id,
              note_id: taskPrefill.noteId,
              highlighted_text: taskPrefill.text.slice(0, 80),
              start_offset: 0,
              end_offset: taskPrefill.text.length,
            });
            setTaskPrefill(null);
            showToast("Task created from highlight!");
          }}
          onClose={() => setTaskPrefill(null)}
        />
      )}
    </div>
  );
}

// ── Conversation chunk chat ──
function ConversationChat({ speakerNotes, sessionId }: { speakerNotes: Note[]; sessionId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationText = speakerNotes
    .map((n) => `${n.speaker ?? "Unknown"}: ${n.content}`)
    .join("\n");

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await chatAboutConversation(sessionId, conversationText, question, messages);
      setMessages([...next, { role: "assistant", content: res.data.answer }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, couldn't answer that — try again." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      className="mx-1 mt-1 mb-3 rounded-2xl overflow-hidden shadow-sm"
      style={{ border: "1px solid rgba(17,17,17,.12)" }}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-all"
        style={{ backgroundColor: "rgba(17,17,17,.06)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(17,17,17,.10)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(17,17,17,.06)"; }}
      >
        <span className="flex items-center gap-2 text-lg font-bold" style={{ color: "#111111" }}>
          <MessageSquare size={13} />
          Ask about this conversation
          {messages.length > 0 && (
            <span
              className="text-base font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: "#111111",
                backgroundColor: "rgba(17,17,17,.10)",
                border: "1px solid rgba(17,17,17,.18)",
              }}
            >
              {(messages.length / 2) | 0} Q&A
            </span>
          )}
        </span>
        <ChevronDown size={13} style={{ color: "#8A8A8A" }}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div style={{ backgroundColor: "#ffffff", borderTop: "1px solid rgba(17,17,17,.08)" }}>
          {messages.length === 0 && !loading && (
            <p className="text-base px-4 pt-3 pb-1 font-medium" style={{ color: "#8A8A8A" }}>
              Ask anything about what was said, who said it, or what to do next.
            </p>
          )}

          {(messages.length > 0 || loading) && (
            <div className="px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div
                      className="rounded-xl px-3 py-2 max-w-[85%] shadow-sm"
                      style={{
                        backgroundColor: "rgba(17,17,17,.08)",
                        border: "1px solid rgba(17,17,17,.12)",
                      }}
                    >
                      <p className="text-lg font-medium" style={{ color: "#111111" }}>{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start gap-2 items-start">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: "rgba(17,17,17,.10)",
                        border: "1px solid rgba(17,17,17,.18)",
                        color: "#111111",
                      }}
                    >
                      <Bot size={13} />
                    </div>
                    <div
                      className="rounded-xl px-3 py-2 max-w-[85%] shadow-sm"
                      style={{
                        backgroundColor: "rgba(17,17,17,.07)",
                        border: "1px solid rgba(17,17,17,.15)",
                      }}
                    >
                      <p className="text-lg leading-relaxed font-medium" style={{ color: "#111111" }}>{msg.content}</p>
                    </div>
                  </div>
                )
              )}
              {loading && (
                <div className="flex justify-start gap-2 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "rgba(17,17,17,.10)",
                      border: "1px solid rgba(17,17,17,.18)",
                      color: "#111111",
                    }}
                  >
                    <Bot size={13} />
                  </div>
                  <div
                    className="rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: "rgba(17,17,17,.07)",
                      border: "1px solid rgba(17,17,17,.15)",
                    }}
                  >
                    <p className="text-lg animate-pulse font-medium" style={{ color: "#111111" }}>Thinking…</p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderTop: "1px solid rgba(17,17,17,.08)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask a question about this conversation…"
              disabled={loading}
              className="flex-1 rounded-xl px-3 py-2 text-lg font-medium disabled:opacity-50 focus:outline-none"
              style={{
                backgroundColor: "rgba(17,17,17,.05)",
                border: "1px solid rgba(17,17,17,.12)",
                color: "#111111",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "#111111";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(17,17,17,.10)";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "rgba(17,17,17,.12)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 text-white"
              style={{ backgroundColor: "#111111" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#000000"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#111111"; }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Note bubble ──
function NoteBubble({
  note, speakerOrder, tags, onDelete, onNoteUpdate, noteHighlights, onHighlightClick,
}: {
  note: Note;
  speakerOrder: string[];
  tags: Tag[];
  onDelete: (id: number) => void;
  onNoteUpdate?: (updated: Note) => void;
  noteHighlights?: Highlight[];
  onHighlightClick?: (h: Highlight) => void;
}) {
  const tagColor = tags.find((t) => t.name === note.tag)?.color;

  // ── Conversation speaker note (editable) ──
  if (note.source === "conversation_speaker") {
    return (
      <SpeakerBubble
        note={note}
        speakerOrder={speakerOrder}
        onNoteUpdate={onNoteUpdate}
        noteHighlights={noteHighlights ?? []}
        onHighlightClick={onHighlightClick ?? (() => {})}
      />
    );
  }

  // Conversation summary card
  if (note.source === "conversation_summary") {
    let data: Record<string, string[]> = {};
    try { data = JSON.parse(note.content); } catch { return null; }
    return (
      <div
        className="rounded-2xl p-4 mx-1 shadow-sm"
        style={{
          backgroundColor: "white",
          border: "1px solid rgba(17,17,17,.12)",
        }}
      >
        <p className="text-base font-bold mb-3 flex items-center gap-1.5" style={{ color: "#111111" }}>
          <ClipboardList size={15} /> Conversation Summary
        </p>
        <div className="space-y-2">
          {Object.entries(data).map(([key, items]) =>
            items && items.length > 0 ? (
              <div key={key}>
                <p className="text-base font-bold capitalize mb-1" style={{ color: "#8A8A8A" }}>
                  {key.replace(/_/g, " ")}
                </p>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
                    <span style={{ color: "#8A8A8A" }} className="flex-shrink-0">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  // Conversation evaluation card
  if (note.source === "conversation_evaluation") {
    let evals: string[] = [];
    try { evals = JSON.parse(note.content); } catch { return null; }
    return (
      <div
        className="rounded-2xl p-4 mx-1 shadow-sm"
        style={{
          backgroundColor: "rgba(17,17,17,.05)",
          border: "1px solid rgba(17,17,17,.12)",
        }}
      >
        <p className="text-base font-bold mb-3 flex items-center gap-1.5" style={{ color: "#111111" }}>
          <BarChart3 size={15} /> Key Evaluations
        </p>
        <div className="space-y-2">
          {evals.map((e, i) => (
            <div key={i} className="flex gap-2 text-lg font-medium" style={{ color: "#111111" }}>
              <span style={{ color: "#8A8A8A" }} className="flex-shrink-0">•</span>
              <span>{e}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // AI suggestion — left side with robot avatar
  if (note.source === "ai_suggestion") {
    return (
      <div className="flex items-end gap-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md border-2 border-white"
          style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
        >
          <Bot size={20} />
        </div>
        <div
          className="max-w-[78%] rounded-[28px] px-5 py-3.5 shadow-sm"
          style={{
            backgroundColor: "white",
            border: "1px solid rgba(17,17,17,.15)",
          }}
        >
          <p className="text-sm font-bold mb-1.5 tracking-wide" style={{ color: "#111111" }}>
            AI Suggestion
          </p>
          <p className="text-lg leading-relaxed font-medium" style={{ color: "#111111" }}>{note.content}</p>
          <p className="text-sm mt-2 font-semibold" style={{ color: "#8A8A8A" }}>
            {new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  // User note (voice or text) — right side with "Me" avatar
  return (
    <div className="flex items-end justify-end gap-3 group">
      <div
        className="max-w-[78%] rounded-[28px] px-5 py-3.5 shadow-sm"
        style={{
          backgroundColor: "rgba(17,17,17,.09)",
          border: "1px solid rgba(17,17,17,.16)",
        }}
      >
        {note.tag && (
          <span
            className="inline-block text-sm px-2 py-0.5 rounded-full font-bold mb-1.5"
            style={{
              backgroundColor: (tagColor ?? "#111111") + "22",
              color: tagColor ?? "#111111",
              border: `1px solid ${(tagColor ?? "#111111")}44`,
            }}
          >
            {note.tag}
          </span>
        )}
        <div className="flex items-start gap-2">
          <span className="leading-none mt-0.5 flex-shrink-0" style={{ color: "#111111" }}>
            {note.source === "voice" ? <Mic size={16} /> : <Pencil size={16} />}
          </span>
          <p
            className="text-lg leading-relaxed whitespace-pre-wrap font-semibold"
            style={{ color: "#111111" }}
            data-note-id={note.id}
          >
            {noteHighlights && noteHighlights.length > 0
              ? renderWithHighlights(note.content, noteHighlights, onHighlightClick ?? (() => {}))
              : note.content}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 mt-2">
          <p className="text-sm font-semibold" style={{ color: "#111111" }}>
            {new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <button
            onClick={() => onDelete(note.id)}
            className="opacity-0 group-hover:opacity-100 transition-all"
            style={{ color: "#8A8A8A" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#111111"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8A8A8A"; }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-base font-bold shadow-md border-2 border-white/50 text-white"
        style={{ backgroundColor: "#111111" }}
      >
        Me
      </div>
    </div>
  );
}

// ── Speaker bubble with inline edit ──
function SpeakerBubble({
  note, speakerOrder, onNoteUpdate, noteHighlights, onHighlightClick,
}: {
  note: Note;
  speakerOrder: string[];
  onNoteUpdate?: (updated: Note) => void;
  noteHighlights: Highlight[];
  onHighlightClick: (h: Highlight) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(note.content);
  const [reformatting, setReformatting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editVal if note content changes externally (e.g. after reformat)
  useEffect(() => {
    if (!isEditing) setEditVal(note.content);
  }, [note.content, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!editVal.trim()) return;
    try {
      const saved = await updateNote(note.id, editVal.trim());
      onNoteUpdate?.(saved.data);
      setIsEditing(false);
      setReformatting(true);
      const reformatted = await reformatNote(note.id);
      onNoteUpdate?.(reformatted.data);
    } catch {
      // silently — note was saved even if reformat fails
    } finally {
      setReformatting(false);
    }
  };

  const handleCancel = () => {
    setEditVal(note.content);
    setIsEditing(false);
  };

  const speakerIdx = speakerOrder.indexOf(note.speaker ?? "");
  const isP2 = speakerIdx === 1;
  const initial = (note.speaker ?? "?")[0].toUpperCase();
  const bubbleBg = isP2 ? "#111111" : "#111111";
  const time = new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const avatar = (
    <div
      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-md border-2 border-white/40 text-white"
      style={{ backgroundColor: isP2 ? "#111111" : "#111111" }}
    >
      {initial}
    </div>
  );

  const contentArea = isEditing ? (
    <textarea
      ref={textareaRef}
      value={editVal}
      onChange={(e) => setEditVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") handleCancel();
      }}
      rows={Math.max(3, editVal.split("\n").length)}
      className="w-full text-lg leading-relaxed font-medium resize-none outline-none"
      style={{
        backgroundColor: "rgba(255,255,255,.12)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,.25)",
        color: "#ffffff",
        padding: "6px 8px",
        fontFamily: "inherit",
      }}
    />
  ) : (
    <p
      className="text-lg text-white leading-relaxed font-medium"
      data-note-id={note.id}
      style={{ textAlign: isP2 ? "right" : "left" }}
    >
      {noteHighlights.length > 0
        ? renderWithHighlights(note.content, noteHighlights, onHighlightClick)
        : note.content}
    </p>
  );

  const topRow = (
    <div className="flex items-center justify-between mb-1.5">
      <p className={`text-sm text-white/55 font-bold tracking-wide ${isP2 ? "order-2" : ""}`}>
        {note.speaker ?? "Unknown"}
      </p>
      <div className={`flex items-center gap-1.5 ${isP2 ? "order-1" : ""}`}>
        {note.is_edited && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.50)" }}
          >
            Edited
          </span>
        )}
        {reformatting && (
          <span
            className="text-xs font-bold animate-pulse"
            style={{ color: "rgba(255,255,255,.50)" }}
          >
            Formatting…
          </span>
        )}
        {!isEditing && !reformatting && hovered && (
          <button
            onClick={() => setIsEditing(true)}
            className="transition-opacity"
            style={{ color: "rgba(255,255,255,.55)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.90)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.55)"; }}
            title="Edit transcript"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>
    </div>
  );

  const bubble = (
    <div
      className="rounded-[28px] px-5 py-3.5 shadow-lg"
      style={{ backgroundColor: bubbleBg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {topRow}
      {contentArea}
      <p
        className="text-sm text-white/45 mt-2 font-semibold"
        style={{ textAlign: isP2 ? "right" : "left" }}
      >
        {time}
      </p>
    </div>
  );

  const saveCancel = isEditing && (
    <div className="flex gap-2 mt-1 px-1">
      <button
        onClick={handleSave}
        className="text-base font-bold px-3 py-1 rounded-full text-white transition-all"
        style={{ backgroundColor: "#111111" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#000000"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111111"; }}
      >
        Save
      </button>
      <button
        onClick={handleCancel}
        className="text-base font-bold px-3 py-1 rounded-full transition-all"
        style={{ color: "rgba(17,17,17,.55)", backgroundColor: "rgba(17,17,17,.08)" }}
      >
        Cancel
      </button>
    </div>
  );

  if (isP2) {
    return (
      <div className="flex items-end justify-end gap-3">
        <div className="max-w-[78%] flex flex-col items-end">
          {bubble}
          {saveCancel}
        </div>
        {avatar}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      {avatar}
      <div className="max-w-[78%] flex flex-col">
        {bubble}
        {saveCancel}
      </div>
    </div>
  );
}
