import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { sendRealTimeNotification } from './websocket';
import { NotFoundError } from '@/core/errors';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: any;
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  return prisma.notification.update({
    where: { id },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

export async function getPreferences(userId: string) {
  let preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await prisma.notificationPreference.create({
      data: {
        userId,
        inApp: true,
        emailDigest: false,
      },
    });
  }

  return preferences;
}

export async function updatePreferences(
  userId: string,
  input: { inApp?: boolean; emailDigest?: boolean }
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: {
      inApp: input.inApp,
      emailDigest: input.emailDigest,
    },
    create: {
      userId,
      inApp: input.inApp ?? true,
      emailDigest: input.emailDigest ?? false,
    },
  });
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      data: input.data ?? null,
    },
  });

  // Fetch user preferences
  const preferences = await getPreferences(input.userId);

  // If inApp notifications are enabled, push via WebSockets
  if (preferences.inApp) {
    try {
      sendRealTimeNotification(input.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (err) {
      // Don't crash request if websocket dispatch fails
      console.error('Failed to send real-time notification', err);
    }
  }

  return notification;
}
