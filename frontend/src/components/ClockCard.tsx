import { useState, useEffect } from "react";

export default function ClockCard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const isPM = now.getHours() >= 12;

  return (
    <div
      className="rounded-[20px] px-4 py-3 flex items-center justify-between gap-3"
      style={{
        background: "#374375",
        boxShadow: "0 8px 24px rgba(55,67,117,.35)",
      }}
    >
      <div>
        <p className="text-[9px] text-white/45 font-bold uppercase tracking-widest mb-1">
          Current time
        </p>
        <div className="flex items-end gap-1">
          <span className="font-mono text-4xl font-bold text-white tracking-tight leading-none">
            {h}:{m}
          </span>
          <span className="font-mono text-base font-bold text-white/40 leading-none mb-0.5">:{s}</span>
          <span className="text-[10px] font-bold text-white/45 mb-0.5 ml-0.5">{isPM ? "PM" : "AM"}</span>
        </div>
        <p className="text-[10px] text-white/50 font-semibold mt-1">
          {now.toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      </div>

      {/* Decorative clock face */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative"
        style={{ border: "2px solid rgba(255,255,255,.20)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ border: "1px solid rgba(255,255,255,.15)" }}>
          <div
            className="absolute w-0.5 h-3 rounded-full origin-bottom"
            style={{
              backgroundColor: "rgba(255,255,255,.75)",
              transform: `rotate(${now.getMinutes() * 6}deg)`,
              bottom: "50%",
              left: "calc(50% - 1px)",
            }}
          />
          <div
            className="absolute w-0.5 h-2 rounded-full origin-bottom"
            style={{
              backgroundColor: "rgba(255,255,255,.55)",
              transform: `rotate(${(now.getHours() % 12) * 30 + now.getMinutes() * 0.5}deg)`,
              bottom: "50%",
              left: "calc(50% - 1px)",
            }}
          />
          <div className="w-1 h-1 rounded-full bg-white z-10" />
        </div>
      </div>
    </div>
  );
}
