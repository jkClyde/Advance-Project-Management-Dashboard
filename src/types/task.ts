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
  assignee: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  labels: (TaskLabel & {
    label: {
      id: string;
      name: string;
      color: string;
    };
  })[];
  _count: {
    comments: number;
  };
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type TaskStat = {
  status: TaskStatus;
  _count: { status: number };
};

export { TaskStatus, Priority };