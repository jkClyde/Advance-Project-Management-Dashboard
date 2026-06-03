import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectMember } from "@/lib/data/projects";
import { getProjectActivity } from "@/lib/data/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity,
  MessageSquare,
  UserPlus,
  UserMinus,
  Tag,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { projectId } = await params;

  const [member, activity] = await Promise.all([
    getProjectMember(projectId, userId),
    getProjectActivity(projectId, 50),
  ]);

  if (!member) redirect("/projects");

  const getActionIcon = (action: string) => {
    switch (action) {
      case "TASK_CREATED":
        return <PlusCircle className="h-4 w-4 text-blue-500" />;
      case "TASK_CLOSED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "TASK_UPDATED":
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case "STATUS_CHANGED":
        return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case "MEMBER_ADDED":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "MEMBER_REMOVED":
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case "COMMENT_ADDED":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "LABEL_ADDED":
        return <Tag className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "TASK_CREATED":
        return <Badge variant="outline" className="text-blue-500 border-blue-500 text-xs">Created</Badge>;
      case "TASK_CLOSED":
        return <Badge variant="outline" className="text-green-500 border-green-500 text-xs">Closed</Badge>;
      case "TASK_UPDATED":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500 text-xs">Updated</Badge>;
      case "STATUS_CHANGED":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500 text-xs">Status</Badge>;
      case "MEMBER_ADDED":
        return <Badge variant="outline" className="text-green-500 border-green-500 text-xs">Member</Badge>;
      case "MEMBER_REMOVED":
        return <Badge variant="outline" className="text-red-500 border-red-500 text-xs">Removed</Badge>;
      case "COMMENT_ADDED":
        return <Badge variant="outline" className="text-purple-500 border-purple-500 text-xs">Comment</Badge>;
      case "LABEL_ADDED":
        return <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">Label</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{action}</Badge>;
    }
  };

  // Group activity by date
  const groupedActivity = activity.reduce(
    (groups, log) => {
      const date = format(new Date(log.createdAt), "MMM d, yyyy");
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
      return groups;
    },
    {} as Record<string, typeof activity>
  );

  return (
    <div className="py-6 space-y-6  md:p-6 space-y-6 ">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Activity</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Full history of all project activity
        </p>
      </div>

      {/* Activity Feed */}
      {activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Activity className="h-16 w-16 mb-4 opacity-30" />
          <h2 className="text-lg font-semibold mb-1">No activity yet</h2>
          <p className="text-sm">
            Activity will appear here as your team works on the project
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivity).map(([date, logs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground font-medium">
                  {date}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4"
                      >
                        {/* Icon */}
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          {getActionIcon(log.action)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={log.user.image ?? ""} />
                              <AvatarFallback className="text-xs">
                                {log.user.name?.charAt(0) ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {log.user.name}
                            </span>
                            {getActionBadge(log.action)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {log.message}
                          </p>
                          {log.task && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Task: {log.task.title}
                            </p>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}