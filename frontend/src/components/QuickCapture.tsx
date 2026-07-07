import { useState } from "react";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (title: string) => Promise<void>;
}

export default function QuickCapture({ onAdd }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const title = value.trim();
    if (!title) return;
    setLoading(true);
    try { await onAdd(title); setValue(""); }
    finally { setLoading(false); }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: "1px solid rgba(55,67,117,.08)",
        boxShadow: "0 8px 32px rgba(55,67,117,.07)",
        padding: "12px 16px",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(55,67,117,.50)" }}>
        Quick capture
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a task instantly…"
          disabled={loading}
          className="flex-1 text-sm font-medium px-3 py-2 transition-all focus:outline-none"
          style={{
            background: "#F8FAFC",
            border: "1px solid rgba(55,67,117,.10)",
            borderRadius: "12px",
            color: "#374375",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "#374375";
            (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(55,67,117,.12)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(55,67,117,.10)";
            (e.target as HTMLInputElement).style.boxShadow = "none";
          }}
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="flex-shrink-0 flex items-center justify-center px-3 py-2 font-bold transition-all disabled:opacity-40"
          style={{
            background: "#374375",
            color: "#ffffff",
            borderRadius: "12px",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2A3562"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#374375"; }}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
