"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  Clock,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "TASK_MENTIONED":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "STATUS_CHANGED":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "MEMBER_ADDED":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <BellRing className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleMarkRead = async () => {
    if (notification.read) return;
    setIsLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      router.refresh();
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await fetch(
        `/api/notifications?notificationId=${notification.id}`,
        { method: "DELETE" }
      );
      toast.success("Notification deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      {/* Icon */}
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleMarkRead}
      >
        <p className={cn(
          "text-sm",
          !notification.read && "font-medium"
        )}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}