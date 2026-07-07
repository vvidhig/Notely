import { useState, useCallback } from "react";
import type { Task, Quadrant } from "../types";
import { listTasks, createTask, updateTask, completeTask, deleteTask } from "../services/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Quadrant = Quadrant; // kept for callers that still reference it

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (params?: { quadrant?: Quadrant; status?: string }) => {
    setLoading(true);
    try {
      const res = await listTasks(params);
      setTasks(res.data);
    } catch {
      setError("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: {
    title: string; description?: string; execution_steps?: string;
    quadrant?: Quadrant; due_date?: string; due_time?: string;
    reminder_minutes?: number | null; tags?: string; status?: string;
    source?: string; highlight_id?: number; session_id?: number;
  }) => {
    const res = await createTask(data);
    setTasks((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const update = useCallback(async (id: number, data: Partial<{
    title: string; description: string; execution_steps: string;
    quadrant: Quadrant; due_date: string; due_time: string;
    reminder_minutes: number | null; tags: string; status: string;
  }>) => {
    const res = await updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    return res.data;
  }, []);

  const toggle = useCallback(async (id: number) => {
    const res = await completeTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    return res.data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const moveQuadrant = useCallback(async (id: number, quadrant: Quadrant) => {
    const res = await updateTask(id, { quadrant });
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
  }, []);

  return { tasks, loading, error, load, add, update, toggle, remove, moveQuadrant };
}
