import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, CheckSquare, Mic, Star, CalendarDays, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { to: "/dashboard",  icon: Home,         label: "Home"       },
  { to: "/tasks",      icon: CheckSquare,  label: "Tasks"      },
  { to: "/sessions",   icon: Mic,          label: "Sessions"   },
  { to: "/highlights", icon: Star,         label: "Highlights" },
  { to: "/schedule",   icon: CalendarDays, label: "Schedule"   },
];

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function useStreak() {
  const [streak, setStreak] = useState(0);
  const [activeDays, setActiveDays] = useState<boolean[]>(Array(7).fill(false));

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const stored: string[] = JSON.parse(localStorage.getItem("notely-active-days") || "[]");
    if (!stored.includes(todayStr)) {
      stored.push(todayStr);
      localStorage.setItem("notely-active-days", JSON.stringify(stored.slice(-60)));
    }
    let s = 0;
    const d = new Date(today);
    while (stored.includes(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
    setStreak(s);

    const weekStart = new Date(today);
    // Monday-based week
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    weekStart.setDate(today.getDate() + mondayOffset);
    const active = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return stored.includes(day.toISOString().slice(0, 10));
    });
    setActiveDays(active);
  }, []);

  return { streak, activeDays };
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { streak, activeDays } = useStreak();

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-5 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,.10)" }}
      >
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.15)"/>
          <rect x="13" y="10" width="4" height="28" rx="2" fill="rgba(255,255,255,0.35)"/>
          <rect x="21" y="13" width="14" height="3" rx="1.5" fill="white"/>
          <rect x="21" y="20" width="14" height="3" rx="1.5" fill="white"/>
          <rect x="21" y="27" width="10" height="3" rx="1.5" fill="white"/>
        </svg>
        <span className="font-['Yeseva_One'] text-4xl font-bold text-white tracking-wide">Notely</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-lg font-semibold transition-all"
            style={({ isActive }) => ({
              backgroundColor: isActive ? "rgba(255,255,255,.12)" : "transparent",
              color: isActive ? "#ffffff" : "rgba(255,255,255,.60)",
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 rounded-r-full"
                    style={{ width: "3px", backgroundColor: "#8A8A8A" }}
                  />
                )}
                <Icon size={17} />
                {label}
              </>
            )}
          </NavLink>
        ))}

      </nav>

      {/* Focus Streak */}
      <div
        className="mx-3 mb-3 px-3 py-3 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.10)" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,.45)" }}>
          Focus Streak
        </p>
        <p className="text-4xl font-bold text-white leading-none mb-2">
          {streak} <span className="text-lg font-semibold" style={{ color: "rgba(255,255,255,.60)" }}>days</span>
        </p>
        <div className="flex gap-1">
          {DAYS.map((d, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5"
            >
              <div
                className="w-full h-4 rounded-sm flex items-center justify-center"
                style={{
                  backgroundColor: activeDays[i] ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.15)",
                }}
              />
              <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,.40)" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User + logout */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,.10)" }}>
        <p className="text-base font-semibold mb-2 px-1 truncate" style={{ color: "rgba(255,255,255,.40)" }}>
          {user?.email}
        </p>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="flex items-center gap-2 text-lg px-3 py-2 rounded-xl w-full font-semibold transition-all"
          style={{ color: "rgba(255,255,255,.50)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.90)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.50)";
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 h-[100dvh] sticky top-0"
        style={{ backgroundColor: "#111111" }}
      >
        {content}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
        style={{ backgroundColor: "#111111" }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-56 h-full flex flex-col" style={{ backgroundColor: "#111111" }}>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-['Yeseva_One'] text-4xl font-bold text-white">Notely</span>
              <button onClick={() => setMobileOpen(false)} style={{ color: "rgba(255,255,255,.60)" }}>
                <X size={20} />
              </button>
            </div>
            {content}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
