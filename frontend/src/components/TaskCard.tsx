import { useState } from "react";
import type { Task, Quadrant } from "../types";
import { QUADRANT_CONFIG } from "../constants/quadrants";
import { Trash2, Calendar, Clock, GripVertical } from "lucide-react";

interface Props {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, taskId: number) => void;
  compact?: boolean;
  cardBg?: string;
}

function dueDateStatus(due?: string | null, status?: string) {
  if (!due || status === "completed") return "default";
  const today = new Date().toISOString().slice(0, 10);
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "future";
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function TaskCard({ task, onToggle, onDelete, onEdit, onDragStart, compact, cardBg }: Props) {
  const [hovering, setHovering] = useState(false);
  const cfg = QUADRANT_CONFIG[task.quadrant as Quadrant] ?? QUADRANT_CONFIG.neither;
  const done = task.status === "completed";
  const dateStatus = dueDateStatus(task.due_date, task.status);

  const dateColor =
    dateStatus === "overdue" ? "#E75480" :
    dateStatus === "today"   ? "#FF8A5B" :
    "#94A3B8";

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-all"
      style={{
        backgroundColor: done ? "transparent" : (cardBg ?? "#ffffff"),
        borderRadius: "14px",
        border: done ? "1px solid transparent" : "1px solid rgba(13,59,102,.07)",
        boxShadow: done
          ? "none"
          : `inset 3px 0 0 ${cfg.color}66, ${hovering ? "0 4px 16px rgba(13,59,102,.10)" : "0 2px 8px rgba(13,59,102,.05)"}`,
        opacity: done ? 0.5 : 1,
        transition: "all 200ms ease",
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 mt-0.5 transition-opacity"
        style={{ color: "#94A3B8", opacity: hovering ? 1 : 0 }}
      >
        <GripVertical size={14} />
      </div>

      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className="flex-shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center transition-all"
        style={{
          border: done ? `2px solid ${cfg.color}` : "2px solid rgba(13,59,102,.20)",
          backgroundColor: done ? cfg.color : "transparent",
        }}
      >
        {done && <span className="text-white text-[9px] font-bold">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
        <p
          className="text-sm font-semibold leading-snug"
          style={{
            color: done ? "#94A3B8" : "#0D3B66",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>

        {!compact && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.due_date && (
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: dateColor }}>
                <Calendar size={10} />
                {formatDate(task.due_date)}
                {dateStatus === "overdue" && <span className="text-[9px]">· overdue</span>}
                {dateStatus === "today"   && <span className="text-[9px]">· today</span>}
              </span>
            )}
            {task.due_time && (
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#94A3B8" }}>
                <Clock size={10} />
                {formatTime(task.due_time)}
              </span>
            )}
            {task.tags && task.tags.split(",").filter(Boolean).map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
              >
                {t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="flex-shrink-0 p-0.5 rounded-lg transition-all"
        style={{
          color: "#94A3B8",
          opacity: hovering ? 1 : 0,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E75480"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
