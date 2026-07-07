import { useState, useEffect } from "react";
import type { Task } from "../types";
import { X, Bell, BellOff, Clock, CalendarDays, Tag, ChevronRight } from "lucide-react";

const REMINDER_OPTIONS = [
  { value: null,  label: "No reminder"     },
  { value: 5,     label: "5 min before"    },
  { value: 10,    label: "10 min before"   },
  { value: 20,    label: "20 min before"   },
  { value: 30,    label: "30 min before"   },
  { value: 60,    label: "1 hour before"   },
];

interface Props {
  task?: Task | null;
  prefillTitle?: string;
  prefillDescription?: string;
  onSave: (data: {
    title: string; description?: string; execution_steps?: string;
    due_date?: string; due_time?: string;
    reminder_minutes?: number | null; tags?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const INPUT_STYLE = {
  background: "#F8FAFC",
  border: "1px solid rgba(55,67,117,.12)",
  borderRadius: "14px",
  color: "#374375",
  fontFamily: "Quicksand, sans-serif",
  fontSize: "0.875rem",
  fontWeight: 500,
  width: "100%",
  padding: "10px 14px",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
};

function Input({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...INPUT_STYLE, ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#374375";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(55,67,117,.12)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(55,67,117,.12)";
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
    />
  );
}

function Textarea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...INPUT_STYLE, resize: "none", ...style }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#374375";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(55,67,117,.12)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(55,67,117,.12)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(55,67,117,.55)" }}>
      {children}
    </p>
  );
}

export default function TaskModal({
  task, prefillTitle, prefillDescription, onSave, onClose,
}: Props) {
  const [title, setTitle]             = useState(task?.title ?? prefillTitle ?? "");
  const [description, setDescription] = useState(task?.description ?? prefillDescription ?? "");
  const [executionSteps, setExecutionSteps] = useState(task?.execution_steps ?? "");
  const [dueDate, setDueDate]         = useState(task?.due_date ?? "");
  const [dueTime, setDueTime]         = useState(task?.due_time ?? "");
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(task?.reminder_minutes ?? null);
  const [tags, setTags]               = useState(task?.tags ?? "");
  const [saving, setSaving]           = useState(false);
  const [showExecution, setShowExecution] = useState(!!(task?.execution_steps));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        execution_steps: executionSteps.trim() || undefined,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        reminder_minutes: reminderMinutes,
        tags: tags.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const hasSchedule = !!dueDate || !!dueTime;

  const formatTimeLabel = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(55,67,117,.25)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg flex flex-col max-h-[90vh]"
        style={{
          background: "#ffffff",
          borderRadius: "28px",
          border: "1px solid rgba(55,67,117,.08)",
          boxShadow: "0 24px 64px rgba(55,67,117,.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(55,67,117,.06)" }}
        >
          <h2 className="font-['Yeseva_One'] text-2xl font-bold" style={{ color: "#374375" }}>
            {task ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(55,67,117,.08)", color: "rgba(55,67,117,.55)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <form id="task-form" onSubmit={handleSubmit}>
            <div className="space-y-4">

              {/* Title */}
              <div>
                <FieldLabel>Task</FieldLabel>
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required
                />
              </div>

              {/* What to do */}
              <div>
                <FieldLabel>
                  What to do <span style={{ color: "rgba(55,67,117,.55)" }} className="font-medium normal-case tracking-normal">optional</span>
                </FieldLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the task in more detail…"
                  rows={2}
                />
              </div>

              {/* How to execute (collapsible) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowExecution(!showExecution)}
                  className="flex items-center gap-1.5 mb-1.5 transition-all"
                  style={{ color: showExecution ? "#374375" : "rgba(55,67,117,.50)" }}
                >
                  <ChevronRight
                    size={12}
                    style={{ transform: showExecution ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 200ms" }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    How to execute
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: "rgba(55,67,117,.55)" }}>optional</span>
                </button>
                {showExecution && (
                  <Textarea
                    value={executionSteps}
                    onChange={(e) => setExecutionSteps(e.target.value)}
                    placeholder={"Step 1: …\nStep 2: …\nStep 3: …"}
                    rows={3}
                    style={{ backgroundColor: "#FAFBFD" }}
                  />
                )}
              </div>

              {/* Schedule */}
              <div>
                <FieldLabel>
                  <CalendarDays size={10} className="inline mr-1" />Schedule
                </FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(55,67,117,.55)" }} />
                    <input type="date" value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{ ...INPUT_STYLE, paddingLeft: "32px" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#374375";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(55,67,117,.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(55,67,117,.12)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div className="relative">
                    <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(55,67,117,.55)" }} />
                    <input type="time" value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      style={{ ...INPUT_STYLE, paddingLeft: "32px" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#374375";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(55,67,117,.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "rgba(55,67,117,.12)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Reminder */}
              <div>
                <FieldLabel>
                  <Bell size={10} className="inline mr-1" />Reminder
                </FieldLabel>
                <div className="grid grid-cols-3 gap-1.5">
                  {REMINDER_OPTIONS.map(({ value, label }) => {
                    const active   = reminderMinutes === value;
                    const disabled = !hasSchedule && value !== null;
                    return (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => setReminderMinutes(value)}
                        disabled={disabled}
                        className="py-2 px-2 text-[10px] font-bold transition-all"
                        style={{
                          borderRadius: "12px",
                          border: active ? "2px solid #374375" : "1px solid rgba(55,67,117,.10)",
                          backgroundColor: active ? "#374375" : disabled ? "#F8FAFC" : "#F8FAFC",
                          color: active ? "#ffffff" : disabled ? "rgba(55,67,117,.30)" : "rgba(55,67,117,.55)",
                          cursor: disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        {value === null
                          ? <span className="flex items-center justify-center gap-1"><BellOff size={9} /> None</span>
                          : label}
                      </button>
                    );
                  })}
                </div>
                {!hasSchedule && (
                  <p className="text-[10px] font-medium mt-1.5" style={{ color: "rgba(55,67,117,.50)" }}>
                    Set a date or time to enable reminders
                  </p>
                )}
                {hasSchedule && reminderMinutes !== null && (
                  <p className="text-[10px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: "#374375" }}>
                    <Bell size={9} />
                    Notified {reminderMinutes === 60 ? "1 hour" : `${reminderMinutes} min`} before
                    {dueTime ? ` at ${formatTimeLabel(dueTime)}` : ""}.
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <FieldLabel>
                  <Tag size={10} className="inline mr-1" />Tags
                </FieldLabel>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="work, urgent, reading…"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(55,67,117,.06)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 font-bold text-sm transition-all"
            style={{
              background: "#F8FAFC",
              border: "1px solid rgba(55,67,117,.10)",
              borderRadius: "14px",
              color: "rgba(55,67,117,.55)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,67,117,.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8FAFC"; }}
          >
            Cancel
          </button>
          <button
            form="task-form"
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 font-bold text-sm text-white transition-all disabled:opacity-50"
            style={{
              background: "#374375",
              borderRadius: "14px",
              boxShadow: "0 4px 14px rgba(55,67,117,.20)",
            }}
            onMouseEnter={(e) => {
              if (!saving && title.trim())
                (e.currentTarget as HTMLButtonElement).style.background = "#2A3562";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#374375";
            }}
          >
            {saving ? "Saving…" : task ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
