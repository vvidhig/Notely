import { useState, useCallback } from "react";
import type { Highlight } from "../types";
import {
  getSessionHighlights, createHighlight, deleteHighlight,
  linkTaskToHighlight, listHighlights, updateHighlight,
} from "../services/api";

export function useHighlights(sessionId?: number) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await getSessionHighlights(sessionId);
      setHighlights(res.data);
    } catch {
      // silently fail — highlighting is non-critical
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadAll = useCallback(async (params?: { session_id?: number; has_task?: boolean }) => {
    setLoading(true);
    try {
      const res = await listHighlights(params);
      setHighlights(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (data: {
    session_id: number; note_id: number; highlighted_text: string;
    start_offset: number; end_offset: number;
  }) => {
    const res = await createHighlight(data);
    setHighlights((prev) => [...prev, res.data]);
    return res.data;
  }, []);

  const update = useCallback(async (id: number, data: { note?: string }) => {
    const res = await updateHighlight(id, data);
    setHighlights((prev) => prev.map((h) => h.id === id ? res.data : h));
    return res.data;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const linkTask = useCallback(async (highlightId: number, taskId: number) => {
    const res = await linkTaskToHighlight(highlightId, taskId);
    setHighlights((prev) => prev.map((h) => (h.id === highlightId ? res.data : h)));
    return res.data;
  }, []);

  const forNote = useCallback(
    (noteId: number) => highlights.filter((h) => h.note_id === noteId),
    [highlights],
  );

  return { highlights, loading, load, loadAll, add, update, remove, linkTask, forNote };
}
