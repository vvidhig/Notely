import type { Highlight } from "../types";
import { Star, Trash2, ExternalLink, Plus, CheckCircle2, StickyNote } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  highlight: Highlight;
  sessionTitle?: string;
  onDelete: (id: number) => void;
  onCreateTask: (h: Highlight) => void;
}

export default function HighlightCard({ highlight, sessionTitle, onDelete, onCreateTask }: Props) {
  const navigate = useNavigate();
  const hasTask  = !!highlight.task_id;

  return (
    <div
      className="group transition-all"
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: "1px solid rgba(17,17,17,.08)",
        borderLeft: "4px solid #8A8A8A",
        boxShadow: "0 8px 32px rgba(17,17,17,.07)",
        padding: "16px 20px",
        transition: "all 250ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 45px rgba(17,17,17,.14)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(17,17,17,.07)";
      }}
    >
      {/* Star + quote */}
      <div className="flex gap-2.5 mb-3">
        <Star size={14} className="flex-shrink-0 mt-0.5" style={{ fill: "#8A8A8A", stroke: "#8A8A8A" }} />
        <p
          className="text-lg font-semibold leading-relaxed italic"
          style={{ color: "#111111" }}
        >
          "{highlight.highlighted_text}"
        </p>
      </div>

      {/* Attached note (if any) */}
      {highlight.note && (
        <div
          className="flex gap-2 mb-3 px-3 py-2 rounded-xl text-base leading-relaxed"
          style={{ backgroundColor: "rgba(17,17,17,.04)", color: "rgba(17,17,17,.70)" }}
        >
          <StickyNote size={14} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{highlight.note}</span>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {sessionTitle && (
            <button
              onClick={() => navigate(`/session/${highlight.session_id}/summary`)}
              className="flex items-center gap-1 text-base font-bold transition-opacity hover:opacity-100"
              style={{ color: "rgba(17,17,17,.55)" }}
            >
              <ExternalLink size={10} />
              {sessionTitle}
            </button>
          )}
          {hasTask && (
            <span
              className="flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(17,17,17,.10)", color: "#111111" }}
            >
              <CheckCircle2 size={9} /> Task created
            </span>
          )}
          {!hasTask && (
            <span
              className="text-sm px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: "rgba(17,17,17,.20)", color: "#111111" }}
            >
              Highlight
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!hasTask && (
            <button
              onClick={() => onCreateTask(highlight)}
              className="flex items-center gap-1 text-base font-bold px-2.5 py-1 transition-all hover:opacity-85"
              style={{ backgroundColor: "#111111", color: "#ffffff", borderRadius: "10px" }}
            >
              <Plus size={11} /> Task
            </button>
          )}
          <button
            onClick={() => onDelete(highlight.id)}
            className="p-1 rounded-lg transition-all hover:opacity-80"
            style={{ color: "rgba(17,17,17,.50)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#111111"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(17,17,17,.50)"; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
