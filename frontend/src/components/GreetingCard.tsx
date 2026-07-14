import type { DashboardSummary } from "../types";

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${name}`;
  if (h < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function GreetingCard({ name, summary }: { name: string; summary: DashboardSummary | null }) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-[#DDDDDD] px-5 py-5 shadow-sm">
      <h2 className="font-['Yeseva_One'] text-3xl font-bold text-[#111111] leading-tight">
        {greeting(name)}
      </h2>
      <p className="text-lg text-[#8A8A8A] font-semibold mt-1">{today}</p>

      {summary && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat value={summary.tasks_due_today} label="Due today" color="#8A8A8A" />
          <Stat value={summary.sessions_this_week} label="Sessions" color="#555555" />
          <Stat value={summary.highlights_without_tasks} label="Highlights" color="#8A8A8A" />
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center rounded-xl py-2.5 px-1" style={{ backgroundColor: color + "12" }}>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm text-[#555555] font-bold mt-0.5">{label}</p>
    </div>
  );
}
