import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { TaskStatus, Priority } from "@prisma/client";

export const getTasksByAssignee = unstable_cache(
  async (userId: string) => {
    return prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "CLOSED" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        project: {
          select: { id: true, name: true },
        },
        labels: {
          select: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          take: 2,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  },
  ["tasks-by-assignee"],
  { revalidate: 30 }
);

export const getTasksByProject = unstable_cache(
  async (
    projectId: string,
    filters?: {
      status?: TaskStatus;
      priority?: Priority;
      assigneeId?: string;
      labelId?: string;
      search?: string;
    }
  ) => {
    return prisma.task.findMany({
      where: {
        projectId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
        ...(filters?.labelId && {
          labels: { some: { labelId: filters.labelId } },
        }),
        ...(filters?.search && {
          title: { contains: filters.search, mode: "insensitive" },
        }),
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        labels: {
          select: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["tasks-by-project"],
  { revalidate: 30 }
);

export const getTaskById = unstable_cache(
  async (taskId: string) => {
    return prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        labels: {
          select: {
            label: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  },
  ["task-by-id"],
  { revalidate: 30 }
);

export const getTaskStatsByUserId = unstable_cache(
  async (userId: string) => {
    return prisma.task.groupBy({
      by: ["status"],
      where: {
        project: {
          members: { some: { userId } },
        },
      },
      _count: { status: true },
    });
  },
  ["task-stats-by-user"],
  { revalidate: 30 }
);