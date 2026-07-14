import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { useTasks } from "../hooks/useTasks";
import { listTasks } from "../services/api";
import Sidebar from "../components/Sidebar";
import CalendarWidget from "../components/CalendarWidget";
import QuickCapture from "../components/QuickCapture";
import ClockCard from "../components/ClockCard";
import TaskModal from "../components/TaskModal";
import type { Task } from "../types";
import { SESSION_TYPES } from "../constants/sessionTypes";
import { QUADRANT_CONFIG } from "../constants/quadrants";
import { CheckCircle2, Circle, Calendar, Clock, ArrowRight, Loader2, Star, ClipboardList, Mic, Lightbulb } from "lucide-react";

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function greetingSubtitle(taskCount: number) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `${today} — ${taskCount} task${taskCount !== 1 ? "s" : ""} remaining`;
}

function formatDate(d: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (d === today) return "Today";
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (d === tomorrow) return "Tomorrow";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function isOverdue(d?: string | null) {
  if (!d) return false;
  return d < new Date().toISOString().slice(0, 10);
}


function ProgressRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="flex items-center gap-5">
      <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(17,17,17,.12)" strokeWidth="7" />
        <circle
          cx="42" cy="42" r={r} fill="none"
          stroke="#111111" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={`${offset}`}
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
        <text x="42" y="40" textAnchor="middle" dominantBaseline="middle"
          fontSize="13" fontWeight="700" fill="#111111" fontFamily="sans-serif">
          {Math.round(pct)}%
        </text>
      </svg>
      <div>
        <p className="font-bold text-xl" style={{ color: "#111111" }}>{done}/{total} tasks</p>
        <p className="text-base font-medium mt-0.5" style={{ color: "rgba(17,17,17,.55)" }}>
          {done === 0 ? "Tap tasks to mark complete" : `${done} done today`}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { summary } = useDashboard();
  const { add, update, toggle } = useTasks();
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [activeRes, completedRes] = await Promise.all([
        listTasks({ status: "active" }),
        listTasks({ status: "completed" }),
      ]);
      const sorted = [...activeRes.data].sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        const da = a.due_date + (a.due_time || "00:00");
        const db = b.due_date + (b.due_time || "00:00");
        return da.localeCompare(db);
      });
      setActiveTasks(sorted);
      setCompletedCount(completedRes.data.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const handleToggle = async (id: number) => { await toggle(id); await loadTasks(); };
  const handleSave = async (data: Parameters<typeof add>[0]) => {
    if (editTask) await update(editTask.id, data);
    else await add({ ...data, quadrant: data.quadrant ?? "neither" });
    await loadTasks();
    setModalOpen(false);
    setEditTask(null);
  };

  const totalTasks = activeTasks.length + completedCount;
  const pct = totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100;

  return (
    <div className="flex h-[100dvh]" style={{
      backgroundColor: "#FFFFFF",
    }}>
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Navy header — matches sidebar */}
        <div
          className="flex-shrink-0 px-6 py-5 flex items-center justify-between"
          style={{ backgroundColor: "#111111" }}
        >
          <div>
            <h1 className="font-['Yeseva_One'] text-4xl font-bold text-white leading-tight">
              {greeting(user?.name ?? "there")}
            </h1>
            <p className="text-lg mt-1 font-medium" style={{ color: "rgba(255,255,255,.65)" }}>
              {greetingSubtitle(activeTasks.length)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2.5 text-center"
              style={{ backgroundColor: "rgba(0,0,0,.18)", borderRadius: "14px", minWidth: "80px" }}
            >
              <p className="text-sm font-bold uppercase tracking-widest text-white/60">Due today</p>
              <p className="text-4xl font-bold text-white mt-0.5">
                {activeTasks.filter(t => t.due_date === new Date().toISOString().slice(0, 10)).length}
              </p>
            </div>
            <div
              className="px-4 py-2.5 text-center"
              style={{ backgroundColor: "rgba(0,0,0,.18)", borderRadius: "14px", minWidth: "80px" }}
            >
              <p className="text-sm font-bold uppercase tracking-widest text-white/60">Sessions</p>
              <p className="text-4xl font-bold text-white mt-0.5">
                {summary?.sessions_this_week ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Capture */}
        <div className="px-4 pt-3 flex-shrink-0">
          <QuickCapture onAdd={async (title) => {
            await add({ title, quadrant: "neither" });
            await loadTasks();
          }} />
        </div>

        {/* Three-column body */}
        <div className="flex-1 flex gap-3 px-4 pb-4 pt-3 overflow-hidden min-w-0">

          {/* LEFT — Upcoming Tasks */}
          <div className="flex flex-col overflow-hidden" style={{ flex: "0 0 48%" }}>
            <div
              className="flex flex-col flex-1 overflow-hidden"
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid rgba(17,17,17,.08)",
                boxShadow: "0 8px 32px rgba(17,17,17,.07)",
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} style={{ color: "#111111" }} />
                  <p className="font-bold text-lg" style={{ color: "#111111" }}>Upcoming Tasks</p>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
                  >
                    {activeTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => { setEditTask(null); setModalOpen(true); }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-lg font-bold transition-all"
                  style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(17,17,17,.18)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(17,17,17,.10)"; }}
                >
                  +
                </button>
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={18} className="animate-spin" style={{ color: "rgba(17,17,17,.40)" }} />
                  </div>
                ) : activeTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium" style={{ color: "rgba(17,17,17,.50)" }}>
                      No tasks — you're all caught up!
                    </p>
                  </div>
                ) : (
                  activeTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onEdit={() => { setEditTask(task); setModalOpen(true); }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE — Recent Sessions + Daily Progress */}
          <div className="flex flex-col gap-3 overflow-hidden" style={{ flex: "0 0 28%" }}>
            {/* Recent Sessions */}
            <div
              className="flex flex-col overflow-hidden"
              style={{
                flex: "1 1 0",
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid rgba(17,17,17,.08)",
                boxShadow: "0 8px 32px rgba(17,17,17,.07)",
              }}
            >
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
                <div className="flex items-center gap-2">
                  <Mic size={18} style={{ color: "#111111" }} />
                  <p className="font-bold text-lg" style={{ color: "#111111" }}>Recent Sessions</p>
                </div>
                <button
                  onClick={() => navigate("/sessions")}
                  className="flex items-center gap-1 text-base font-bold"
                  style={{ color: "#111111" }}
                >
                  All <ArrowRight size={11} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                {(summary?.recent_sessions ?? []).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-base font-medium" style={{ color: "rgba(17,17,17,.50)" }}>No sessions yet</p>
                    <button
                      onClick={() => navigate("/sessions")}
                      className="mt-2 text-base font-bold"
                      style={{ color: "#111111" }}
                    >
                      Start a new session →
                    </button>
                  </div>
                ) : (
                  summary!.recent_sessions.map((s) => {
                    const tc = SESSION_TYPES.find(x => x.value === s.session_type);
                    return (
                      <div
                        key={s.id}
                        onClick={() => navigate(s.status === "active" ? `/session/${s.id}` : `/session/${s.id}/summary`)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: "rgba(17,17,17,.04)",
                          border: "1px solid rgba(17,17,17,.07)",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,.08)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,.04)"; }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
                        >
                          {tc ? <tc.icon size={15} /> : <ClipboardList size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold truncate" style={{ color: "#111111" }}>{s.title}</p>
                          <p className="text-sm font-semibold mt-0.5" style={{ color: "rgba(17,17,17,.55)" }}>
                            {s.note_count} notes · {new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <ArrowRight size={11} style={{ color: "rgba(17,17,17,.35)", flexShrink: 0 }} />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Empty session CTA */}
              {(summary?.recent_sessions ?? []).length === 0 && (
                <div className="flex-shrink-0 px-4 pb-4 text-center">
                  <div className="mb-2 flex justify-center" style={{ color: "#111111" }}><Mic size={26} /></div>
                  <p className="text-base font-bold" style={{ color: "#111111" }}>Start a new session</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "rgba(17,17,17,.50)" }}>
                    Record, transcribe, capture highlights
                  </p>
                </div>
              )}
            </div>

            {/* Daily Progress */}
            <div
              className="flex-shrink-0 px-5 py-4"
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                border: "1px solid rgba(17,17,17,.08)",
                boxShadow: "0 8px 32px rgba(17,17,17,.07)",
              }}
            >
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(17,17,17,.50)" }}>
                Daily Progress
              </p>
              <ProgressRing pct={pct} done={completedCount} total={totalTasks} />
            </div>
          </div>

          {/* RIGHT — Clock + Calendar + Highlights + Focus tip */}
          <div
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ flex: "0 0 calc(24% - 12px)" }}
          >
            <ClockCard />

            <CalendarWidget dots={summary?.calendar_dots ?? []} />

            {/* Highlights badge — Maroon */}
            <div
              className="px-3 py-3"
              style={{
                background: "#111111",
                borderRadius: "18px",
                boxShadow: "0 6px 20px rgba(17,17,17,.25)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star size={11} color="rgba(255,255,255,.65)" />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.65)" }}>
                    Highlights
                  </p>
                </div>
                <button
                  onClick={() => navigate("/highlights")}
                  className="text-sm font-bold text-white/70 hover:text-white flex items-center gap-0.5 transition-all"
                >
                  View all <ArrowRight size={10} />
                </button>
              </div>
              <p className="text-3xl font-bold text-white mt-1">
                {summary?.highlights_without_tasks ?? 0}
              </p>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,.60)" }}>
                {summary?.highlights_without_tasks === 1 ? "highlight" : "highlights"} this week
              </p>
            </div>

            {/* Focus tip — Peach */}
            <div
              className="px-3 py-3"
              style={{
                background: "#111111",
                borderRadius: "18px",
                boxShadow: "0 4px 14px rgba(17,17,17,.10)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb size={15} style={{ color: "rgba(255,255,255,.75)" }} />
                <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,.75)" }}>Focus tip</p>
              </div>
              <p className="text-sm font-medium leading-relaxed" style={{ color: "#FFFFFF" }}>
                Your best hours are 10 AM – 1 PM. Block them for deep work.
              </p>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit }: {
  task: Task;
  onToggle: (id: number) => void;
  onEdit: () => void;
}) {
  const done = task.status === "completed";
  const cfg = QUADRANT_CONFIG[task.quadrant];
  const overdue = isOverdue(task.due_date) && !done;

  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2 rounded-xl cursor-pointer group transition-all"
      style={{
        background: overdue ? "rgba(17,17,17,.04)" : "transparent",
        border: overdue ? "1px solid rgba(17,17,17,.12)" : "1px solid transparent",
      }}
      onClick={onEdit}
      onMouseEnter={e => { if (!overdue) (e.currentTarget as HTMLElement).style.background = "rgba(17,17,17,.04)"; }}
      onMouseLeave={e => { if (!overdue) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <button
        className="flex-shrink-0 mt-0.5 transition-all"
        style={{ color: done ? cfg.color : "rgba(17,17,17,.28)" }}
        onClick={e => { e.stopPropagation(); onToggle(task.id); }}
      >
        {done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-lg font-semibold leading-snug"
          style={{
            color: done ? "rgba(17,17,17,.40)" : "#111111",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.due_date && (
            <span
              className="flex items-center gap-0.5 text-sm font-semibold"
              style={{ color: overdue ? "#111111" : "rgba(17,17,17,.55)" }}
            >
              <Calendar size={9} />
              {formatDate(task.due_date)}
              {task.due_time && <> · <Clock size={9} /> {formatTime(task.due_time)}</>}
            </span>
          )}
          <span
            className="text-sm px-1.5 py-px rounded-full font-bold"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
          >
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}
