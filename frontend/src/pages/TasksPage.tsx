import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import TaskModal from "../components/TaskModal";
import type { Task } from "../types";
import { useTasks } from "../hooks/useTasks";
import { listTasks } from "../services/api";
import { Plus, Search, Calendar, CheckCircle2, Minus } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getColumn(t: Task): "todo" | "in_progress" | "done" {
  if (t.status === "completed") return "done";
  if (t.status === "in_progress") return "in_progress";
  return "todo";
}

function getPriority(tags?: string | null): { label: string; color: string; dot: boolean } | null {
  const t = (tags ?? "").toLowerCase();
  if (t.includes("high")) return { label: "High", color: "#895159", dot: true };
  if (t.includes("med"))  return { label: "Med",  color: "#BABDE2", dot: true };
  if (t.includes("low"))  return { label: "Low",  color: "rgba(55,67,117,.40)", dot: false };
  return null;
}

function getCategoryTag(tags?: string | null): string | null {
  const priorityWords = ["high", "med", "medium", "low"];
  return (
    (tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !priorityWords.includes(t.toLowerCase()))[0] ?? null
  );
}

const todayStr = new Date().toISOString().slice(0, 10);

/* ─── MinusBtn ────────────────────────────────────────────────────────── */

function MinusBtn({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center justify-center transition-all"
      style={{
        width: 22, height: 22,
        borderRadius: 6,
        backgroundColor: "rgba(55,67,117,.07)",
        color: "rgba(55,67,117,.45)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.15)";
        (e.currentTarget as HTMLButtonElement).style.color = "#374375";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.07)";
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(55,67,117,.45)";
      }}
    >
      <Minus size={10} />
    </button>
  );
}

/* ─── TaskCard ────────────────────────────────────────────────────────── */

function TaskCard({
  task, onEdit, onDelete, onMoveToTodo, onComplete, isDone,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToTodo?: () => void;  // In Progress → To Do
  onComplete?: () => void;    // In Progress → Done
  isDone?: boolean;
}) {
  const [hovering, setHovering] = useState(false);
  const priority    = getPriority(task.tags);
  const categoryTag = getCategoryTag(task.tags);
  const isOverdue   = !isDone && task.due_date && task.due_date < todayStr;

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        border: "1px solid rgba(55,67,117,.08)",
        padding: "12px 14px",
        boxShadow: hovering ? "0 4px 16px rgba(55,67,117,.10)" : "0 1px 4px rgba(55,67,117,.05)",
        opacity: isDone ? 0.72 : 1,
        transition: "all 180ms ease",
        marginBottom: 8,
      }}
    >
      {/* top row: tag pill + priority badge */}
      <div className="flex items-center justify-between mb-2">
        <div>
          {categoryTag && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(55,67,117,.08)", color: "#374375" }}
            >
              {categoryTag}
            </span>
          )}
        </div>
        {priority && (
          <span
            className="text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
            style={{ color: priority.color }}
          >
            {priority.dot
              ? <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: priority.color }} />
              : <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0 border" style={{ borderColor: priority.color }} />
            }
            {priority.label}
          </span>
        )}
      </div>

      {/* title */}
      <p
        className="text-sm font-bold leading-snug mb-3 cursor-pointer"
        style={{
          color: isDone ? "rgba(55,67,117,.45)" : "#374375",
          textDecoration: isDone ? "line-through" : "none",
        }}
        onClick={onEdit}
      >
        {task.title}
      </p>

      {/* bottom row: date + action buttons */}
      <div className="flex items-center justify-between">
        {/* date */}
        <div className="flex items-center gap-1" style={{ color: isOverdue ? "#895159" : "rgba(55,67,117,.50)" }}>
          {task.due_date ? (
            isDone ? (
              <span className="text-[11px] font-semibold">✓ {fmtDate(task.due_date)}</span>
            ) : (
              <>
                <Calendar size={11} />
                <span className="text-[11px] font-semibold">{fmtDate(task.due_date)}</span>
              </>
            )
          ) : null}
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-1.5">
          {/* In Progress: [← To Do] [→ Done] */}
          {onMoveToTodo && (
            <MinusBtn onClick={onMoveToTodo} title="Move back to To Do" />
          )}
          {onComplete && (
            <MinusBtn onClick={onComplete} title="Mark as done" />
          )}
          {/* To Do / Done: [delete] */}
          {!onMoveToTodo && !onComplete && (
            <MinusBtn onClick={onDelete} title={isDone ? "Remove" : "Delete"} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── KanbanColumn ────────────────────────────────────────────────────── */

function KanbanColumn({
  title, dotColor, count, onAdd, children, footerStyle,
}: {
  title: string;
  dotColor: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
  footerStyle?: "dashed-navy" | "dashed-periwinkle" | "solid-muted";
}) {
  const footerBg = footerStyle === "solid-muted" ? "rgba(55,67,117,.04)" : "transparent";
  const footerBorder =
    footerStyle === "dashed-periwinkle" ? "1px dashed rgba(186,189,226,.55)" :
    footerStyle === "solid-muted" ? "1px dashed rgba(55,67,117,.15)" :
    "1px dashed rgba(55,67,117,.18)";

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: 220 }}>
      {/* column header */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <p className="text-sm font-bold flex-1" style={{ color: "#374375" }}>{title}</p>
        <span className="text-xs font-bold" style={{ color: "rgba(55,67,117,.55)" }}>{count}</span>
        <button
          onClick={onAdd}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-all"
          style={{ backgroundColor: "rgba(55,67,117,.07)", color: "rgba(55,67,117,.45)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(55,67,117,.07)"; }}
        >
          <Plus size={11} />
        </button>
      </div>

      {/* scrollable cards area */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {children}
      </div>

      {/* add task footer */}
      <div className="pt-1 pb-1 flex-shrink-0">
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{
            backgroundColor: footerBg,
            color: "rgba(55,67,117,.40)",
            border: footerBorder,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#374375"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(55,67,117,.40)"; }}
        >
          <Plus size={12} /> Add task
        </button>
      </div>
    </div>
  );
}

/* ─── page ────────────────────────────────────────────────────────────── */

export default function TasksPage() {
  const [allTasks, setAllTasks]     = useState<Task[]>([]);
  const [showDone, setShowDone]     = useState(true);
  const [activeTag, setActiveTag]   = useState<string>("all");
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTask, setEditTask]     = useState<Task | null>(null);
  const [defaultCol, setDefaultCol] = useState<"todo" | "in_progress">("todo");
  const { add, update, toggle, remove } = useTasks();

  const reload = useCallback(async () => {
    try {
      const res = await listTasks({});
      setAllTasks(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  /* derived columns */
  const todoTasks   = allTasks.filter((t) => getColumn(t) === "todo");
  const inProgTasks = allTasks.filter((t) => getColumn(t) === "in_progress");
  const doneTasks   = allTasks.filter((t) => getColumn(t) === "done");
  const activeCnt   = allTasks.filter((t) => t.status !== "completed").length;
  const totalCnt    = allTasks.length;
  const pct         = totalCnt > 0 ? Math.round((doneTasks.length / totalCnt) * 100) : 0;

  /* category tags for filter tabs */
  const allCategoryTags = Array.from(
    new Set(
      allTasks
        .flatMap((t) => (t.tags ?? "").split(",").map((s) => s.trim()))
        .filter((t) => t && !["high", "med", "medium", "low"].includes(t.toLowerCase()))
    )
  );

  function filterList(list: Task[]): Task[] {
    return list.filter((t) => {
      const matchTag    = activeTag === "all" || (t.tags ?? "").toLowerCase().includes(activeTag.toLowerCase());
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      return matchTag && matchSearch;
    });
  }

  /* handlers */
  const handleSave = async (data: Parameters<typeof add>[0]) => {
    if (editTask) {
      await update(editTask.id, data);
    } else {
      const initialStatus = defaultCol === "in_progress" ? "in_progress" : undefined;
      await add({ ...data, status: initialStatus });
    }
    await reload();
  };

  const handleDelete     = async (id: number) => { await remove(id);                                        await reload(); };
  const handleComplete   = async (id: number) => { await toggle(id);                                        await reload(); };
  const handleToInProg   = async (id: number) => { await update(id, { status: "in_progress" });             await reload(); };
  const handleToTodo     = async (id: number) => { await update(id, { status: "active" });                  await reload(); };
  const handleReactivate = async (id: number) => { await update(id, { status: "active" });                  await reload(); };

  const openModal = (col: "todo" | "in_progress", task: Task | null = null) => {
    setDefaultCol(col);
    setEditTask(task);
    setModalOpen(true);
  };

  const filteredTodo   = filterList(todoTasks);
  const filteredInProg = filterList(inProgTasks);
  const filteredDone   = filterList(doneTasks);

  return (
    <div
      className="flex h-[100dvh]"
      style={{
        backgroundColor: "#FFFCF5",
        backgroundImage: "radial-gradient(rgba(55,67,117,.06) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
      }}
    >
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── header ─────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-['Yeseva_One'] text-2xl font-bold" style={{ color: "#374375" }}>
              Task Manager
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(55,67,117,.55)" }}>
              {activeCnt} active · {doneTasks.length} completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                backgroundColor: showDone ? "rgba(55,67,117,.08)" : "rgba(55,67,117,.05)",
                color: "rgba(55,67,117,.55)",
                border: "1px solid rgba(55,67,117,.10)",
              }}
            >
              <CheckCircle2 size={13} />
              {showDone ? "Hide done" : "Show done"}
            </button>
            <button
              onClick={() => openModal("todo")}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all"
              style={{ backgroundColor: "#374375" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A3562"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374375"; }}
            >
              <Plus size={16} /> New task
            </button>
          </div>
        </div>

        {/* ── stat cards ─────────────────────────────────────────────── */}
        <div className="px-6 pb-3 grid grid-cols-4 gap-3 flex-shrink-0">
          {/* To Do */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
          >
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{ border: "2px solid rgba(55,67,117,.30)" }}
            />
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "#374375" }}>{todoTasks.length}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.50)" }}>To Do</p>
            </div>
          </div>

          {/* In Progress */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
          >
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{ background: "conic-gradient(#BABDE2 0% 50%, rgba(186,189,226,.20) 50% 100%)" }}
            />
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "#374375" }}>{inProgTasks.length}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.50)" }}>In Progress</p>
            </div>
          </div>

          {/* Done */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
          >
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "rgba(55,67,117,.35)" }}
            />
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "#374375" }}>{doneTasks.length}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.50)" }}>Done</p>
            </div>
          </div>

          {/* Completion % */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid rgba(55,67,117,.08)", boxShadow: "0 2px 8px rgba(55,67,117,.05)" }}
          >
            <p className="text-sm font-bold" style={{ color: "#895159" }}>{pct}%</p>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: "#374375" }}>
                {doneTasks.length}/{totalCnt}
              </p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: "rgba(55,67,117,.50)" }}>Completed</p>
            </div>
          </div>
        </div>

        {/* ── filter tabs + search ────────────────────────────────────── */}
        <div className="px-6 pb-3 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-1.5 flex-wrap">
            {["all", ...allCategoryTags].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize"
                style={{
                  backgroundColor: activeTag === tag ? "#374375" : "rgba(55,67,117,.08)",
                  color: activeTag === tag ? "#ffffff" : "#374375",
                }}
              >
                {tag === "all" ? "All" : tag}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(55,67,117,.40)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(55,67,117,.10)",
                color: "#374375",
                width: 200,
              }}
            />
          </div>
        </div>

        {/* ── kanban board ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden px-6 pb-5">
          <div className="h-full flex gap-4">

            {/* To Do */}
            <KanbanColumn
              title="To Do"
              dotColor="#895159"
              count={filteredTodo.length}
              onAdd={() => openModal("todo")}
              footerStyle="dashed-navy"
            >
              {filteredTodo.length === 0 ? (
                <EmptyState label="No tasks to do" />
              ) : filteredTodo.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => openModal("todo", task)}
                  onDelete={() => handleDelete(task.id)}
                />
              ))}
            </KanbanColumn>

            {/* In Progress */}
            <KanbanColumn
              title="In Progress"
              dotColor="#BABDE2"
              count={filteredInProg.length}
              onAdd={() => openModal("in_progress")}
              footerStyle="dashed-periwinkle"
            >
              {filteredInProg.length === 0 ? (
                <EmptyState label="Nothing in progress" />
              ) : filteredInProg.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => openModal("in_progress", task)}
                  onDelete={() => handleDelete(task.id)}
                  onMoveToTodo={() => handleToTodo(task.id)}
                  onComplete={() => handleComplete(task.id)}
                />
              ))}
            </KanbanColumn>

            {/* Done (toggle-able) */}
            {showDone && (
              <KanbanColumn
                title="Done"
                dotColor="rgba(55,67,117,.40)"
                count={filteredDone.length}
                onAdd={() => openModal("todo")}
                footerStyle="solid-muted"
              >
                {filteredDone.length === 0 ? (
                  <EmptyState label="No completed tasks" />
                ) : filteredDone.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDone
                    onEdit={() => { setEditTask(task); setModalOpen(true); }}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </KanbanColumn>
            )}

          </div>
        </div>
      </main>

      {modalOpen && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

/* ─── EmptyState ──────────────────────────────────────────────────────── */

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-xs font-medium" style={{ color: "rgba(55,67,117,.35)" }}>{label}</p>
    </div>
  );
}
