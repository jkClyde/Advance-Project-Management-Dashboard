import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { FolderKanban, CheckCircle2, Calendar } from "lucide-react";
import UpdateProfileForm from "@/components/features/profile/UpdateProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, projectCount, taskStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    }),
    prisma.projectMember.count({
      where: { userId },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { assigneeId: userId },
      _count: { status: true },
    }),
  ]);

  if (!user) redirect("/login");

  const openTasks =
    taskStats.find((t) => t.status === "OPEN")?._count.status ?? 0;
  const inProgressTasks =
    taskStats.find((t) => t.status === "IN_PROGRESS")?._count.status ?? 0;
  const closedTasks =
    taskStats.find((t) => t.status === "CLOSED")?._count.status ?? 0;

  return (
    <div className="py-6 space-y-6  md:p-6 space-y-6 ">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="text-xl">
                {user.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                Member since{" "}
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{projectCount}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{openTasks}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{inProgressTasks}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{closedTasks}</p>
                <p className="text-xs text-muted-foreground">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>
            Update your display name and avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateProfileForm
            userId={userId}
            currentName={user.name ?? ""}
            currentImage={user.image ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}