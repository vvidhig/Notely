import type { UpcomingTask } from "../types";
import { QUADRANT_CONFIG } from "../constants/quadrants";
import type { Quadrant } from "../types";
import { Calendar } from "lucide-react";

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  const today = new Date();
  const diff = Math.ceil((date.getTime() - today.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7)  return `${diff}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dateColor(d: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (d < today) return "#E75480";
  if (d === today) return "#FF8A5B";
  return "#94A3B8";
}

export default function UpcomingDeadlines({ tasks }: { tasks: UpcomingTask[] }) {
  const cardStyle = {
    background: "#ffffff",
    borderRadius: "24px",
    border: "1px solid rgba(13,59,102,.06)",
    boxShadow: "0 12px 40px rgba(13,59,102,.08)",
    padding: "16px",
  };

  if (tasks.length === 0) {
    return (
      <div style={cardStyle}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>
          Upcoming
        </p>
        <p className="text-sm font-medium italic text-center py-2" style={{ color: "#94A3B8" }}>
          No upcoming tasks 🎉
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>
        Upcoming deadlines
      </p>
      <div className="space-y-2.5">
        {tasks.map((t) => {
          const cfg = QUADRANT_CONFIG[t.quadrant as Quadrant] ?? QUADRANT_CONFIG.neither;
          return (
            <div key={t.id} className="flex items-center gap-2.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="flex-1 text-sm font-semibold truncate" style={{ color: "#0D3B66" }}>
                {t.title}
              </span>
              {t.due_date && (
                <span
                  className="flex items-center gap-1 text-xs font-bold flex-shrink-0"
                  style={{ color: dateColor(t.due_date) }}
                >
                  <Calendar size={10} />
                  {formatDate(t.due_date)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
