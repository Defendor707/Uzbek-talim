import { storage } from "../storage";

export interface BotNotification {
  userId: number;
  message: string;
  type: 'test_created' | 'lesson_updated' | 'profile_updated' | 'schedule_changed';
  data?: any;
}

class BotNotificationService {
  private notifications: Map<number, BotNotification[]> = new Map();

  // Add notification for a user
  addNotification(notification: BotNotification) {
    const userNotifications = this.notifications.get(notification.userId) || [];
    userNotifications.push(notification);
    this.notifications.set(notification.userId, userNotifications);
  }

  // Get pending notifications for a user
  getNotifications(userId: number): BotNotification[] {
    return this.notifications.get(userId) || [];
  }

  // Clear notifications for a user
  clearNotifications(userId: number) {
    this.notifications.delete(userId);
  }

  // Notify user about new test
  async notifyTestCreated(testData: any) {
    // Get all students who should be notified
    const students = await storage.getUsersByRole('student');
    
    students.forEach(student => {
      this.addNotification({
        userId: student.id,
        message: `📝 Yangi test yaratildi: ${testData.title}`,
        type: 'test_created',
        data: testData
      });
    });
  }

  // Notify about lesson updates
  async notifyLessonUpdated(lessonData: any) {
    const students = await storage.getUsersByRole('student');
    
    students.forEach(student => {
      this.addNotification({
        userId: student.id,
        message: `📚 Dars yangilandi: ${lessonData.title}`,
        type: 'lesson_updated',
        data: lessonData
      });
    });
  }

  // Notify about profile updates
  notifyProfileUpdated(userId: number, profileType: string) {
    this.addNotification({
      userId,
      message: `👤 Profilingiz yangilandi`,
      type: 'profile_updated'
    });
  }

  // Notify about schedule changes
  async notifyScheduleChanged(scheduleData: any) {
    const students = await storage.getUsersByRole('student');
    
    students.forEach(student => {
      this.addNotification({
        userId: student.id,
        message: `📅 Dars jadvali o'zgartirildi`,
        type: 'schedule_changed',
        data: scheduleData
      });
    });
  }
}

export const botNotificationService = new BotNotificationService();