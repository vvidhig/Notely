import { useState, useMemo } from "react";
import type { Session } from "../types";
import { Mic } from "lucide-react";

type Period = "week" | "month" | "year";

export default function SessionsStats({ sessions }: { sessions: Session[] }) {
  const [period, setPeriod] = useState<Period>("week");

  const count = useMemo(() => {
    const now = new Date();
    return sessions.filter((s) => {
      const d = new Date(s.started_at);
      if (period === "week") {
        const cutoff = new Date(now);
        cutoff.setDate(now.getDate() - 7);
        return d >= cutoff;
      }
      if (period === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    }).length;
  }, [sessions, period]);

  const periodLabel =
    period === "week" ? "this week" : period === "month" ? "this month" : "this year";

  const TABS: { key: Period; label: string }[] = [
    { key: "week",  label: "Wk" },
    { key: "month", label: "Mo" },
    { key: "year",  label: "Yr" },
  ];

  return (
    <div
      className="rounded-[24px] px-5 py-4 flex flex-col"
      style={{
        background: "linear-gradient(135deg, #111111 0%, #111111 100%)",
        boxShadow: "0 12px 40px rgba(17,17,17,.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Mic size={12} className="text-white/60" />
          <p className="text-sm text-white/60 font-bold uppercase tracking-widest">Sessions</p>
        </div>
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{ backgroundColor: "rgba(255,255,255,.15)" }}
        >
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="px-2.5 py-1 rounded-md text-sm font-bold transition-all"
              style={
                period === key
                  ? { backgroundColor: "#FFFFFF", color: "#111111" }
                  : { color: "rgba(255,255,255,.65)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-6xl font-bold text-white leading-none">{count}</p>
      <p className="text-lg text-white/55 font-semibold mt-2">{periodLabel}</p>

      <div
        className="mt-4 pt-3 flex items-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,.15)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.35)" }} />
        <p className="text-base text-white/40 font-semibold">{sessions.length} sessions all time</p>
      </div>
    </div>
  );
}
