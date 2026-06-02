"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TaskWithAssignee } from "@/types/task";
import KanbanCard from "./KanbanCard";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  title: string;
  color: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: TaskWithAssignee[];
  projectId: string;
}

export default function KanbanColumn({
  column,
  tasks,
  projectId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "bg-muted/60 border-primary/50"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className={cn("h-2.5 w-2.5 rounded-full", column.color)} />
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 p-3 flex-1 min-h-[200px]">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-8">
              No tasks
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                projectId={projectId}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}