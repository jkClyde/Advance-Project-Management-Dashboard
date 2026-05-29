import {
  Task,
  User,
  Label,
  Comment,
  TaskLabel,
  TaskStatus,
  Priority,
} from "@prisma/client";

export type TaskWithDetails = Task & {
  assignee: User | null;
  creator: User;
  labels: (TaskLabel & {
    label: Label;
  })[];
  comments: (Comment & {
    author: User;
  })[];
  _count: {
    comments: number;
  };
};

export type TaskWithAssignee = Task & {
  assignee: User | null;
  creator: User;
  labels: (TaskLabel & {
    label: Label;
  })[];
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export { TaskStatus, Priority };