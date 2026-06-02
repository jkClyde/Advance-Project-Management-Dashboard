import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getProjectMember } from "@/lib/data/projects";
import { getTasksByProject } from "@/lib/data/tasks";
import type { TaskWithAssignee } from "@/types/task";
import KanbanBoard from "@/components/features/board/KanbanBoard";
import CreateTaskButton from "@/components/features/tasks/CreateTaskButton";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { projectId } = await params;

  const [project, member, tasks] = await Promise.all([
    getProjectById(projectId, userId),
    getProjectMember(projectId, userId),
    getTasksByProject(projectId),
  ]);

  if (!project) notFound();
  if (!member) redirect("/projects");

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Board</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Drag and drop tasks to update their status
          </p>
        </div>
        <CreateTaskButton
          projectId={projectId}
          projectMembers={project.members}
          projectLabels={project.labels}
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        projectId={projectId}
        initialTasks={tasks as TaskWithAssignee[]}
      />
    </div>
  );
}