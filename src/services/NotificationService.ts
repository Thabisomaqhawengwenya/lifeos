import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'LifeOS Reminders',
        // eslint-disable-next-line import/namespace
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0F4C3A',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  static async scheduleReminder(params: {
    title: string;
    body: string;
    triggerDate: Date;
  }): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          sound: 'default',
          color: '#0F4C3A',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: params.triggerDate,
        },
      });

      return id;
    } catch (err) {
      console.warn('Failed to schedule notification:', err);
      return null;
    }
  }

  static async cancelReminder(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (err) {
      console.warn('Failed to cancel notification:', err);
    }
  }
}
