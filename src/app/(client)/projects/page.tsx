import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectsByUserId, getOpenTaskCountsByUser } from "@/lib/data/projects";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Users,
  CheckCircle2,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // ✅ Only lib/data functions, no direct prisma, both cached & parallel
  const [projects, openTaskMap] = await Promise.all([
    getProjectsByUserId(userId),
    getOpenTaskCountsByUser(userId),
  ]);

  return (
    <div className="py-6 space-y-6  md:p-6 space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between flex-col md:flex-row gap-[15px]">
        <div>
          <h1 className="text-2xl font-bold text-center md:text-left">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} you
            are a member of
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderKanban className="h-16 w-16 mb-4 opacity-30" />
          <h2 className="text-lg font-semibold mb-1">No projects yet</h2>
          <p className="text-sm mb-4">
            Create your first project to get started
          </p>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {project.visibility === "PRIVATE" ? (
                        <>
                          <Lock className="h-3 w-3" />
                          Private
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3" />
                          Team
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{project._count.tasks} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project._count.members} members</span>
                    </div>
                    {openTaskMap[project.id] > 0 && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {openTaskMap[project.id]} open
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map(({ user }) => (
                        <Avatar
                          key={user.id}
                          className="h-7 w-7 border-2 border-background"
                        >
                          <AvatarImage src={user.image ?? ""} />
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0) ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project._count.members > 4 && (
                        <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            +{project._count.members - 4}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Updated{" "}
                      {formatDistanceToNow(new Date(project.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Create New Project Card */}
          <Link href="/projects/new">
            <Card className="h-full border-dashed hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <p className="font-medium">New Project</p>
                <p className="text-sm mt-1">Create a new project</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}