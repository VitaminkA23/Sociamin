import { prisma } from "../../config/prisma.js";
import type { NotificationItem, CreateNotificationInput } from "./notifications.types.js";

const notifSelect = {
  id: true,
  type: true,
  message: true,
  isRead: true,
  senderId: true,
  senderName: true,
  entityId: true,
  createdAt: true,
} as const;

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await prisma.notification.create({ data: input });
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: notifSelect,
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function clearAllNotifications(userId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { userId } });
}
