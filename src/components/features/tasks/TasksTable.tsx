"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskWithAssignee } from "@/types/task";
import type { Label } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "CLOSED";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Closed", value: "CLOSED" },
];

interface TasksTableProps {
  tasks: TaskWithAssignee[];
  projectId: string;
}

export default function TasksTable({ tasks, projectId }: TasksTableProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");

  const filteredTasks =
    activeFilter === "ALL"
      ? tasks
      : tasks.filter((t) => t.status === activeFilter);

  const countFor = (status: StatusFilter) =>
    status === "ALL"
      ? tasks.length
      : tasks.filter((t) => t.status === status).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            <AlertCircle className="h-3 w-3 mr-1" />Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            <Clock className="h-3 w-3 mr-1" />In Progress
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT": return <Badge variant="destructive">Urgent</Badge>;
      case "HIGH": return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case "MEDIUM": return <Badge variant="secondary">Medium</Badge>;
      case "LOW": return <Badge variant="outline">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
        <CardTitle className="text-base">All Tasks</CardTitle>

        {/* Status filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map(({ label, value }) => {
            const isActive = activeFilter === value;
            const count = countFor(value);

            const activeColor =
              value === "OPEN" ? "text-blue-500 border-blue-500"
                : value === "IN_PROGRESS" ? "text-yellow-500 border-yellow-500"
                  : value === "CLOSED" ? "text-green-500 border-green-500"
                    : "";

            return (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter(value)}
                className={`rounded-full h-7 px-3 text-xs gap-1.5 transition-colors ${isActive ? activeColor : "text-muted-foreground"
                  }`}
              >
                {value !== "ALL" && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${value === "OPEN" ? "bg-blue-500"
                        : value === "IN_PROGRESS" ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                  />
                )}
                {label}
                <span className="ml-0.5 bg-muted text-muted-foreground rounded-full px-1.5 py-0 text-[10px] leading-4">
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            No {activeFilter !== "ALL" ? activeFilter.replace("_", " ").toLowerCase() : ""} tasks.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
                >
                  <TableCell>
                    <span className="font-medium">{task.title}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.image ?? ""} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name?.charAt(0) ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {task.labels.map(({ label }: { label: Label }) => (
                        <span
                          key={label.id}
                          className="text-xs px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {task._count.comments}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}