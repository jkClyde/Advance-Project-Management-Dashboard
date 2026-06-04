import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotificationsByUserId } from "@/lib/data/notifications";
import prisma from "@/lib/prisma";
import { Bell, CheckCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MarkAllReadButton from "@/components/features/notifications/MarkAllReadButton";
import NotificationItem from "@/components/features/notifications/NotificationItem";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const notifications = await getNotificationsByUserId(userId);

  // ✅ Fetch invite statuses for all invite notifications
  const inviteIds = notifications
    .filter((n) => n.inviteId)
    .map((n) => n.inviteId as string);

  const invites = inviteIds.length > 0
    ? await prisma.projectInvite.findMany({
      where: { id: { in: inviteIds } },
      select: { id: true, status: true },
    })
    : [];

  const inviteStatusMap = Object.fromEntries(
    invites.map((i) => [i.id, i.status])
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="py-6 space-y-6  md:p-6 space-y-6 ">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell className="h-16 w-16 mb-4 opacity-30" />
          <h2 className="text-lg font-semibold mb-1">No notifications</h2>
          <p className="text-sm">
            You're all caught up! Notifications will appear here.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications
            </CardTitle>
            <CardDescription>
              {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  // ✅ Pass invite status so component knows if already responded
                  inviteStatus={
                    notification.inviteId
                      ? inviteStatusMap[notification.inviteId]
                      : undefined
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}