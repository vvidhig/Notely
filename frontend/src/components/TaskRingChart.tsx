import { useState, useMemo } from "react";
import type { Task } from "../types";

type Period = "today" | "week" | "month";

const R  = 48;
const CX = 64;
const CY = 64;
const C  = 2 * Math.PI * R;
const SW = 11;

export default function TaskRingChart({ tasks }: { tasks: Task[] }) {
  const [period, setPeriod] = useState<Period>("today");

  const { completed, total } = useMemo(() => {
    const now      = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weekStr  = startOfWeek.toISOString().slice(0, 10);
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const inPeriod = (t: Task) => {
      if (!t.due_date) return false;
      if (period === "today") return t.due_date === todayStr;
      if (period === "week")  return t.due_date >= weekStr && t.due_date <= todayStr;
      return t.due_date >= monthStr;
    };

    const filtered = tasks.filter(inPeriod);
    return {
      completed: filtered.filter((t) => t.status === "completed").length,
      total: filtered.length,
    };
  }, [tasks, period]);

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const arc = (pct / 100) * C;
  const label =
    total === 0           ? "No tasks due"
    : completed === total ? "All done! 🎉"
    : `${total - completed} remaining`;

  const TABS: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week",  label: "Week"  },
    { key: "month", label: "Month" },
  ];

  return (
    <div
      className="flex flex-col"
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: "1px solid rgba(13,59,102,.06)",
        boxShadow: "0 12px 40px rgba(13,59,102,.08)",
        padding: "20px",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>
        Task Completion
      </p>

      {/* Period toggle */}
      <div
        className="flex rounded-xl p-1 gap-0.5 mb-4"
        style={{ backgroundColor: "#F8FAFC", border: "1px solid rgba(13,59,102,.06)" }}
      >
        {TABS.map(({ key, label: lbl }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className="flex-1 py-1.5 rounded-[9px] text-[11px] font-bold transition-all"
            style={
              period === key
                ? { backgroundColor: "#FFC857", color: "#0D3B66", boxShadow: "0 2px 8px rgba(255,200,87,.30)" }
                : { color: "#94A3B8" }
            }
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="flex items-center gap-5">
        <svg width="128" height="128" viewBox="0 0 128 128" className="flex-shrink-0">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E75480" />
              <stop offset="100%" stopColor="#FFC857" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#FFD8C7" strokeWidth={SW} />
          {/* Progress arc */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={SW}
            strokeDasharray={`${arc} ${C}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
          {/* Center text */}
          <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="700"
            fill="#0D3B66" fontFamily="Quicksand,sans-serif">
            {pct}%
          </text>
          <text x={CX} y={CY + 13} textAnchor="middle" fontSize="10" fontWeight="600"
            fill="#94A3B8" fontFamily="Quicksand,sans-serif">
            complete
          </text>
        </svg>

        <div className="min-w-0">
          <p className="text-4xl font-bold leading-none" style={{ color: "#0D3B66" }}>{completed}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: "#64748B" }}>of {total} tasks</p>
          <p
            className="text-xs font-medium mt-3 leading-tight"
            style={{ color: pct === 100 ? "#1FA7A6" : pct >= 50 ? "#FF8A5B" : "#E75480" }}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
