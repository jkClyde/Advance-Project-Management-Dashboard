"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLabelSchema, CreateLabelInput } from "@/lib/validations/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { DEFAULT_LABEL_COLORS } from "@/constants";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface ManageLabelsSectionProps {
  projectId: string;
  labels: Label[];
}

export default function ManageLabelsSection({
  projectId,
  labels,
}: ManageLabelsSectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<CreateLabelInput>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      name: "",
      color: "#6366f1",
    },
  });

  const onSubmit = async (data: CreateLabelInput) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to create label");
        return;
      }

      toast.success("Label created!");
      form.reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (labelId: string) => {
    setDeletingId(labelId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/labels?labelId=${labelId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        toast.error("Failed to delete label");
        return;
      }

      toast.success("Label deleted!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Labels */}
      {labels.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No labels yet. Create your first label below.
        </p>
      ) : (
        <div className="space-y-2">
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-sm font-medium">{label.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(label.id)}
                disabled={deletingId === label.id}
              >
                {deletingId === label.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create Label Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Bug"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={field.value}
                        onChange={field.onChange}
                        className="h-9 w-12 rounded border cursor-pointer"
                        disabled={isLoading}
                      />
                      <Input
                        {...field}
                        placeholder="#6366f1"
                        disabled={isLoading}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Color Presets */}
          <div className="flex gap-2 flex-wrap">
            {DEFAULT_LABEL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="h-6 w-6 rounded-full border-2 border-transparent hover:border-foreground transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => form.setValue("color", color)}
              />
            ))}
          </div>

          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Creating..." : "Create Label"}
          </Button>
        </form>
      </Form>
    </div>
  );
}