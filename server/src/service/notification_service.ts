import {
  insertNotification,
  findNotificationsByUser,
  markNotificationRead,
  markAllNotificationsRead
} from '../repository/notification_repository.ts';

// 다른 서비스에서 알림을 만들 때 사용하는 헬퍼
export const createNotification = (userId: string, type: string, message: string, link: string) =>
  insertNotification({ userId, type, message, link });

export const listNotifications = (userId: string) => findNotificationsByUser(userId);

export const readNotification = (id: string, userId: string) => markNotificationRead(id, userId);

export const readAllNotifications = (userId: string) => markAllNotificationsRead(userId);
