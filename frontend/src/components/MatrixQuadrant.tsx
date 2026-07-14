import { useState } from "react";
import type { Task, Quadrant } from "../types";
import { QUADRANT_CONFIG } from "../constants/quadrants";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";

interface Props {
  quadrant: Quadrant;
  tasks: Task[];
  maxVisible?: number;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  onAdd: (quadrant: Quadrant) => void;
  onDrop: (taskId: number, quadrant: Quadrant) => void;
  compact?: boolean;
  cardBg?: string;
  panelBg?: string;
}

export default function MatrixQuadrant({
  quadrant, tasks, maxVisible = 5,
  onToggle, onDelete, onEdit, onAdd, onDrop, compact, cardBg,
}: Props) {
  const cfg = QUADRANT_CONFIG[quadrant];
  const [showAll, setShowAll] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const visible = showAll ? tasks : tasks.slice(0, maxVisible);
  const hasMore = tasks.length > maxVisible && !showAll;
  const active = tasks.filter((t) => t.status === "active");
  const completed = tasks.filter((t) => t.status === "completed");

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const id = parseInt(e.dataTransfer.getData("taskId"), 10);
    if (id) onDrop(id, quadrant);
  };
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", String(taskId));
  };

  return (
    <div
      className="flex flex-col overflow-hidden transition-all"
      style={{
        background: "#ffffff",
        borderRadius: "24px",
        border: dragOver
          ? `2px solid ${cfg.color}`
          : "1px solid rgba(17,17,17,.06)",
        boxShadow: dragOver
          ? `0 0 0 3px ${cfg.color}22`
          : "0 12px 40px rgba(17,17,17,.08)",
        minHeight: compact ? 140 : 200,
        transition: "box-shadow 200ms, border-color 200ms",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Coloured header strip */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(17,17,17,.05)" }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: cfg.color, display: "inline-flex" }}><cfg.icon size={18} /></span>
          <span className="text-base font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          {active.length > 0 && (
            <span
              className="text-sm px-1.5 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}
            >
              {active.length}
            </span>
          )}
          {!compact && (
            <span className="text-sm hidden sm:inline" style={{ color: "#8A8A8A" }}>
              {cfg.subtitle}
            </span>
          )}
        </div>
        <button
          onClick={() => onAdd(quadrant)}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: cfg.badgeBg, color: cfg.color }}
          title={`Add to ${cfg.label}`}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-1.5 flex-1 p-3">
        {visible.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onDragStart={handleDragStart}
            compact={compact}
            cardBg={cardBg}
          />
        ))}

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="text-base font-semibold py-1 rounded-xl transition-opacity hover:opacity-70 text-center"
            style={{ color: cfg.color }}
          >
            + {tasks.length - maxVisible} more
          </button>
        )}

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-base text-center py-4 italic" style={{ color: "#8A8A8A" }}>
              {quadrant === "neither" ? "Nothing to eliminate" : "Drop tasks here"}
            </p>
          </div>
        )}

        {completed.length > 0 && showAll && (
          <p className="text-sm font-semibold mt-1 px-1" style={{ color: "#8A8A8A" }}>
            {completed.length} completed
          </p>
        )}
      </div>
    </div>
  );
}
