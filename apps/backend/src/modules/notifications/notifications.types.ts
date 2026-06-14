export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  senderId: string;
  senderName: string;
  entityId: string;
  createdAt: Date;
}

export interface CreateNotificationInput {
  type: string;
  message: string;
  userId: string;
  senderId: string;
  senderName: string;
  entityId: string;
}
