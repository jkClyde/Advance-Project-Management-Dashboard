import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getNotificationsByUserId = unstable_cache(
  async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        message: true,
        read: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["notifications-by-user"],
  { revalidate: 10 }
);

export const getUnreadNotificationCount = unstable_cache(
  async (userId: string) => {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },
  ["unread-notification-count"],
  { revalidate: 10 }
);