import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectMember } from "@/lib/data/projects";
import { getTaskById } from "@/lib/data/tasks";
import type { TaskWithDetails, CommentWithAuthor } from "@/types/task";
import type { Label } from "@prisma/client";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import CommentSection from "@/components/features/tasks/CommentSection";
import EditTaskButton from "@/components/features/tasks/EditTaskButton";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { projectId, taskId } = await params;

  const [task, member] = await Promise.all([
    getTaskById(taskId),
    getProjectMember(projectId, userId),
  ]);

  if (!task) notFound();
  if (!member) redirect("/projects");

  const taskWithDetails = task as unknown as TaskWithDetails;

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/projects/${projectId}/tasks`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold">{taskWithDetails.title}</h1>
              <EditTaskButton
                task={taskWithDetails}
                projectId={projectId}
                member={member}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(taskWithDetails.status)}
              {getPriorityBadge(taskWithDetails.priority)}
              {taskWithDetails.labels.map(({ label }: { label: Label }) => (
                <span
                  key={label.id}
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            {taskWithDetails.description ? (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {taskWithDetails.description}
              </p>
            ) : (
              <p className="text-muted-foreground italic">No description provided.</p>
            )}
          </div>

          <Separator />

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">
                Comments ({taskWithDetails._count.comments})
              </h3>
            </div>
            <CommentSection
              taskId={taskId}
              projectId={projectId}
              currentUserId={userId}
              comments={taskWithDetails.comments as CommentWithAuthor[]}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assignee</p>
                  {taskWithDetails.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={taskWithDetails.assignee.image ?? ""} />
                        <AvatarFallback className="text-xs">
                          {taskWithDetails.assignee.name?.charAt(0) ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {taskWithDetails.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Creator */}
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created by</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={taskWithDetails.creator.image ?? ""} />
                      <AvatarFallback className="text-xs">
                        {taskWithDetails.creator.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{taskWithDetails.creator.name}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Due Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  {taskWithDetails.dueDate ? (
                    <p className="text-sm">
                      {format(new Date(taskWithDetails.dueDate), "MMM d, yyyy")}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatDistanceToNow(new Date(taskWithDetails.dueDate), {
                          addSuffix: true,
                        })})
                      </span>
                    </p>
                  ) : (
                    <span className="text-sm text-muted-foreground">No due date</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Labels */}
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Labels</p>
                  {taskWithDetails.labels.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {taskWithDetails.labels.map(({ label }: { label: Label }) => (
                        <span
                          key={label.id}
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No labels</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Timestamps */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Created{" "}
                  {formatDistanceToNow(new Date(taskWithDetails.createdAt), {
                    addSuffix: true,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated{" "}
                  {formatDistanceToNow(new Date(taskWithDetails.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}