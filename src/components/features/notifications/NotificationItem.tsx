"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  CheckCircle2,
  UserPlus,
  MessageSquare,
  Clock,
  Mail,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  inviteId?: string | null;
}

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [responded, setResponded] = useState(false);

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
      case "PROJECT_INVITE":
        return <Mail className="h-4 w-4 text-primary" />;
      default:
        return <BellRing className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleMarkRead = async () => {
    if (notification.read) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });
      router.refresh();
    } catch {
      toast.error("Failed to mark as read");
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

  const handleInviteResponse = async (action: "accept" | "decline") => {
    if (!notification.inviteId) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/invites/${notification.inviteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error || "Failed to respond to invite");
        return;
      }

      // Mark notification as read
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      });

      setResponded(true);
      toast.success(
        action === "accept"
          ? "You joined the project!"
          : "Invite declined"
      );
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const isInvite = notification.type === "PROJECT_INVITE";

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
      <div className="flex-1 min-w-0">
        <div
          className="cursor-pointer"
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

        {/* Accept/Decline buttons for invites */}
        {isInvite && !responded && notification.inviteId && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleInviteResponse("accept")}
              disabled={isLoading}
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleInviteResponse("decline")}
              disabled={isLoading}
            >
              <X className="h-3 w-3 mr-1" />
              Decline
            </Button>
          </div>
        )}

        {isInvite && responded && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            You have responded to this invite
          </p>
        )}
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