import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getProjectsByUserId = unstable_cache(
  async (userId: string) => {
    return prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        updatedAt: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: 4,
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },
  ["projects-by-user"],
  { revalidate: 30 }
);

// ✅ No unstable_cache — plain async, arguments passed directly
export const getProjectById = async (projectId: string, userId: string) => {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      members: { some: { userId } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      labels: true,
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
  });
};

// ✅ No unstable_cache — plain async
export const getProjectMember = async (projectId: string, userId: string) => {
  return prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
};

export const getOpenTaskCountsByUser = unstable_cache(
  async (userId: string) => {
    const counts = await prisma.task.groupBy({
      by: ["projectId"],
      where: {
        project: {
          members: { some: { userId } },
        },
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      _count: { projectId: true },
    });

    return Object.fromEntries(
      counts.map((t) => [t.projectId, t._count.projectId])
    );
  },
  ["open-task-counts"],
  { revalidate: 30 }
);

export const getPendingInvites = async (projectId: string) => {
  return prisma.projectInvite.findMany({
    where: {
      projectId,
      status: "PENDING",
    },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getRecentProjectsByUserId = unstable_cache(
  async (userId: string) => {
    return prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      select: {
        id: true,
        name: true,
        visibility: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
  },
  ["recent-projects-by-user"],
  { revalidate: 30 }
);