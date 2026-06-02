import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getProjectMember } from "@/lib/data/projects";
import { getTasksByProject, getTaskStatsByProject } from "@/lib/data/tasks";
import type { TaskWithAssignee, TaskStat } from "@/types/task";
import type { Label } from "@prisma/client";
import Link from "next/link";

import {
  ListTodo,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import CreateTaskButton from "@/components/features/tasks/CreateTaskButton";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { projectId } = await params;

  const [project, member, tasks, taskStats] = await Promise.all([
    getProjectById(projectId, userId),
    getProjectMember(projectId, userId),
    getTasksByProject(projectId),
    getTaskStatsByProject(projectId),
  ]);

  if (!project) notFound();
  if (!member) redirect("/projects");

  const openTasks =
    (taskStats as TaskStat[]).find((t) => t.status === "OPEN")?._count.status ?? 0;
  const inProgressTasks =
    (taskStats as TaskStat[]).find((t) => t.status === "IN_PROGRESS")?._count.status ?? 0;
  const closedTasks =
    (taskStats as TaskStat[]).find((t) => t.status === "CLOSED")?._count.status ?? 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>;
      case "HIGH":
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case "MEDIUM":
        return <Badge variant="secondary">Medium</Badge>;
      case "LOW":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Tasks</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} in this project
          </p>
        </div>
        <CreateTaskButton
          projectId={projectId}
          projectMembers={project.members}
          projectLabels={project.labels}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openTasks}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressTasks}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold">{closedTasks}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ListTodo className="h-16 w-16 mb-4 opacity-30" />
          <h2 className="text-lg font-semibold mb-1">No tasks yet</h2>
          <p className="text-sm mb-4">Create your first task to get started</p>
          <CreateTaskButton
            projectId={projectId}
            projectMembers={project.members}
            projectLabels={project.labels}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                {(tasks as TaskWithAssignee[]).map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-accent"
                  >
                    <TableCell>
                      <Link
                        href={`/projects/${projectId}/tasks/${task.id}`}
                        className="font-medium hover:underline"
                      >
                        {task.title}
                      </Link>
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
                        <span className="text-muted-foreground text-sm">
                          Unassigned
                        </span>
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
                          {formatDistanceToNow(new Date(task.dueDate), {
                            addSuffix: true,
                          })}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}