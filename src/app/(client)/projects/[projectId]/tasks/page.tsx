
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getProjectMember } from "@/lib/data/projects";
import { getTasksByProject, getTaskStatsByProject } from "@/lib/data/tasks";
import type { TaskWithAssignee, TaskStat } from "@/types/task";
import type { Label } from "@prisma/client";
import Link from "next/link";
import TasksTable from "@/components/features/tasks/TasksTable";

import {
  ListTodo,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
        <TasksTable
          tasks={tasks as TaskWithAssignee[]}
          projectId={projectId}
        />
      )}
    </div>
  );
}