"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCheck, Loader2 } from "lucide-react";

export default function MarkAllReadButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAll = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      toast.success("All notifications marked as read");
      router.refresh();
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAll}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <CheckCheck className="h-4 w-4 mr-2" />
      )}
      Mark all read
    </Button>
  );
}