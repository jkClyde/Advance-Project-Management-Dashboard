import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getRecentActivity = unstable_cache(
  async (userId: string, take = 6) => {
    return prisma.activityLog.findMany({
      where: {
        project: {
          members: { some: { userId } },
        },
      },
      select: {
        id: true,
        action: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  ["recent-activity"],
  { revalidate: 30 }
);

export const getProjectActivity = unstable_cache(
  async (projectId: string, take = 20) => {
    return prisma.activityLog.findMany({
      where: { projectId },
      select: {
        id: true,
        action: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  ["project-activity"],
  { revalidate: 30 }
);