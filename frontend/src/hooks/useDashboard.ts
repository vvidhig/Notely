import { useState, useEffect } from "react";
import type { DashboardSummary } from "../types";
import { getDashboardSummary } from "../services/api";

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDashboardSummary();
      setSummary(res.data);
    } catch {
      setError("Could not load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { summary, loading, error, reload: load };
}
