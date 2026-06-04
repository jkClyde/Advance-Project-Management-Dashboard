import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getNotificationsByUserId = async (userId: string) => {
  return unstable_cache(
    async () => {
      return prisma.notification.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          message: true,
          read: true,
          createdAt: true,
          inviteId: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    [`notifications-${userId}`],
    {
      revalidate: 5,
      tags: [`notifications-${userId}`],
    }
  )();
};

export const getUnreadNotificationCount = async (userId: string) => {
  return unstable_cache(
    async () => {
      return prisma.notification.count({
        where: { userId, read: false },
      });
    },
    [`unread-notifications-${userId}`],
    {
      revalidate: 5,
      tags: [`unread-notifications-${userId}`],
    }
  )();
};