import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NongKhaiEvent, EventReminderState, NotificationPayloadData } from '../types/event';

export const REMINDER_CHANNEL = 'event-reminders';

// ============================================================
// Notification types (re-export จาก expo-notifications)
// ============================================================

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

export const DEFAULT_ACTION_IDENTIFIER = Notifications.DEFAULT_ACTION_IDENTIFIER;

// ============================================================
// Internal state
// ============================================================

type ResponseListener = (response: NotificationResponse) => void;
type BannerListener = (notification: Notification) => void;

let permissionGranted = false;
let lastNotificationResponse: NotificationResponse | null = null;
const responseListeners = new Set<ResponseListener>();
const bannerListeners = new Set<BannerListener>();
const scheduledIds = new Map<string, string>(); // eventId -> notification identifier
const reminderStateMap = new Map<string, EventReminderState>();

// ============================================================
// ตั้งค่า Foreground Handler — ให้แสดง notification ขณะแอปเปิดอยู่
// ============================================================

export function setNotificationHandler(config: {
  handleNotification: () => Promise<{
    shouldShowBanner: boolean;
    shouldShowList: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
  }>;
}) {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const res = await config.handleNotification();
      return {
        shouldShowAlert: true,   // แสดง popup notification ขณะ foreground
        shouldPlaySound: res.shouldPlaySound,
        shouldSetBadge: res.shouldSetBadge,
        shouldShowBanner: res.shouldShowBanner,
        shouldShowList: res.shouldShowList,
      };
    },
  });
}

// ============================================================
// Android Notification Channel
// ============================================================

export async function setNotificationChannelAsync(
  channelId: string,
  options: { name: string; importance: number; description?: string }
): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: options.name,
      importance: options.importance as Notifications.AndroidImportance,
      description: options.description,
      sound: 'default',
      vibrationPattern: [0, 250, 100, 250],
      enableVibrate: true,
    });
  }
}

// ============================================================
// Permission (Local Notifications — ไม่ใช้ Push Token)
// ============================================================

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'การเตือนกิจกรรมและทริป',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'แจ้งเตือนกิจกรรมและงานประเพณีก่อนเริ่ม 30 นาที',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  permissionGranted = finalStatus === 'granted';
  return permissionGranted;
}

export function getNotificationPermissionStatus(): boolean {
  return permissionGranted;
}

export function revokeNotificationPermission(): void {
  permissionGranted = false;
}

// ============================================================
// Schedule Event Reminder — ใช้ expo-notifications จริง
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

  // ยกเลิก notification เก่าของ event นี้ถ้ามี
  if (scheduledIds.has(event.id)) {
    try {
      await Notifications.cancelScheduledNotificationAsync(scheduledIds.get(event.id)!);
    } catch {
      // Ignore
    }
    scheduledIds.delete(event.id);
  }

  // ตั้ง notification ผ่าน expo-notifications — ทำงานได้ทั้ง foreground และ background
  const identifier = await Notifications.scheduleNotificationAsync({
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
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
  });

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
      await Notifications.cancelScheduledNotificationAsync(scheduledIds.get(eventId)!);
    } catch {
      // Ignore
    }
    scheduledIds.delete(eventId);
  }
  reminderStateMap.delete(eventId);
}

// ============================================================
// Schedule Trip Reminder — ใช้ expo-notifications จริง
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

  // ยกเลิก notification เก่าของ trip นี้ถ้ามี
  if (scheduledIds.has(tripId)) {
    try {
      await Notifications.cancelScheduledNotificationAsync(scheduledIds.get(tripId)!);
    } catch {
      // Ignore
    }
    scheduledIds.delete(tripId);
  }

  const triggerSeconds = Math.max(1, Math.round((triggerTime - Date.now()) / 1000));

  const identifier = await Notifications.scheduleNotificationAsync({
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
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
    },
  });

  scheduledIds.set(tripId, identifier);

  reminderStateMap.set(tripId, {
    eventId: tripId,
    reminderId: identifier,
    scheduledTriggerTime: triggerTime,
    channelId: REMINDER_CHANNEL,
  });

  // เรียก callback เมื่อถึงเวลา (สำหรับอัพเดท UI ใน foreground)
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
      await Notifications.cancelScheduledNotificationAsync(scheduledIds.get(tripId)!);
    } catch {
      // Ignore
    }
    scheduledIds.delete(tripId);
  }
  reminderStateMap.delete(tripId);
}

// ============================================================
// Query state
// ============================================================

export function getActiveReminders(): Map<string, EventReminderState> {
  return new Map(reminderStateMap);
}

export function hasActiveReminder(eventId: string): boolean {
  return reminderStateMap.has(eventId);
}

// ============================================================
// Response/Deep Link handling
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
// Listeners — ใช้ expo-notifications listeners จริง
// ============================================================

/**
 * ฟัง notification response (เมื่อผู้ใช้แตะที่ notification)
 * ใช้ expo-notifications addNotificationResponseReceivedListener จริง
 */
export function addNotificationResponseReceivedListener(
  listener: ResponseListener
): { remove: () => void } {
  // ใช้ listener ของ expo-notifications จริง
  const sub = Notifications.addNotificationResponseReceivedListener((nativeResponse) => {
    // แปลงจาก native response เป็น custom type
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

  // รองรับ listener จาก custom system ด้วย (สำหรับ cold start simulation)
  responseListeners.add(listener);

  return {
    remove: () => {
      sub.remove();
      responseListeners.delete(listener);
    },
  };
}

/**
 * ฟัง notification เมื่อแอปอยู่ foreground (สำหรับ in-app banner)
 */
export function addNotificationBannerListener(
  listener: BannerListener
): { remove: () => void } {
  // ใช้ expo-notifications listener สำหรับ foreground notifications
  const sub = Notifications.addNotificationReceivedListener((nativeNotif) => {
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

    // สั่นเตือน
    try {
      Vibration.vibrate([0, 250, 100, 250]);
    } catch {
      // Ignore
    }

    listener(notification);
  });

  bannerListeners.add(listener);

  return {
    remove: () => {
      sub.remove();
      bannerListeners.delete(listener);
    },
  };
}

/**
 * เมื่อผู้ใช้แตะ Banner ใน foreground — ส่ง response event
 */
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
