import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getProjectMember } from "@/lib/data/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EditProjectForm from "@/components/features/projects/EditProjectForm";
import DeleteProjectButton from "@/components/features/projects/DeleteProjectButton";
import ManageLabelsSection from "@/components/features/projects/ManageLabelsSection";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { projectId } = await params;

  const [project, member] = await Promise.all([
    getProjectById(projectId, userId),
    getProjectMember(projectId, userId),
  ]);

  if (!project) notFound();
  if (!member) redirect("/projects");

  const isOwner = member.role === "OWNER";
  const canManage = member.role === "OWNER" || member.role === "MAINTAINER";

  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your project settings
        </p>
      </div>

      {/* General Settings */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your project name, description and visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditProjectForm project={project} projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {/* Labels */}
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Labels</CardTitle>
            <CardDescription>
              Manage labels for categorizing tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManageLabelsSection
              projectId={projectId}
              labels={project.labels}
            />
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Delete Project</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this project and all its data
                </p>
              </div>
              <DeleteProjectButton projectId={projectId} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-only view for contributors */}
      {!canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Project Info</CardTitle>
            <CardDescription>
              You need Owner or Maintainer role to edit settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Project Name</p>
              <p className="font-medium">{project.name}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">
                {project.description ?? "No description"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Visibility</p>
              <p className="text-sm">{project.visibility}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}