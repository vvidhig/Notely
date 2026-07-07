import { useState, useMemo } from "react";
import type { CalendarDot } from "../types";

export function useCalendar(dots: CalendarDot[] = []) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const dotMap = useMemo(() => {
    const m = new Map<string, CalendarDot>();
    for (const d of dots) m.set(d.date, d);
    return m;
  }, [dots]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  }, [year, month]);

  const getDot = (day: number): CalendarDot | undefined => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dotMap.get(d);
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return { year, month, days, getDot, isToday, prevMonth, nextMonth, monthLabel };
}
