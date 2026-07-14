import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import type { Meeting, Task, Session } from "../types";
import {
  listMeetings, createMeeting, updateMeeting, deleteMeeting, startMeeting,
  listTasks, listSessions,
} from "../services/api";
import { Plus, ChevronLeft, ChevronRight, X, Calendar, Clock, Users, FileText, Loader2, CheckSquare, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const ROW_H   = 64;
const START_H = 0;
const END_H   = 23;
const HOURS   = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);
const DAY_ABB = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EV_CFG = {
  task_due: { label: "Task Due", color: "#111111", bg: "rgba(17,17,17,.08)",   icon: CheckSquare },
  session:  { label: "Session",  color: "#8A8A8A", bg: "rgba(17,17,17,.12)", icon: Mic },
  meeting:  { label: "Meeting",  color: "#111111", bg: "rgba(17,17,17,.08)",   icon: Users },
} as const;

// ── Interfaces ─────────────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  type: "task_due" | "session" | "meeting";
  title: string;
  subtitle?: string;
  date: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  meetingId?: number;
}

type MeetingForm = { title: string; date: string; time: string; end_time: string; participants: string; notes: string };

// ── Module-level helpers ───────────────────────────────────────────────────────
function getMonday(d: Date): Date {
  const dt = new Date(d);
  const dow = dt.getDay();
  dt.setDate(dt.getDate() + (dow === 0 ? -6 : 1 - dow));
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function ds(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmt12(h: number, m: number): string {
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function hourLabel(h: number): string {
  if (h === 0)  return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function fmtShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const navigate = useNavigate();

  // Data
  const [meetings, setMeetings]     = useState<Meeting[]>([]);
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [sessions, setSessions]     = useState<Session[]>([]);

  // View state
  const [view, setView]             = useState<"week" | "day">("week");
  const [weekStart, setWeekStart]   = useState<Date>(getMonday(new Date()));
  const [selDay, setSelDay]         = useState<Date>(new Date());
  const [activeType, setActiveType] = useState<string>("all");
  const [sideMonth, setSideMonth]   = useState(new Date());
  const [now, setNow]               = useState(new Date());

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [editMeeting, setEditMeeting]   = useState<Meeting | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [startingId, setStartingId]     = useState<number | null>(null);
  const [prefill, setPrefill]           = useState<{ date: string; time: string } | null>(null);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Promise.all([listMeetings(), listTasks({}), listSessions()])
      .then(([m, t, s]) => {
        setMeetings(m.data);
        setTasks((t.data as Task[]).filter((tk: Task) => tk.due_date));
        setSessions(s.data as Session[]);
      })
      .catch(() => {});
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const ev: CalendarEvent[] = [];

    tasks.filter(t => t.status !== "completed").forEach(t => {
      const [sh, sm] = t.due_time ? t.due_time.split(":").map(Number) : [9, 0];
      ev.push({
        id: `task-${t.id}`, type: "task_due",
        title: t.title, subtitle: t.tags ?? undefined,
        date: t.due_date!,
        startHour: sh, startMin: sm, endHour: sh + 1, endMin: sm,
        color: EV_CFG.task_due.color, bgColor: EV_CFG.task_due.bg, icon: EV_CFG.task_due.icon,
      });
    });

    sessions.forEach(s => {
      const st = new Date(s.started_at);
      const et = s.ended_at ? new Date(s.ended_at) : new Date(st.getTime() + 3600000);
      ev.push({
        id: `session-${s.id}`, type: "session",
        title: s.title, subtitle: s.session_type,
        date: ds(st),
        startHour: st.getHours(), startMin: st.getMinutes(),
        endHour: et.getHours(), endMin: et.getMinutes(),
        color: EV_CFG.session.color, bgColor: EV_CFG.session.bg, icon: EV_CFG.session.icon,
      });
    });

    meetings.forEach(m => {
      if (!m.date) return;
      const [sh, sm] = m.time ? m.time.split(":").map(Number) : [10, 0];
      const [eh, em] = m.end_time ? m.end_time.split(":").map(Number) : [sh + 1, sm];
      ev.push({
        id: `meeting-${m.id}`, type: "meeting",
        title: m.title, subtitle: m.participants ?? undefined,
        date: m.date,
        startHour: sh, startMin: sm, endHour: eh, endMin: em,
        color: EV_CFG.meeting.color, bgColor: EV_CFG.meeting.bg, icon: EV_CFG.meeting.icon,
        meetingId: m.id,
      });
    });

    return ev;
  }, [meetings, tasks, sessions]);

  const filtered = useMemo(() =>
    activeType === "all" ? allEvents : allEvents.filter(e => e.type === activeType),
    [allEvents, activeType]
  );

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  const today = ds(new Date());

  const eventsForDate = (d: Date | string) => {
    const target = typeof d === "string" ? d : ds(d);
    return filtered.filter(e => e.date === target);
  };

  const evTop = (e: CalendarEvent) => (e.startHour - START_H + e.startMin / 60) * ROW_H;
  const evH   = (e: CalendarEvent) =>
    Math.max(((e.endHour - e.startHour) + (e.endMin - e.startMin) / 60) * ROW_H, 40);

  const nowTop      = (now.getHours() - START_H + now.getMinutes() / 60) * ROW_H;
  const showNow     = now.getHours() >= START_H && now.getHours() <= END_H;
  const isCurrentWeek = weekDays.some(d => ds(d) === today);

  const weekLabel = (() => {
    const last = weekDays[6];
    const fmtD = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmtD(weekStart)} – ${last.getDate()}, ${last.getFullYear()}`;
  })();

  const thisWeekCount = weekDays.reduce((s, d) => s + eventsForDate(d).length, 0);

  const todaysAgenda = useMemo(() =>
    allEvents
      .filter(e => e.date === today)
      .sort((a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin)),
    [allEvents, today]
  );

  const upcomingDeadlines = useMemo(() =>
    tasks
      .filter(t => t.due_date && t.due_date >= today && t.status !== "completed")
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 6),
    [tasks, today]
  );

  // ── Event handlers ─────────────────────────────────────────────────────────
  const handleEventClick = (e: CalendarEvent) => {
    if (e.type === "session") {
      navigate(`/session/${e.id.replace("session-", "")}/summary`);
    } else if (e.type === "meeting" && e.meetingId) {
      const mtg = meetings.find(m => m.id === e.meetingId);
      if (mtg) { setEditMeeting(mtg); setPrefill(null); setModalOpen(true); }
    }
  };

  const handleSave = async (data: MeetingForm) => {
    setSaving(true);
    try {
      if (editMeeting) {
        const r = await updateMeeting(editMeeting.id, data);
        setMeetings(p => p.map(m => m.id === editMeeting.id ? r.data : m));
      } else {
        const r = await createMeeting(data);
        setMeetings(p => [r.data, ...p]);
      }
      setModalOpen(false);
      setEditMeeting(null);
      setPrefill(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteMeeting(id);
      setMeetings(p => p.filter(m => m.id !== id));
      setModalOpen(false);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStart = async (m: Meeting) => {
    setStartingId(m.id);
    try {
      const r = await startMeeting(m.id);
      navigate(`/session/${r.data.session_id}`);
    } finally {
      setStartingId(null);
    }
  };

  // ── Inner view functions (called as functions, not components) ─────────────
  function WeekView() {
    const handleColClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
      if ((e.target as HTMLElement).closest("[data-ev]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const fractionalHour = y / ROW_H + START_H;
      const hour   = Math.min(END_H, Math.max(START_H, Math.floor(fractionalHour)));
      const rawMin = (fractionalHour - Math.floor(fractionalHour)) * 60;
      const minute = rawMin >= 30 ? 30 : 0;
      const t = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      setPrefill({ date: ds(day), time: t });
      setEditMeeting(null);
      setModalOpen(true);
    };

    return (
      <div className="flex flex-col h-full">
        {/* Day headers */}
        <div className="flex flex-shrink-0 border-b" style={{ borderColor: "rgba(17,17,17,.08)" }}>
          <div className="w-14 flex-shrink-0" />
          {weekDays.map((day, i) => {
            const isTodayCol = ds(day) === today;
            return (
              <div key={i} className="flex-1 py-3 text-center border-l"
                style={{ borderColor: "rgba(17,17,17,.06)" }}>
                <p className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: "rgba(17,17,17,.55)" }}>
                  {DAY_ABB[i]}
                </p>
                <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center mt-0.5 text-lg font-bold"
                  style={{
                    backgroundColor: isTodayCol ? "#111111" : "transparent",
                    color: isTodayCol ? "#ffffff" : "#111111",
                    boxShadow: isTodayCol ? "0 2px 8px rgba(17,17,17,.30)" : "none",
                  }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{ minHeight: `${(END_H - START_H + 1) * ROW_H}px` }}>
            {/* Time labels */}
            <div className="w-14 flex-shrink-0 relative select-none">
              {HOURS.map(h => (
                <div key={h} className="absolute text-sm text-right pr-2 w-full"
                  style={{ top: (h - START_H) * ROW_H - 8, color: "rgba(17,17,17,.60)" }}>
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, i) => {
              const dayEvs = eventsForDate(day);
              const isTodayCol = ds(day) === today;
              return (
                <div key={i} className="flex-1 relative border-l cursor-pointer"
                  style={{
                    minHeight: `${(END_H - START_H + 1) * ROW_H}px`,
                    borderColor: "rgba(17,17,17,.06)",
                    backgroundColor: isTodayCol ? "rgba(17,17,17,.015)" : "transparent",
                  }}
                  onClick={(e) => handleColClick(e, day)}>
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div key={h} className="absolute left-0 right-0 pointer-events-none"
                      style={{
                        top: (h - START_H) * ROW_H,
                        borderBottom: h === END_H ? "none" : "1px dashed rgba(17,17,17,.15)",
                      }} />
                  ))}

                  {/* Events */}
                  {dayEvs.map(ev => (
                    <div key={ev.id}
                      data-ev="1"
                      onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer overflow-hidden transition-all hover:brightness-95"
                      style={{
                        top: evTop(ev),
                        height: evH(ev),
                        backgroundColor: ev.bgColor,
                        borderLeft: `3px solid ${ev.color}`,
                      }}>
                      <div className="flex items-center gap-1">
                        <ev.icon size={13} style={{ color: ev.color, flexShrink: 0 }} />
                        <p className="text-sm font-bold leading-tight truncate" style={{ color: ev.color }}>
                          {ev.title}
                        </p>
                      </div>
                      {ev.subtitle && evH(ev) >= 52 && (
                        <p className="text-sm truncate mt-0.5" style={{ color: "rgba(17,17,17,.55)" }}>
                          {ev.subtitle}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Current time line */}
                  {isTodayCol && isCurrentWeek && showNow && (
                    <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                      style={{ top: nowTop }}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 -translate-y-1/2"
                        style={{ backgroundColor: "#111111" }} />
                      <div className="flex-1 h-px" style={{ backgroundColor: "#111111" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function DayView() {
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-ev]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const fractionalHour = y / ROW_H + START_H;
      const hour   = Math.min(END_H, Math.max(START_H, Math.floor(fractionalHour)));
      const rawMin = (fractionalHour - Math.floor(fractionalHour)) * 60;
      const minute = rawMin >= 30 ? 30 : 0;
      const t = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      setPrefill({ date: ds(selDay), time: t });
      setEditMeeting(null);
      setModalOpen(true);
    };

    return (
      <div className="flex flex-col h-full">
        {/* 7-day selector header */}
        <div className="flex flex-shrink-0 border-b" style={{ borderColor: "rgba(17,17,17,.08)" }}>
          {weekDays.map((day, i) => {
            const isSel = ds(day) === ds(selDay);
            const isToD = ds(day) === today;
            return (
              <button key={i} onClick={() => setSelDay(day)}
                className="flex-1 py-3 text-center border-l transition-all"
                style={{
                  borderColor: "rgba(17,17,17,.06)",
                  backgroundColor: isSel ? "#111111" : "transparent",
                }}>
                <p className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: isSel ? "rgba(255,255,255,.65)" : "rgba(17,17,17,.60)" }}>
                  {DAY_ABB[i]}
                </p>
                <p className="text-3xl font-bold mt-0.5"
                  style={{ color: isSel ? "#ffffff" : isToD ? "#111111" : "rgba(17,17,17,.65)" }}>
                  {day.getDate()}
                </p>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative cursor-pointer" style={{ minHeight: `${(END_H - START_H + 1) * ROW_H}px` }}
            onClick={handleTimelineClick}>
            {/* Hour rows */}
            {HOURS.map(h => (
              <div key={h} className="flex items-start absolute left-0 right-0 pointer-events-none"
                style={{ top: (h - START_H) * ROW_H, height: ROW_H }}>
                <div className="w-14 flex-shrink-0 text-sm text-right pr-3 pt-1 select-none"
                  style={{ color: "rgba(17,17,17,.60)" }}>
                  {hourLabel(h)}
                </div>
                <div className="flex-1 border-b border-dashed" style={{ borderColor: "rgba(17,17,17,.15)" }} />
              </div>
            ))}

            {/* Events for selected day */}
            {eventsForDate(selDay).map(ev => (
              <div key={ev.id}
                data-ev="1"
                onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                className="absolute cursor-pointer rounded-r-xl overflow-hidden transition-all hover:brightness-95"
                style={{
                  top: evTop(ev),
                  height: Math.max(evH(ev), 52),
                  left: 56,
                  right: 16,
                  backgroundColor: ev.bgColor,
                  borderLeft: `4px solid ${ev.color}`,
                }}>
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <ev.icon size={16} style={{ color: ev.color, flexShrink: 0 }} />
                    <p className="font-bold text-lg" style={{ color: ev.color }}>{ev.title}</p>
                  </div>
                  <p className="text-base font-semibold flex-shrink-0 ml-4"
                    style={{ color: "rgba(17,17,17,.55)" }}>
                    {fmt12(ev.startHour, ev.startMin)} – {fmt12(ev.endHour, ev.endMin)}
                  </p>
                </div>
                {ev.subtitle && Math.max(evH(ev), 52) >= 64 && (
                  <p className="px-4 text-base" style={{ color: "rgba(17,17,17,.55)" }}>{ev.subtitle}</p>
                )}
              </div>
            ))}

            {/* Current time line */}
            {ds(selDay) === today && showNow && (
              <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                style={{ top: nowTop }}>
                <div className="w-14 flex-shrink-0 flex justify-end pr-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#111111" }} />
                </div>
                <div className="flex-1 h-px" style={{ backgroundColor: "#111111" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function RightSidebar() {
    const yr    = sideMonth.getFullYear();
    const mo    = sideMonth.getMonth();
    const fd    = new Date(yr, mo, 1).getDay();
    const fdM   = fd === 0 ? 6 : fd - 1;
    const dim   = new Date(yr, mo + 1, 0).getDate();
    const blanks  = Array(fdM).fill(null);
    const daysArr = Array.from({ length: dim }, (_, i) => i + 1);

    return (
      <aside className="w-64 flex-shrink-0 overflow-y-auto"
        style={{ borderLeft: "1px solid rgba(17,17,17,.08)", backgroundColor: "#ffffff" }}>
        <div className="px-4 py-5 space-y-5">

          {/* Mini calendar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setSideMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ color: "rgba(17,17,17,.50)", backgroundColor: "rgba(17,17,17,.07)" }}>
                <ChevronLeft size={12} />
              </button>
              <p className="text-base font-bold" style={{ color: "#111111" }}>
                {sideMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <button
                onClick={() => setSideMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="w-6 h-6 flex items-center justify-center rounded-lg"
                style={{ color: "rgba(17,17,17,.50)", backgroundColor: "rgba(17,17,17,.07)" }}>
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-0.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs font-bold py-0.5"
                  style={{ color: "rgba(17,17,17,.40)" }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {blanks.map((_, i) => <div key={`b${i}`} />)}
              {daysArr.map(d => {
                const dStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isT  = dStr === today;
                return (
                  <button key={d}
                    onClick={() => {
                      setSelDay(new Date(yr, mo, d));
                      setView("day");
                      setWeekStart(getMonday(new Date(yr, mo, d)));
                    }}
                    className="h-7 rounded-lg text-sm font-bold transition-all"
                    style={{
                      backgroundColor: isT ? "#111111" : "transparent",
                      color: isT ? "#ffffff" : "#111111",
                      boxShadow: isT ? "0 2px 8px rgba(17,17,17,.25)" : "none",
                    }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(17,17,17,.07)" }} />

          {/* Today's agenda */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: "rgba(17,17,17,.40)" }}>TODAY'S AGENDA</p>
            {todaysAgenda.length === 0 ? (
              <p className="text-base" style={{ color: "rgba(17,17,17,.40)" }}>Nothing scheduled today</p>
            ) : (
              <div className="space-y-2">
                {todaysAgenda.map(ev => {
                  const isNowEv = now.getHours() >= ev.startHour && now.getHours() < ev.endHour;
                  return (
                    <div key={ev.id} className="flex items-start gap-2">
                      <div className="w-0.5 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: ev.color, height: "32px" }} />
                      <div>
                        <p className="text-base font-semibold" style={{ color: "#111111" }}>{ev.title}</p>
                        <p className="text-sm" style={{ color: "rgba(17,17,17,.50)" }}>
                          {fmt12(ev.startHour, ev.startMin)} – {fmt12(ev.endHour, ev.endMin)}
                          {isNowEv && (
                            <span className="ml-1 font-bold" style={{ color: "#111111" }}>NOW</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid rgba(17,17,17,.07)" }} />

          {/* Upcoming deadlines */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: "rgba(17,17,17,.40)" }}>UPCOMING DEADLINES</p>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-base" style={{ color: "rgba(17,17,17,.40)" }}>No upcoming deadlines</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingDeadlines.map(t => (
                  <div key={t.id} className="flex items-center justify-between">
                    <p className="text-base font-semibold truncate" style={{ color: "#111111" }}>{t.title}</p>
                    <span className="text-sm font-bold flex-shrink-0 ml-2 flex items-center gap-0.5"
                      style={{ color: "#111111" }}>
                      ● {fmtShortDate(t.due_date!)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </aside>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[100dvh]" style={{
      backgroundColor: "#FFFFFF",
    }}>
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main calendar area ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="font-['Yeseva_One'] text-4xl font-bold" style={{ color: "#111111" }}>
                Schedule
              </h1>
              <p className="text-lg font-medium mt-0.5" style={{ color: "rgba(17,17,17,.55)" }}>
                {weekLabel} · {thisWeekCount} events this week
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Week navigation */}
              <button
                onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: "rgba(17,17,17,.55)", backgroundColor: "rgba(17,17,17,.07)" }}>
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: "rgba(17,17,17,.55)", backgroundColor: "rgba(17,17,17,.07)" }}>
                <ChevronRight size={16} />
              </button>

              {/* Day / Week toggle */}
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "rgba(17,17,17,.12)" }}>
                {(["day", "week"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className="px-4 py-1.5 text-lg font-bold capitalize transition-all"
                    style={{
                      backgroundColor: view === v ? "#111111" : "transparent",
                      color: view === v ? "#ffffff" : "rgba(17,17,17,.60)",
                    }}>
                    {v}
                  </button>
                ))}
              </div>

              {/* Add event */}
              <button
                onClick={() => { setEditMeeting(null); setPrefill(null); setModalOpen(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-lg font-bold text-white transition-all"
                style={{ backgroundColor: "#111111" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#000000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111111"; }}>
                <Plus size={15} /> Add event
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex-shrink-0 px-6 pb-3 flex items-center gap-1.5">
            {[
              { key: "all",      label: "All"      },
              { key: "task_due", label: "Task Due" },
              { key: "session",  label: "Session"  },
              { key: "meeting",  label: "Meeting"  },
            ].map(({ key, label }) => {
              const cfg    = key !== "all" ? EV_CFG[key as keyof typeof EV_CFG] : null;
              const active = activeType === key;
              return (
                <button key={key} onClick={() => setActiveType(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-bold transition-all"
                  style={{
                    backgroundColor: active ? "#111111" : "rgba(17,17,17,.07)",
                    color: active ? "#ffffff" : "rgba(17,17,17,.65)",
                  }}>
                  {cfg && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.color }} />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Calendar view */}
          <div className="flex-1 overflow-hidden bg-white mx-4 mb-4 rounded-2xl border"
            style={{ borderColor: "rgba(17,17,17,.08)", boxShadow: "0 4px 24px rgba(17,17,17,.07)" }}>
            {view === "week" ? WeekView() : DayView()}
          </div>

        </main>

        {/* ── Right sidebar ── */}
        {RightSidebar()}
      </div>

      {modalOpen && (
        <MeetingModal
          meeting={editMeeting}
          saving={saving}
          deletingId={deletingId}
          startingId={startingId}
          prefillDate={prefill?.date}
          prefillTime={prefill?.time}
          onClose={() => { setModalOpen(false); setEditMeeting(null); setPrefill(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
          onStart={handleStart}
        />
      )}
    </div>
  );
}

// ── Meeting Modal (outside main component) ─────────────────────────────────────
function MeetingModal({
  meeting, saving, deletingId, startingId, prefillDate, prefillTime, onClose, onSave, onDelete, onStart,
}: {
  meeting: Meeting | null;
  saving: boolean;
  deletingId: number | null;
  startingId: number | null;
  prefillDate?: string;
  prefillTime?: string;
  onClose: () => void;
  onSave: (data: MeetingForm) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onStart: (m: Meeting) => Promise<void>;
}) {
  const [form, setForm] = useState<MeetingForm>({
    title: meeting?.title ?? "",
    date: meeting?.date ?? prefillDate ?? "",
    time: meeting?.time ?? prefillTime ?? "",
    end_time: meeting?.end_time ?? "",
    participants: meeting?.participants ?? "",
    notes: meeting?.notes ?? "",
  });

  const set = (k: keyof MeetingForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(17,17,17,.35)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg"
        style={{
          background: "#ffffff",
          borderRadius: "28px",
          boxShadow: "0 24px 64px rgba(17,17,17,.20)",
          border: "1px solid rgba(17,17,17,.08)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(17,17,17,.06)" }}>
          <h2 className="font-['Yeseva_One'] text-3xl font-bold" style={{ color: "#111111" }}>
            {meeting ? "Edit Meeting" : "New Meeting"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl transition-all"
            style={{ color: "rgba(17,17,17,.50)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#111111"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(17,17,17,.50)"; }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-base font-bold mb-1.5" style={{ color: "rgba(17,17,17,.55)" }}>
              Meeting title *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl text-lg font-semibold outline-none transition-all"
              style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.10)", color: "#111111" }}
              placeholder="e.g. Weekly sync, Client review..."
              value={form.title}
              onChange={set("title")}
              onFocus={e => { e.target.style.borderColor = "#111111"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(17,17,17,.10)"; }}
              required
              autoFocus
            />
          </div>

          {/* Date + Start Time + End Time */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-base font-bold mb-1.5" style={{ color: "rgba(17,17,17,.55)" }}>
                <span className="flex items-center gap-1"><Calendar size={11} /> Date</span>
              </label>
              <input type="date"
                className="w-full px-4 py-2.5 rounded-xl text-lg font-semibold outline-none transition-all"
                style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.10)", color: "#111111" }}
                value={form.date}
                onChange={set("date")}
                onFocus={e => { e.target.style.borderColor = "#111111"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(17,17,17,.10)"; }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-base font-bold mb-1.5" style={{ color: "rgba(17,17,17,.55)" }}>
                <span className="flex items-center gap-1"><Clock size={11} /> Start Time</span>
              </label>
              <input type="time"
                className="w-full px-4 py-2.5 rounded-xl text-lg font-semibold outline-none transition-all"
                style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.10)", color: "#111111" }}
                value={form.time}
                onChange={set("time")}
                onFocus={e => { e.target.style.borderColor = "#111111"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(17,17,17,.10)"; }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-base font-bold mb-1.5" style={{ color: "rgba(17,17,17,.55)" }}>
                <span className="flex items-center gap-1"><Clock size={11} /> End Time</span>
              </label>
              <input type="time"
                className="w-full px-4 py-2.5 rounded-xl text-lg font-semibold outline-none transition-all"
                style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.10)", color: "#111111" }}
                value={form.end_time}
                onChange={set("end_time")}
                onFocus={e => { e.target.style.borderColor = "#111111"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(17,17,17,.10)"; }}
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-base font-bold mb-1.5" style={{ color: "rgba(17,17,17,.55)" }}>
              <span className="flex items-center gap-1"><Users size={11} /> Participants</span>
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl text-lg font-semibold outline-none transition-all"
              style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.10)", color: "#111111" }}
              placeholder="e.g. Riya, Priya, Sam"
              value={form.participants}
              onChange={set("participants")}
              onFocus={e => { e.target.style.borderColor = "#111111"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(17,17,17,.10)"; }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-base font-bold mb-1.5" style={{ color: "rgba(17,17,17,.55)" }}>
              <span className="flex items-center gap-1"><FileText size={11} /> Details to remember</span>
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl text-lg font-semibold outline-none transition-all resize-none"
              style={{ background: "rgba(17,17,17,.04)", border: "1px solid rgba(17,17,17,.10)", color: "#111111" }}
              placeholder="Agenda items, questions to ask, goals for the meeting..."
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              onFocus={e => { e.target.style.borderColor = "#111111"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(17,17,17,.10)"; }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2"
            style={{ borderTop: "1px solid rgba(17,17,17,.06)" }}>
            <div className="flex items-center gap-2">
              {meeting && (
                <>
                  <button type="button"
                    onClick={() => onDelete(meeting.id)}
                    disabled={deletingId === meeting.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-bold transition-all disabled:opacity-50"
                    style={{ backgroundColor: "rgba(17,17,17,.08)", color: "#111111" }}>
                    {deletingId === meeting.id && <Loader2 size={12} className="animate-spin" />}
                    Delete
                  </button>
                  {meeting.status === "upcoming" && (
                    <button type="button"
                      onClick={() => onStart(meeting)}
                      disabled={startingId === meeting.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-base font-bold text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: "#111111" }}>
                      {startingId === meeting.id && <Loader2 size={12} className="animate-spin" />}
                      Start
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl text-lg font-bold transition-all"
                style={{ color: "rgba(17,17,17,.50)" }}>
                Cancel
              </button>
              <button type="submit"
                disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-lg font-bold text-white transition-all shadow-sm disabled:opacity-50"
                style={{ backgroundColor: "#111111" }}
                onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#000000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111111"; }}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {meeting ? "Save changes" : "Schedule meeting"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
