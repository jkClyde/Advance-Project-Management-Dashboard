import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectsByUserId } from "@/lib/data/projects";
import { getTasksByAssignee, getTaskStatsByUserId } from "@/lib/data/tasks";
import { getRecentActivity } from "@/lib/data/activity";
import Link from "next/link";
import {
  FolderKanban, CheckCircle2, Clock,
  AlertCircle, Plus, ArrowRight, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // ✅ Clean — uses data layer functions
  const [projects, recentTasks, recentActivity, taskStats] =
    await Promise.all([
      getProjectsByUserId(userId),
      getTasksByAssignee(userId),
      getRecentActivity(userId),
      getTaskStatsByUserId(userId),
    ]);

  const openTasks =
    taskStats.find((t) => t.status === "OPEN")?._count.status ?? 0;
  const inProgressTasks =
    taskStats.find((t) => t.status === "IN_PROGRESS")?._count.status ?? 0;
  const closedTasks =
    taskStats.find((t) => t.status === "CLOSED")?._count.status ?? 0;

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
      case "HIGH": return "destructive";
      case "MEDIUM": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500";
      case "IN_PROGRESS": return "bg-yellow-500";
      case "CLOSED": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="py-6 space-y-6  md:p-6 space-y-6 ">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening across your projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold mt-1">{projects.length}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tasks</p>
                <p className="text-3xl font-bold mt-1">{openTasks}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-1">{inProgressTasks}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed Tasks</p>
                <p className="text-3xl font-bold mt-1">{closedTasks}</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects + My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>Projects you are a member of</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No projects yet</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/projects/new">Create your first project</Link>
                </Button>
              </div>
            ) : (
              projects.slice(0, 4).map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FolderKanban className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project._count.tasks} tasks ·{" "}
                        {project._count.members} members
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {project.visibility}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No tasks assigned to you</p>
              </div>
            ) : (
              recentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}/tasks/${task.id}`}
                  className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${getStatusColor(task.status)}`} />
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.project.name}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {task.labels.map(({ label }) => (
                          <span
                            key={label.id}
                            className="text-xs px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getPriorityVariant(task.priority) as any} className="text-xs shrink-0">
                    {task.priority}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your projects</CardDescription>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={log.user.image ?? ""} />
                    <AvatarFallback>
                      {log.user.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.user.name}</span>{" "}
                      <span className="text-muted-foreground">{log.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.project.name} ·{" "}
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}