import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getProjectById, getProjectMember } from "@/lib/data/projects";
import { Users } from "lucide-react";
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
import InviteMemberButton from "@/components/features/members/InviteMemberButton";
import MemberActions from "@/components/features/members/MemberActions";

export default async function MembersPage({
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
  const isMaintainer = member.role === "MAINTAINER";
  const canManage = isOwner || isMaintainer;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER": return "default";
      case "MAINTAINER": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Members</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {project._count.members} member
            {project._count.members !== 1 ? "s" : ""} in this project
          </p>
        </div>
        {canManage && (
          <InviteMemberButton projectId={projectId} />
        )}
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage who has access to this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.members.map(({ user, role, joinedAt }) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image ?? ""} />
                  <AvatarFallback>
                    {user.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{user.name}</p>
                    {user.id === userId && (
                      <span className="text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined{" "}
                    {formatDistanceToNow(new Date(joinedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(role) as any}>
                  {role}
                </Badge>
                {canManage && user.id !== userId && role !== "OWNER" && (
                  <MemberActions
                    projectId={projectId}
                    userId={user.id}
                    currentRole={role}
                    isOwner={isOwner}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}