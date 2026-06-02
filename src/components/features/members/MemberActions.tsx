"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, Shield, UserMinus } from "lucide-react";

interface MemberActionsProps {
  projectId: string;
  userId: string;
  currentRole: string;
  isOwner: boolean;
}

export default function MemberActions({
  projectId,
  userId,
  currentRole,
  isOwner,
}: MemberActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (role: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        toast.error("Failed to update role");
        return;
      }

      toast.success("Role updated successfully!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members?userId=${userId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        toast.error("Failed to remove member");
        return;
      }

      toast.success("Member removed successfully!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isOwner && (
          <>
            {currentRole !== "MAINTAINER" && (
              <DropdownMenuItem
                onClick={() => handleRoleChange("MAINTAINER")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Make Maintainer
              </DropdownMenuItem>
            )}
            {currentRole !== "CONTRIBUTOR" && (
              <DropdownMenuItem
                onClick={() => handleRoleChange("CONTRIBUTOR")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Make Contributor
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={handleRemove}
          className="text-destructive focus:text-destructive"
        >
          <UserMinus className="h-4 w-4 mr-2" />
          Remove Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}