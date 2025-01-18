// src/types/notification.ts
export enum NotificationChannel {
  EMAIL = "email",
  SLACK = "slack",
  TELEGRAM = "telegram",
}

export type SendNotificationParams = {
  channel: NotificationChannel;
  content: string;
  recipients: string[];
  metadata?: Record<string, any>;
};

export type Notification = {
  id: string;
  channel: NotificationChannel;
  content: string;
  recipients: string[];
  status: "pending" | "sent" | "failed";
  createdAt: Date;
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
};
