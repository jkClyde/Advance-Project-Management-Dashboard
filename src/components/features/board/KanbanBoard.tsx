"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TaskWithAssignee } from "@/types/task";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface KanbanBoardProps {
  projectId: string;
  initialTasks: TaskWithAssignee[];
}

const COLUMNS = [
  { id: "OPEN", title: "Open", color: "bg-blue-500" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-yellow-500" },
  { id: "CLOSED", title: "Closed", color: "bg-green-500" },
];

export default function KanbanBoard({
  projectId,
  initialTasks,
}: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByStatus = (status: string) =>
    tasks.filter((task) => task.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // If dragging over a column
    const overColumn = COLUMNS.find((col) => col.id === overId);
    if (overColumn && activeTask.status !== overColumn.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn.id as any } : t
        )
      );
    }

    // If dragging over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine new status
    let newStatus = activeTask.status;
    const overColumn = COLUMNS.find((col) => col.id === overId);
    if (overColumn) {
      newStatus = overColumn.id as any;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    // If status changed, update via API
    const originalTask = initialTasks.find((t) => t.id === activeId);
    if (originalTask && originalTask.status !== newStatus) {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks/${activeId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          toast.error("Failed to update task status");
          // Revert
          setTasks(initialTasks);
          return;
        }

        router.refresh();
      } catch {
        toast.error("Something went wrong");
        setTasks(initialTasks);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[600px]">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            projectId={projectId}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}