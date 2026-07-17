import prisma from '../lib/prisma.ts';

export const insertNotification = (data: { userId: string; type: string; message: string; link: string }) =>
  prisma.notification.create({ data });

export const findNotificationsByUser = (userId: string) =>
  prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });

export const markNotificationRead = (id: string, userId: string) =>
  prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });

export const markAllNotificationsRead = (userId: string) =>
  prisma.notification.updateMany({ where: { userId }, data: { read: true } });
