import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

export const updateCommentSchema = createCommentSchema.partial();

export const createLabelSchema = z.object({
  name: z
    .string()
    .min(1, "Label name is required")
    .max(50, "Label name must be less than 50 characters"),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format")
    .default("#6366f1"),
});

export const updateLabelSchema = createLabelSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;