import { useEffect, useRef } from "react";
import type { SelectionInfo } from "../hooks/useTextHighlight";
import { Highlighter, X, Plus } from "lucide-react";

interface Props {
  selection: SelectionInfo;
  onHighlight: (info: SelectionInfo) => void;
  onCreateTask: (info: SelectionInfo) => void;
  onDismiss: () => void;
}

export default function HighlightToolbar({ selection, onHighlight, onCreateTask, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // position toolbar above selection
  const { rect } = selection;
  const top = rect.top + window.scrollY - (ref.current?.offsetHeight ?? 40) - 8;
  const left = Math.min(
    rect.left + window.scrollX + rect.width / 2 - 80,
    window.innerWidth - 180,
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-1 bg-[#111111] rounded-xl px-2 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      style={{ top: Math.max(top, 8), left: Math.max(left, 8) }}
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); onHighlight(selection); }}
        className="flex items-center gap-1.5 text-yellow-300 hover:text-yellow-100 text-base font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
      >
        <Highlighter size={13} />
        Highlight
      </button>
      <div className="w-px h-4 bg-white/20" />
      <button
        onMouseDown={(e) => { e.preventDefault(); onCreateTask(selection); }}
        className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-100 text-base font-bold px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
      >
        <Plus size={13} />
        Task
      </button>
      <div className="w-px h-4 bg-white/20" />
      <button
        onMouseDown={(e) => { e.preventDefault(); onDismiss(); }}
        className="text-white/40 hover:text-white/80 p-1 rounded-lg hover:bg-white/10 transition-all"
      >
        <X size={13} />
      </button>
    </div>
  );
}
