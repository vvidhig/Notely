import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TaskModal from "../components/TaskModal";
import { useHighlights } from "../hooks/useHighlights";
import { useTasks } from "../hooks/useTasks";
import { listSessions } from "../services/api";
import type { Highlight, Session } from "../types";
import { Pin, Search, Copy, Trash2, Download, ExternalLink, Sparkles } from "lucide-react";

/* ─── page ────────────────────────────────────────────────────────────── */

export default function HighlightsPage() {
  const navigate = useNavigate();
  const { highlights, loading, loadAll, remove, linkTask } = useHighlights();
  const { add: addTask } = useTasks();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [filterPin, setFilterPin] = useState<"all" | "pinned">("all");
  const [search, setSearch] = useState("");
  const [bySession, setBySession] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [taskHighlight, setTaskHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    loadAll();
    listSessions().then((r) => setSessions(r.data)).catch(() => { });
  }, []);

  /* helpers */
  const sessionTitle = (id: number) =>
    sessions.find((s) => s.id === id)?.title ?? `Session ${id}`;

  const sessionGroups = useMemo(() => {
    const map = new Map<number, number>();
    highlights.forEach((h) => map.set(h.session_id, (map.get(h.session_id) ?? 0) + 1));
    return [...map.entries()]
      .map(([id, count]) => ({ id, title: sessionTitle(id), count }))
      .sort((a, b) => b.count - a.count);
  }, [highlights, sessions]);

  const filtered = useMemo(() => {
    return highlights.filter((h) => {
      if (filterPin === "pinned" && !pinnedIds.has(h.id)) return false;
      if (bySession !== null && h.session_id !== bySession) return false;
      if (search && !h.highlighted_text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [highlights, filterPin, bySession, search, pinnedIds]);

  const pinnedHighlights = filtered.filter((h) => pinnedIds.has(h.id));
  const unpinnedHighlights = filtered.filter((h) => !pinnedIds.has(h.id));

  /* pin toggle */
  const togglePin = (id: number) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* copy */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => { });
  };

  /* export */
  const exportAllMd = () => {
    const lines = ["# Highlights\n"];
    const bySessionMap = new Map<number, Highlight[]>();
    highlights.forEach((h) => {
      if (!bySessionMap.has(h.session_id)) bySessionMap.set(h.session_id, []);
      bySessionMap.get(h.session_id)!.push(h);
    });
    bySessionMap.forEach((hs, sid) => {
      lines.push(`## ${sessionTitle(sid)}\n`);
      hs.forEach((h) => lines.push(`- "${h.highlighted_text}"\n`));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "highlights.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* create task from highlight */
  const handleSaveTask = async (data: Parameters<typeof addTask>[0]) => {
    const task = await addTask({
      ...data,
      source: "from_highlight",
      highlight_id: taskHighlight?.id,
      session_id: taskHighlight?.session_id,
    });
    if (taskHighlight) await linkTask(taskHighlight.id, task.id);
    setTaskHighlight(null);
    loadAll();
  };

  const pageBg = {
    backgroundColor: "#FFFFFF",
  };

  return (
    <div className="flex h-[100dvh]" style={pageBg}>
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-6">

          {/* ── header ────────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="font-['Yeseva_One'] text-4xl font-bold" style={{ color: "#111111" }}>
                Highlights
              </h1>
              <p className="text-lg mt-0.5" style={{ color: "rgba(17,17,17,.55)" }}>
                {highlights.length} highlights from {sessionGroups.length} sessions
              </p>
            </div>
            <button
              onClick={exportAllMd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold transition-all"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(17,17,17,.12)",
                color: "#111111",
                boxShadow: "0 2px 8px rgba(17,17,17,.05)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"; }}
            >
              <Download size={14} /> Export all
            </button>
          </div>

          {/* ── recap card ────────────────────────────────────────── */}
          <div
            className="mb-5 rounded-2xl p-5"
            style={{ backgroundColor: "#111111" }}
          >
            <p className="text-sm uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,.50)" }}>
              THIS WEEK'S RECAP
            </p>
            <div className="flex gap-8">
              <div>
                <p className="text-4xl font-bold text-white">{highlights.length}</p>
                <p className="text-base" style={{ color: "rgba(255,255,255,.60)" }}>Highlights</p>
              </div>
              <div>
                <p className="text-4xl font-bold" style={{ color: "#FFFFFF" }}>
                  {highlights.filter((h) => h.task_id).length}
                </p>
                <p className="text-base" style={{ color: "rgba(255,255,255,.60)" }}>Converted</p>
              </div>
              <div>
                <p className="text-4xl font-bold" style={{ color: "#FFFFFF" }}>
                  {sessionGroups.length}
                </p>
                <p className="text-base" style={{ color: "rgba(255,255,255,.60)" }}>Sessions</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white">{pinnedIds.size}</p>
                <p className="text-base" style={{ color: "rgba(255,255,255,.60)" }}>Pinned</p>
              </div>
            </div>
          </div>

          {/* ── two-column layout ─────────────────────────────────── */}
          <div className="flex gap-5">

            {/* main content */}
            <div className="flex-1 min-w-0">

              {/* filter tabs + search */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1.5">
                  {(["all", "pinned"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterPin(f)}
                      className="px-4 py-1.5 rounded-xl text-lg font-bold transition-all"
                      style={{
                        backgroundColor: filterPin === f ? "#111111" : "rgba(17,17,17,.08)",
                        color: filterPin === f ? "#ffffff" : "#111111",
                      }}
                    >
                      {f === "pinned" ? "Pinned" : "All"}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(17,17,17,.40)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search highlights…"
                    className="pl-8 pr-3 py-1.5 rounded-xl text-lg outline-none"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(17,17,17,.10)",
                      color: "#111111",
                      width: "192px",
                    }}
                  />
                </div>
              </div>

              {/* loading */}
              {loading && (
                <div className="flex justify-center py-20">
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: "#111111", borderTopColor: "transparent" }}
                  />
                </div>
              )}

              {/* empty */}
              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "rgba(17,17,17,.08)" }}
                  >
                    <Sparkles size={28} style={{ color: "#111111" }} />
                  </div>
                  <h3 className="font-['Yeseva_One'] text-4xl font-bold mb-2" style={{ color: "#111111" }}>
                    No highlights yet
                  </h3>
                  <p className="text-lg font-medium" style={{ color: "rgba(17,17,17,.55)" }}>
                    Select text in a session transcript to highlight important moments.
                  </p>
                </div>
              )}

              {/* pinned section */}
              {!loading && pinnedHighlights.length > 0 && (
                <>
                  <p
                    className="text-sm font-bold uppercase tracking-widest mb-2"
                    style={{ color: "rgba(17,17,17,.55)" }}
                  >
                    PINNED
                  </p>
                  <div className="space-y-3 mb-5">
                    {pinnedHighlights.map((h) => (
                      <HighlightCard
                        key={h.id}
                        h={h}
                        isPinned
                        sessionTitle={sessionTitle(h.session_id)}
                        onPin={() => togglePin(h.id)}
                        onDelete={() => remove(h.id)}
                        onCopy={() => handleCopy(h.highlighted_text)}
                        onCreateTask={() => setTaskHighlight(h)}
                        onViewSession={() => navigate(`/session/${h.session_id}/summary`)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* all unpinned */}
              {!loading && filterPin === "all" && unpinnedHighlights.length > 0 && (
                <div className="space-y-3">
                  {unpinnedHighlights.map((h) => (
                    <HighlightCard
                      key={h.id}
                      h={h}
                      isPinned={false}
                      sessionTitle={sessionTitle(h.session_id)}
                      onPin={() => togglePin(h.id)}
                      onDelete={() => remove(h.id)}
                      onCopy={() => handleCopy(h.highlighted_text)}
                      onCreateTask={() => setTaskHighlight(h)}
                      onViewSession={() => navigate(`/session/${h.session_id}/summary`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* right sidebar */}
            <div className="flex-shrink-0 space-y-4" style={{ width: "224px" }}>

              {/* by session */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#ffffff", border: "1px solid rgba(17,17,17,.08)", boxShadow: "0 2px 8px rgba(17,17,17,.05)" }}
              >
                <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(17,17,17,.55)" }}>
                  BY SESSION
                </p>
                {sessionGroups.length === 0 ? (
                  <p className="text-base" style={{ color: "rgba(17,17,17,.40)" }}>No sessions yet</p>
                ) : (
                  <div className="space-y-0.5">
                    {sessionGroups.map((sg) => (
                      <button
                        key={sg.id}
                        onClick={() => setBySession(bySession === sg.id ? null : sg.id)}
                        className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-lg transition-all text-left"
                        style={{
                          backgroundColor: bySession === sg.id ? "rgba(17,17,17,.08)" : "transparent",
                          color: "#111111",
                        }}
                        onMouseEnter={(e) => {
                          if (bySession !== sg.id)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.04)";
                        }}
                        onMouseLeave={(e) => {
                          if (bySession !== sg.id)
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                        }}
                      >
                        <span className="truncate font-medium text-base pr-2">{sg.title}</span>
                        <span
                          className="text-sm px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold"
                          style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
                        >
                          {sg.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* quick actions */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#ffffff", border: "1px solid rgba(17,17,17,.08)", boxShadow: "0 2px 8px rgba(17,17,17,.05)" }}
              >
                <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(17,17,17,.55)" }}>
                  QUICK ACTIONS
                </p>
                <button
                  onClick={exportAllMd}
                  className="flex items-center gap-2 text-lg py-1.5 w-full rounded-lg px-2 transition-all text-left"
                  style={{ color: "#111111" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                >
                  <Download size={13} />
                  <span className="text-base font-medium">Export as Markdown</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {taskHighlight && (
        <TaskModal
          prefillTitle={taskHighlight.highlighted_text.slice(0, 80)}
          prefillDescription={`Highlighted from session: ${sessionTitle(taskHighlight.session_id)}`}
          onSave={handleSaveTask}
          onClose={() => setTaskHighlight(null)}
        />
      )}
    </div>
  );
}

/* ─── highlight card ──────────────────────────────────────────────────── */

function HighlightCard({
  h,
  isPinned,
  sessionTitle,
  onPin,
  onDelete,
  onCopy,
  onCreateTask,
  onViewSession,
}: {
  h: Highlight;
  isPinned: boolean;
  sessionTitle: string;
  onPin: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onCreateTask: () => void;
  onViewSession: () => void;
}) {
  return (
    <div
      className="group"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid rgba(17,17,17,.08)",
        borderLeft: `3px solid ${isPinned ? "#111111" : "#8A8A8A"}`,
        padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(17,17,17,.05)",
      }}
    >
      {/* top row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-bold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(17,17,17,.20)", color: "#111111" }}
        >
          <Sparkles size={11} className="inline mr-1" />Highlight
        </span>
        {isPinned && (
          <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: "#111111" }}>
            <Pin size={10} /> PINNED
          </span>
        )}
      </div>

      {/* text */}
      <p className="text-lg leading-relaxed mb-3" style={{ color: "#111111" }}>
        {h.highlighted_text}
      </p>

      {/* bottom row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onViewSession}
          className="flex items-center gap-1 text-base transition-all"
          style={{ color: "rgba(17,17,17,.55)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#111111"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(17,17,17,.55)"; }}
        >
          <ExternalLink size={10} />
          <span>{sessionTitle}</span>
          <span>·</span>
          <span>
            {new Date(h.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {!h.task_id ? (
            <button
              onClick={onCreateTask}
              className="text-sm font-bold px-2.5 py-1 rounded-lg transition-all"
              style={{ backgroundColor: "rgba(17,17,17,.08)", color: "#111111" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.14)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.08)"; }}
            >
              + Task
            </button>
          ) : (
            <span className="text-sm font-bold" style={{ color: "#8A8A8A" }}>✓ Task</span>
          )}

          <button
            onClick={onCopy}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "rgba(17,17,17,.45)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            title="Copy text"
          >
            <Copy size={13} />
          </button>

          <button
            onClick={onPin}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: isPinned ? "#111111" : "rgba(17,17,17,.45)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Pin size={13} style={{ fill: isPinned ? "#111111" : "none" }} />
          </button>

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "rgba(17,17,17,.45)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#111111"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(17,17,17,.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(17,17,17,.45)"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
            title="Delete highlight"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
