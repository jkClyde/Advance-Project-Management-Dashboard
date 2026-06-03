import { z } from "zod";
import { Visibility } from "@prisma/client";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PRIVATE),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.nativeEnum(Visibility),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
role: z.enum(["OWNER", "MAINTAINER", "CONTRIBUTOR"]),});

export const updateMemberSchema = z.object({
  role: z.enum(["OWNER", "MAINTAINER", "CONTRIBUTOR"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;