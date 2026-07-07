import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { listTasks } from "../services/api";
import type { Task } from "../types";

const STORAGE_KEY = "notely_fired_reminders";
const CHECK_INTERVAL = 60_000; // 1 minute
const FIRE_WINDOW_MS = 65_000; // slightly more than interval to account for timing jitter

function getFired(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function markFired(key: string) {
  const fired = getFired();
  fired[key] = Date.now();
  // Prune entries older than 48 hours
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  for (const [k, t] of Object.entries(fired)) {
    if (t < cutoff) delete fired[k];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fired));
}

function sendNotification(task: Task, minutesBefore: number) {
  const minuteLabel = minutesBefore === 60 ? "1 hour" : `${minutesBefore} minute${minutesBefore > 1 ? "s" : ""}`;
  const timeStr = task.due_time ? ` — due at ${formatTime(task.due_time)}` : "";
  const body = [
    task.description || "",
    task.execution_steps ? `Steps: ${task.execution_steps.split("\n")[0]}` : "",
  ].filter(Boolean).join("\n") || `${minuteLabel} until this task is due${timeStr}`;

  try {
    new Notification(`⏰ ${task.title}`, {
      body,
      icon: "/favicon.ico",
      tag: `notely-${task.id}-${minutesBefore}`,
      requireInteraction: false,
    });
  } catch {
    // Notification API unavailable or permission revoked
  }
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function checkTasks(tasks: Task[]) {
  const now = Date.now();
  const fired = getFired();

  for (const task of tasks) {
    if (!task.due_date || !task.due_time || !task.reminder_minutes) continue;
    if (task.status === "completed" || task.status === "archived") continue;

    const dueDt = new Date(`${task.due_date}T${task.due_time}:00`);
    if (isNaN(dueDt.getTime())) continue;

    const fireAt = dueDt.getTime() - task.reminder_minutes * 60_000;
    const key = `${task.id}_${task.reminder_minutes}`;

    if (fired[key]) continue; // already fired
    if (now >= fireAt && now < fireAt + FIRE_WINDOW_MS) {
      sendNotification(task, task.reminder_minutes);
      markFired(key);
    }
  }
}

export function useReminders() {
  const { token } = useAuth();
  const permissionRef = useRef<NotificationPermission | null>(null);

  useEffect(() => {
    if (!token) return;
    if (!("Notification" in window)) return;

    // Request permission once
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => { permissionRef.current = p; });
    } else {
      permissionRef.current = Notification.permission;
    }

    const run = async () => {
      const perm = permissionRef.current ?? Notification.permission;
      if (perm !== "granted") return;
      try {
        const res = await listTasks({});
        checkTasks(res.data);
      } catch {
        // silently ignore network errors
      }
    };

    run(); // first check immediately
    const id = setInterval(run, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [token]);
}
