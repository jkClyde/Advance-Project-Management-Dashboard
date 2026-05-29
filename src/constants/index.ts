import { MemberRole, Visibility, TaskStatus, Priority, NotificationType, ActivityAction } from "@prisma/client";

// =============================
// PROJECT CONSTANTS
// =============================

export const PROJECT_VISIBILITY_OPTIONS = [
  {
    label: "Private",
    value: Visibility.PRIVATE,
    description: "Only you can see this project",
  },
  {
    label: "Team",
    value: Visibility.TEAM,
    description: "All team members can see this project",
  },
];

export const MEMBER_ROLE_OPTIONS = [
  {
    label: "Owner",
    value: MemberRole.OWNER,
    description: "Full access to the project",
  },
  {
    label: "Maintainer",
    value: MemberRole.MAINTAINER,
    description: "Can manage tasks and members",
  },
  {
    label: "Contributor",
    value: MemberRole.CONTRIBUTOR,
    description: "Can create and update tasks",
  },
];

// =============================
// TASK CONSTANTS
// =============================

export const TASK_STATUS_OPTIONS = [
  {
    label: "Open",
    value: TaskStatus.OPEN,
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  {
    label: "In Progress",
    value: TaskStatus.IN_PROGRESS,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
  },
  {
    label: "Closed",
    value: TaskStatus.CLOSED,
    color: "bg-green-500",
    textColor: "text-green-500",
  },
];

export const TASK_PRIORITY_OPTIONS = [
  {
    label: "Low",
    value: Priority.LOW,
    color: "bg-gray-500",
    textColor: "text-gray-500",
  },
  {
    label: "Medium",
    value: Priority.MEDIUM,
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  {
    label: "High",
    value: Priority.HIGH,
    color: "bg-orange-500",
    textColor: "text-orange-500",
  },
  {
    label: "Urgent",
    value: Priority.URGENT,
    color: "bg-red-500",
    textColor: "text-red-500",
  },
];

// =============================
// LABEL DEFAULTS
// =============================

export const DEFAULT_LABEL_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#06b6d4", // cyan
];

export const DEFAULT_LABELS = [
  { name: "Bug", color: "#ef4444" },
  { name: "Feature", color: "#6366f1" },
  { name: "Backend", color: "#8b5cf6" },
  { name: "Frontend", color: "#3b82f6" },
  { name: "Urgent", color: "#f97316" },
  { name: "Documentation", color: "#14b8a6" },
];

// =============================
// NOTIFICATION CONSTANTS
// =============================

export const NOTIFICATION_MESSAGES = {
  [NotificationType.TASK_ASSIGNED]: "You have been assigned to a task",
  [NotificationType.TASK_MENTIONED]: "You were mentioned in a comment",
  [NotificationType.STATUS_CHANGED]: "A task status has been updated",
  [NotificationType.DEADLINE_REMINDER]: "A task deadline is approaching",
  [NotificationType.MEMBER_ADDED]: "You have been added to a project",
};

// =============================
// ACTIVITY CONSTANTS
// =============================

export const ACTIVITY_MESSAGES = {
  [ActivityAction.TASK_CREATED]: "created a task",
  [ActivityAction.TASK_CLOSED]: "closed a task",
  [ActivityAction.TASK_UPDATED]: "updated a task",
  [ActivityAction.STATUS_CHANGED]: "changed the status of a task",
  [ActivityAction.MEMBER_ADDED]: "added a member to the project",
  [ActivityAction.MEMBER_REMOVED]: "removed a member from the project",
  [ActivityAction.COMMENT_ADDED]: "commented on a task",
  [ActivityAction.LABEL_ADDED]: "added a label to a task",
};

// =============================
// PAGINATION
// =============================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// =============================
// FILE UPLOAD
// =============================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];