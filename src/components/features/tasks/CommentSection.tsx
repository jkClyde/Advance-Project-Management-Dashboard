"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentWithAuthor } from "@/types/task";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Pencil, Trash2 } from "lucide-react";

interface CommentSectionProps {
  taskId: string;
  projectId: string;
  currentUserId: string;
  comments: CommentWithAuthor[];
}

export default function CommentSection({
  taskId,
  projectId,
  currentUserId,
  comments,
}: CommentSectionProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        toast.error("Failed to add comment");
        return;
      }

      setContent("");
      toast.success("Comment added!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId, content: editContent }),
        }
      );

      if (!response.ok) {
        toast.error("Failed to update comment");
        return;
      }

      setEditingId(null);
      toast.success("Comment updated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments?commentId=${commentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        toast.error("Failed to delete comment");
        return;
      }

      toast.success("Comment deleted!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment List */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author.image ?? ""} />
                <AvatarFallback>
                  {comment.author.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    {comment.author.id === currentUserId && (
                      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment */}
      <div className="flex gap-3 pt-2">
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment... Use @username to mention someone"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isSubmitting}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
            {isSubmitting ? "Adding..." : "Add Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}