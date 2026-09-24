import { Platform, Vibration } from 'react-native';
// เราเจาะจง import เฉพาะฟังก์ชัน Local Notifications แยกตามไฟล์
// เพื่อ "BYPASS" การ import 'expo-notifications' ตัวเต็ม (ซึ่งจะไป trigger Push Token Auto Registration ที่พังบน Expo Go Android)
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { setNotificationHandler as nativeSetNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import {
  addNotificationResponseReceivedListener as nativeAddResponseListener,
  addNotificationReceivedListener as nativeAddReceivedListener,
  DEFAULT_ACTION_IDENTIFIER as NATIVE_DEFAULT_ACTION_IDENTIFIER,
} from 'expo-notifications/build/NotificationsEmitter';
import { setNotificationChannelAsync as nativeSetChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';

import type { NongKhaiEvent, EventReminderState, NotificationPayloadData } from '../types/event';

export const REMINDER_CHANNEL = 'event-reminders';

export type NotificationContent = {
  title: string;
  body: string;
  data: NotificationPayloadData;
};

export type NotificationRequest = {
  identifier: string;
  content: NotificationContent;
  trigger: {
    type: string;
    date?: Date;
    channelId: string;
  };
};

export type Notification = {
  request: NotificationRequest;
  date: number;
};

export type NotificationResponse = {
  actionIdentifier: string;
  notification: Notification;
};

export const DEFAULT_ACTION_IDENTIFIER = NATIVE_DEFAULT_ACTION_IDENTIFIER;

type ResponseListener = (response: NotificationResponse) => void;
type BannerListener = (notification: Notification) => void;

let permissionGranted = false;
let lastNotificationResponse: NotificationResponse | null = null;
const responseListeners = new Set<ResponseListener>();
const bannerListeners = new Set<BannerListener>();
const scheduledIds = new Map<string, string>();
const reminderStateMap = new Map<string, EventReminderState>();

// ============================================================
// ตั้งค่า Foreground Behavior
// ============================================================
export function setNotificationHandler(config: {
  handleNotification: () => Promise<{
    shouldShowBanner: boolean;
    shouldShowList: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
  }>;
}) {
  try {
    nativeSetNotificationHandler({
      handleNotification: async () => {
        const res = await config.handleNotification();
        return {
          shouldShowAlert: true,
          shouldPlaySound: res.shouldPlaySound,
          shouldSetBadge: res.shouldSetBadge,
          shouldShowBanner: res.shouldShowBanner,
          shouldShowList: res.shouldShowList,
        };
      },
    });
  } catch (err) {
    console.warn('[NotificationService] setNotificationHandler error:', err);
  }
}

// ============================================================
// Android Channel Setup
// ============================================================
export async function setNotificationChannelAsync(
  channelId: string,
  options: { name: string; importance: number; description?: string }
): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await nativeSetChannelAsync(channelId, {
        name: options.name,
        importance: options.importance as AndroidImportance,
        description: options.description,
        sound: 'default',
        vibrationPattern: [0, 250, 100, 250],
        enableVibrate: true,
      });
    } catch (e) {
      console.warn('[NotificationService] Error setting channel:', e);
    }
  }
}

// ============================================================
// Notification Permissions
// ============================================================
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'การเตือนกิจกรรมและทริป',
      importance: AndroidImportance.HIGH,
      description: 'แจ้งเตือนกิจกรรมและงานประเพณีก่อนเริ่ม 30 นาที',
    });
  }

  try {
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }

    permissionGranted = finalStatus === 'granted';
  } catch (e) {
    console.warn('[NotificationService] Permission request fallback:', e);
    permissionGranted = true;
  }

  return permissionGranted;
}

export function getNotificationPermissionStatus(): boolean {
  return permissionGranted;
}

export function revokeNotificationPermission(): void {
  permissionGranted = false;
}

// ============================================================
// Schedule Event Reminder (Native Local Notification)
// ============================================================
export async function scheduleEventReminder(
  event: NongKhaiEvent,
  options?: { quickTestSeconds?: number }
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  const isQuickTest = typeof options?.quickTestSeconds === 'number' && options.quickTestSeconds > 0;
  let triggerSeconds: number;

  if (isQuickTest) {
    triggerSeconds = options!.quickTestSeconds!;
  } else {
    const eventStartsTime = new Date(event.startsAt).getTime();
    const triggerTime = eventStartsTime - 30 * 60 * 1000;

    if (triggerTime <= Date.now()) {
      throw new Error('reminder-time-has-passed');
    }

    triggerSeconds = Math.max(1, Math.round((triggerTime - Date.now()) / 1000));
  }

  if (scheduledIds.has(event.id)) {
    try {
      await cancelScheduledNotificationAsync(scheduledIds.get(event.id)!);
    } catch {
      // ignore
    }
    scheduledIds.delete(event.id);
  }

  let identifier = `reminder-${event.id}-${Date.now()}`;
  try {
    identifier = await scheduleNotificationAsync({
      content: {
        title: `🔔 ใกล้ถึงเวลา: ${event.title}`,
        body: isQuickTest
          ? `(ทดสอบ) เริ่มในอีก 30 นาทีที่ ${event.location.name}`
          : `เริ่มในอีก 30 นาทีที่ ${event.location.name}`,
        data: { eventId: event.id, type: 'event' } as NotificationPayloadData,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: REMINDER_CHANNEL }),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });
  } catch (scheduleError) {
    console.warn('[NotificationService] Native schedule fallback to timer:', scheduleError);
    // Fallback: หากบนเครื่องใดยังบล็อก native scheduler ให้รัน in-app timer เผื่อไว้
    setTimeout(() => {
      try {
        Vibration.vibrate([0, 250, 100, 250]);
      } catch {}
      const fallbackNotif: Notification = {
        request: {
          identifier,
          content: {
            title: `🔔 ใกล้ถึงเวลา: ${event.title}`,
            body: `เริ่มในอีก 30 นาทีที่ ${event.location.name}`,
            data: { eventId: event.id, type: 'event' },
          },
          trigger: { type: 'timer', channelId: REMINDER_CHANNEL },
        },
        date: Date.now(),
      };
      bannerListeners.forEach((l) => l(fallbackNotif));
    }, triggerSeconds * 1000);
  }

  scheduledIds.set(event.id, identifier);

  const triggerTime = Date.now() + triggerSeconds * 1000;
  reminderStateMap.set(event.id, {
    eventId: event.id,
    reminderId: identifier,
    scheduledTriggerTime: triggerTime,
    channelId: REMINDER_CHANNEL,
    isQuickTest,
  });

  return identifier;
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  if (scheduledIds.has(eventId)) {
    try {
      await cancelScheduledNotificationAsync(scheduledIds.get(eventId)!);
    } catch {
      // ignore
    }
    scheduledIds.delete(eventId);
  }
  reminderStateMap.delete(eventId);
}

// ============================================================
// Schedule Trip Reminder
// ============================================================
export async function scheduleTripReminder(
  tripId: string,
  poiName: string,
  triggerTime: number,
  note: string,
  onTriggered?: () => void
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  if (scheduledIds.has(tripId)) {
    try {
      await cancelScheduledNotificationAsync(scheduledIds.get(tripId)!);
    } catch {
      // ignore
    }
    scheduledIds.delete(tripId);
  }

  const triggerSeconds = Math.max(1, Math.round((triggerTime - Date.now()) / 1000));
  let identifier = `trip-${tripId}-${Date.now()}`;

  try {
    identifier = await scheduleNotificationAsync({
      content: {
        title: `⏰ ถึงเวลาตามทริป: ${poiName}`,
        body: note
          ? `ได้เวลาออกเดินทางไปจุดหมาย "${poiName}" แล้ว! (${note})`
          : `ได้เวลาออกเดินทางไปจุดหมาย "${poiName}" แล้ว! อย่าลืมถ่ายรูปเช็คอินด้วยนะ 📸`,
        data: { tripId, poiId: tripId, type: 'trip' } as NotificationPayloadData,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: REMINDER_CHANNEL }),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });
  } catch (err) {
    console.warn('[NotificationService] Native schedule trip error:', err);
  }

  scheduledIds.set(tripId, identifier);

  reminderStateMap.set(tripId, {
    eventId: tripId,
    reminderId: identifier,
    scheduledTriggerTime: triggerTime,
    channelId: REMINDER_CHANNEL,
  });

  if (onTriggered) {
    setTimeout(() => {
      onTriggered();
    }, triggerSeconds * 1000);
  }

  return identifier;
}

export async function cancelTripReminder(tripId: string): Promise<void> {
  if (scheduledIds.has(tripId)) {
    try {
      await cancelScheduledNotificationAsync(scheduledIds.get(tripId)!);
    } catch {
      // ignore
    }
    scheduledIds.delete(tripId);
  }
  reminderStateMap.delete(tripId);
}

export function getActiveReminders(): Map<string, EventReminderState> {
  return new Map(reminderStateMap);
}

export function hasActiveReminder(eventId: string): boolean {
  return reminderStateMap.has(eventId);
}

// ============================================================
// Response Handlers & Deep Linking
// ============================================================
export function openEventFromResponse(
  response: NotificationResponse | null
): string | null {
  if (
    response &&
    response.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER
  ) {
    return null;
  }

  const eventId = response?.notification.request.content.data.eventId;
  if (typeof eventId !== 'string') return null;

  return eventId;
}

export function getLastNotificationResponse(): NotificationResponse | null {
  return lastNotificationResponse;
}

export function clearLastNotificationResponse(): void {
  lastNotificationResponse = null;
}

export function simulateColdStartNotification(eventId: string, eventTitle: string): void {
  lastNotificationResponse = {
    actionIdentifier: DEFAULT_ACTION_IDENTIFIER,
    notification: {
      request: {
        identifier: `cold-start-${Date.now()}`,
        content: {
          title: `ใกล้ถึงเวลา: ${eventTitle}`,
          body: 'เปิดแอปจาก Notification ขณะ Cold Start',
          data: { eventId },
        },
        trigger: {
          type: 'cold-start',
          channelId: REMINDER_CHANNEL,
        },
      },
      date: Date.now(),
    },
  };
}

// ============================================================
// Listeners (Response & Received)
// ============================================================
export function addNotificationResponseReceivedListener(
  listener: ResponseListener
): { remove: () => void } {
  let nativeSub: { remove: () => void } | null = null;
  try {
    nativeSub = nativeAddResponseListener((nativeResponse) => {
      const response: NotificationResponse = {
        actionIdentifier: nativeResponse.actionIdentifier,
        notification: {
          request: {
            identifier: nativeResponse.notification.request.identifier,
            content: {
              title: nativeResponse.notification.request.content.title ?? '',
              body: nativeResponse.notification.request.content.body ?? '',
              data: (nativeResponse.notification.request.content.data ?? {}) as NotificationPayloadData,
            },
            trigger: {
              type: 'native',
              channelId: REMINDER_CHANNEL,
            },
          },
          date: nativeResponse.notification.date,
        },
      };

      lastNotificationResponse = response;
      listener(response);
    });
  } catch (err) {
    console.warn('[NotificationService] Response listener unavailable:', err);
  }

  responseListeners.add(listener);

  return {
    remove: () => {
      nativeSub?.remove();
      responseListeners.delete(listener);
    },
  };
}

export function addNotificationBannerListener(
  listener: BannerListener
): { remove: () => void } {
  let nativeSub: { remove: () => void } | null = null;
  try {
    nativeSub = nativeAddReceivedListener((nativeNotif) => {
      const notification: Notification = {
        request: {
          identifier: nativeNotif.request.identifier,
          content: {
            title: nativeNotif.request.content.title ?? '',
            body: nativeNotif.request.content.body ?? '',
            data: (nativeNotif.request.content.data ?? {}) as NotificationPayloadData,
          },
          trigger: {
            type: 'native',
            channelId: REMINDER_CHANNEL,
          },
        },
        date: nativeNotif.date,
      };

      try {
        Vibration.vibrate([0, 250, 100, 250]);
      } catch {
        // ignore
      }

      listener(notification);
    });
  } catch (err) {
    console.warn('[NotificationService] Received listener unavailable:', err);
  }

  bannerListeners.add(listener);

  return {
    remove: () => {
      nativeSub?.remove();
      bannerListeners.delete(listener);
    },
  };
}

export function emitNotificationResponse(notification: Notification): void {
  const response: NotificationResponse = {
    actionIdentifier: DEFAULT_ACTION_IDENTIFIER,
    notification,
  };
  lastNotificationResponse = response;
  responseListeners.forEach((listener) => {
    try {
      listener(response);
    } catch (e) {
      console.error('[NotificationService] Response listener error:', e);
    }
  });
}
