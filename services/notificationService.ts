
import { NotificationPreferences, User } from '../types.ts';

export class NotificationService {
  private static STORAGE_KEY = 'cafft_notification_token';

  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  static getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  static async sendNotification(title: string, body: string, icon = '/favicon.ico') {
    const permission = this.getPermissionStatus();
    
    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.showNotification(title, {
            body,
            icon,
            badge: icon,
          });
        } else {
          new Notification(title, { body, icon });
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  }

  static getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: false,
      reminders: true,
      newTasks: true,
      followUp: true,
      general: true,
      frequency: 'daily',
      startTime: '09:00',
      endTime: '21:00',
    };
  }

  static canSendNotification(user: User, type: keyof Omit<NotificationPreferences, 'enabled' | 'frequency' | 'startTime' | 'endTime' | 'consentDate'>): boolean {
    const prefs = user.notificationPreferences;
    if (!prefs || !prefs.enabled) return false;

    // Check device permission
    if (this.getPermissionStatus() !== 'granted') return false;

    // Check if the specific type is enabled
    if (!prefs[type]) return false;

    // Check time range
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime < prefs.startTime || currentTime > prefs.endTime) {
        return false;
    }

    return true;
  }
}
