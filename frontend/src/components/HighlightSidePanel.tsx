import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { Highlight } from "../types";

interface Props {
  highlight: Highlight | null;
  onClose: () => void;
  onSaveNote: (id: number, note: string) => Promise<void>;
  onDelete: (id: number) => void;
  onCreateTask: (h: Highlight) => void;
}

export default function HighlightSidePanel({
  highlight, onClose, onSaveNote, onDelete, onCreateTask,
}: Props) {
  const [noteVal, setNoteVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNoteVal(highlight?.note ?? "");
    setSaved(false);
  }, [highlight?.id]);

  if (!highlight) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveNote(highlight.id, noteVal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop — closes panel on click */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      {/* Slide-in panel */}
      <div
        className="fixed right-0 top-0 h-full z-40 flex flex-col"
        style={{
          width: 320,
          backgroundColor: "#ffffff",
          borderLeft: "1px solid rgba(55,67,117,.10)",
          boxShadow: "-12px 0 40px rgba(55,67,117,.10)",
          animation: "slideInRight 200ms ease",
        }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(55,67,117,.08)" }}
        >
          <p className="text-sm font-bold" style={{ color: "#374375" }}>
            📝 Note on Highlight
          </p>
          <button
            onClick={onClose}
            className="transition-all"
            style={{ color: "rgba(55,67,117,.40)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#374375"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(55,67,117,.40)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Highlighted text (read-only) */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "rgba(55,67,117,.40)" }}
            >
              Highlighted Text
            </p>
            <div
              className="text-sm italic leading-relaxed px-3 py-2.5 rounded-xl"
              style={{
                backgroundColor: "rgba(255,220,50,.15)",
                borderLeft: "3px solid rgba(200,180,0,.45)",
                color: "#374375",
              }}
            >
              "{highlight.highlighted_text}"
            </div>
          </div>

          {/* Note textarea */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "rgba(55,67,117,.40)" }}
            >
              Your Note
            </p>
            <textarea
              autoFocus
              value={noteVal}
              onChange={(e) => setNoteVal(e.target.value)}
              placeholder="Add a note about this highlight..."
              rows={5}
              className="w-full text-sm resize-none outline-none"
              style={{
                backgroundColor: "rgba(55,67,117,.03)",
                border: "1px solid rgba(55,67,117,.10)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "#374375",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#374375";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(55,67,117,.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(55,67,117,.10)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: saved ? "#22c55e" : "#374375" }}
            onMouseEnter={(e) => { if (!saved) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
            onMouseLeave={(e) => { if (!saved) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
          >
            {saved ? "✓ Saved!" : saving ? "Saving..." : "💾 Save Note"}
          </button>

          <div style={{ borderTop: "1px solid rgba(55,67,117,.07)" }} />

          {/* Delete highlight */}
          <button
            onClick={() => { onDelete(highlight.id); onClose(); }}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ color: "#895159", backgroundColor: "rgba(137,81,89,.06)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(137,81,89,.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(137,81,89,.06)"; }}
          >
            🗑️ Delete Highlight
          </button>

          <div style={{ borderTop: "1px solid rgba(55,67,117,.07)" }} />

          {/* Linked task section */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "rgba(55,67,117,.40)" }}
            >
              Linked Task
            </p>
            {highlight.task_id ? (
              <div
                className="flex items-center gap-2 text-xs font-bold py-2"
                style={{ color: "#374375" }}
              >
                <CheckCircle2 size={14} style={{ color: "#895159" }} />
                Task already created
              </div>
            ) : (
              <button
                onClick={() => { onCreateTask(highlight); onClose(); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ backgroundColor: "rgba(55,67,117,.07)", color: "#374375" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.13)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.07)"; }}
              >
                📋 Create Task from this highlight
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
