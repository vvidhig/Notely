import type { Task, Quadrant } from "../types";
import { QUADRANT_ORDER } from "../constants/quadrants";
import MatrixQuadrant from "./MatrixQuadrant";

interface Props {
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

export default function EisenhowerMatrix({
  tasks, maxVisible, onToggle, onDelete, onEdit, onAdd, onDrop, compact, cardBg, panelBg,
}: Props) {
  const byQuadrant = (q: Quadrant) => tasks.filter((t) => t.quadrant === q);

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {QUADRANT_ORDER.map((q) => (
        <MatrixQuadrant
          key={q}
          quadrant={q}
          tasks={byQuadrant(q)}
          maxVisible={maxVisible}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onAdd={onAdd}
          onDrop={onDrop}
          compact={compact}
          cardBg={cardBg}
          panelBg={panelBg}
        />
      ))}
    </div>
  );
}
