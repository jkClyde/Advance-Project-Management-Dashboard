"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithAssignee } from "@/types/task";
import type { Label } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: TaskWithAssignee;
  projectId: string;
  isDragging?: boolean;
}

export default function KanbanCard({
  task,
  projectId,
  isDragging = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-500";
      case "HIGH": return "bg-orange-500";
      case "MEDIUM": return "bg-blue-500";
      case "LOW": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-background rounded-lg border p-3 cursor-grab active:cursor-grabbing space-y-2 hover:border-primary/50 transition-colors",
        (isDragging || isSortableDragging) &&
          "opacity-50 shadow-lg border-primary"
      )}
    >
      {/* Priority dot + Title */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full mt-1.5 shrink-0",
            getPriorityColor(task.priority)
          )}
        />
        <Link
          href={`/projects/${projectId}/tasks/${task.id}`}
          className="text-sm font-medium hover:underline line-clamp-2"
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
      </div>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {task.labels.slice(0, 3).map(({ label }: { label: Label }) => (
            <span
              key={label.id}
              className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(task.dueDate), {
                addSuffix: true,
              })}
            </div>
          )}
          {task._count && task._count.comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </div>
          )}
        </div>

        {task.assignee && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee.image ?? ""} />
            <AvatarFallback className="text-xs">
              {task.assignee.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}