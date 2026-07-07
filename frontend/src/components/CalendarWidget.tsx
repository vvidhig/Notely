import { useState } from "react";
import type { CalendarDot } from "../types";
import { useCalendar } from "../hooks/useCalendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarWidget({ dots = [] }: { dots?: CalendarDot[] }) {
  const { days, getDot, isToday, prevMonth, nextMonth, monthLabel } = useCalendar(dots);
  const [selected, setSelected] = useState<number | null>(null);

  const blanks     = Array(days.firstDay).fill(null);
  const dayNumbers = Array.from({ length: days.daysInMonth }, (_, i) => i + 1);

  return (
    <div
      style={{
        background: "rgba(186,189,226,.15)",
        borderRadius: "20px",
        border: "1px solid rgba(186,189,226,.35)",
        boxShadow: "0 4px 16px rgba(55,67,117,.08)",
        padding: "12px 14px",
      }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: "rgba(55,67,117,.12)", color: "#374375" }}
        >
          <ChevronLeft size={12} />
        </button>
        <p className="text-xs font-bold" style={{ color: "#374375" }}>{monthLabel}</p>
        <button
          onClick={nextMonth}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: "rgba(55,67,117,.12)", color: "#374375" }}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold py-0.5 uppercase tracking-wide"
            style={{ color: "rgba(55,67,117,.50)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {blanks.map((_, i) => <div key={`b-${i}`} />)}
        {dayNumbers.map((day) => {
          const dot   = getDot(day);
          const today = isToday(day);
          const sel   = selected === day;

          return (
            <button
              key={day}
              onClick={() => setSelected(sel ? null : day)}
              className="relative flex flex-col items-center justify-center h-7 rounded-lg text-[11px] font-bold transition-all"
              style={{
                backgroundColor:
                  today ? "#374375"
                  : sel  ? "rgba(186,189,226,.30)"
                  : "transparent",
                color:
                  today ? "#ffffff"
                  : sel  ? "#374375"
                  : "#374375",
                boxShadow: today ? "0 2px 8px rgba(55,67,117,.35)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!today && !sel) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(55,67,117,.10)";
                }
              }}
              onMouseLeave={(e) => {
                if (!today && !sel) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }
              }}
            >
              <span className="leading-none">{day}</span>
              {dot && (
                <div className="flex gap-px mt-px">
                  {dot.has_task && (
                    <span className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: today ? "rgba(255,255,255,.70)" : "#895159" }} />
                  )}
                  {dot.has_session && (
                    <span className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: today ? "rgba(255,255,255,.70)" : "#BABDE2" }} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dot legend */}
      <div className="flex items-center gap-3 mt-2 px-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#895159" }} />
          <span className="text-[9px] font-semibold" style={{ color: "rgba(55,67,117,.55)" }}>Task</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#BABDE2" }} />
          <span className="text-[9px] font-semibold" style={{ color: "rgba(55,67,117,.55)" }}>Session</span>
        </div>
      </div>
    </div>
  );
}
