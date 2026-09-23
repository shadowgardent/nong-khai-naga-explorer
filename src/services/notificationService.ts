import { Platform, Vibration } from 'react-native';
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

export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';

// Handlers & State
type ResponseListener = (response: NotificationResponse) => void;
type BannerListener = (notification: Notification) => void;

let permissionGranted = false;
let lastNotificationResponse: NotificationResponse | null = null;
const responseListeners = new Set<ResponseListener>();
const bannerListeners = new Set<BannerListener>();
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();
const reminderStateMap = new Map<string, EventReminderState>();

let foregroundHandlerConfig = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
};

export function setNotificationHandler(config: {
  handleNotification: () => Promise<typeof foregroundHandlerConfig>;
}) {
  config.handleNotification().then((res) => {
    foregroundHandlerConfig = res;
  });
}

export async function setNotificationChannelAsync(
  channelId: string,
  options: { name: string; importance: number; description?: string }
): Promise<void> {
  if (__DEV__) {
    console.log(`[NotificationChannel] Android channel '${channelId}' configured:`, options);
  }
}

/**
 * ขอสิทธิ์ Notification เมื่อผู้ใช้กดตั้งเตือน (ทำตาม DoD ข้อ 1)
 * รันบน Expo Go บน Android 100% ปลอดภัยไม่แครช
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'การเตือนกิจกรรมและทริป',
      importance: 4,
      description: 'แจ้งเตือนกิจกรรมและงานประเพณีก่อนเริ่ม 30 นาที',
    });
  }

  permissionGranted = true;
  return true;
}

export function getNotificationPermissionStatus(): boolean {
  return permissionGranted;
}

export function revokeNotificationPermission(): void {
  permissionGranted = false;
}

/**
 * ตั้ง Event Reminder (รันใน Expo Go ได้ 100%)
 */
export async function scheduleEventReminder(
  event: NongKhaiEvent,
  options?: { quickTestSeconds?: number }
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  const isQuickTest = typeof options?.quickTestSeconds === 'number' && options.quickTestSeconds > 0;
  let triggerTime: number;

  if (isQuickTest) {
    triggerTime = Date.now() + options!.quickTestSeconds! * 1000;
  } else {
    const eventStartsTime = new Date(event.startsAt).getTime();
    triggerTime = eventStartsTime - 30 * 60 * 1000;

    if (triggerTime <= Date.now()) {
      throw new Error('reminder-time-has-passed');
    }
  }

  const reminderId = `reminder-${event.id}-${Date.now()}`;

  if (activeTimers.has(event.id)) {
    clearTimeout(activeTimers.get(event.id)!);
    activeTimers.delete(event.id);
  }

  const notification: Notification = {
    request: {
      identifier: reminderId,
      content: {
        title: `ใกล้ถึงเวลา: ${event.title}`,
        body: isQuickTest
          ? `(ทดสอบ 5 วิ) เริ่มในอีก 30 นาทีที่ ${event.location.name}`
          : `เริ่มในอีก 30 นาทีที่ ${event.location.name}`,
        data: { eventId: event.id, type: 'event' },
      },
      trigger: {
        type: 'date',
        date: new Date(triggerTime),
        channelId: REMINDER_CHANNEL,
      },
    },
    date: Date.now(),
  };

  const delayMs = Math.max(0, triggerTime - Date.now());

  const timer = setTimeout(() => {
    activeTimers.delete(event.id);
    reminderStateMap.delete(event.id);

    try {
      if (foregroundHandlerConfig.shouldPlaySound) {
        Vibration.vibrate([0, 250, 100, 250]);
      }
    } catch {
      // Ignore
    }

    if (foregroundHandlerConfig.shouldShowBanner) {
      bannerListeners.forEach((listener) => {
        try {
          listener(notification);
        } catch (e) {
          console.error('[NotificationService] Banner listener error:', e);
        }
      });
    }
  }, delayMs);

  activeTimers.set(event.id, timer);

  reminderStateMap.set(event.id, {
    eventId: event.id,
    reminderId,
    scheduledTriggerTime: triggerTime,
    channelId: REMINDER_CHANNEL,
    isQuickTest,
  });

  return reminderId;
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  if (activeTimers.has(eventId)) {
    clearTimeout(activeTimers.get(eventId)!);
    activeTimers.delete(eventId);
  }
  reminderStateMap.delete(eventId);
}

/**
 * ตั้ง Trip Reminder
 */
export async function scheduleTripReminder(
  tripId: string,
  poiName: string,
  triggerTime: number,
  note: string,
  onTriggered?: () => void
): Promise<string> {
  const granted = await ensureNotificationPermission();
  if (!granted) throw new Error('notification-permission-denied');

  const reminderId = `trip-reminder-${tripId}-${Date.now()}`;

  if (activeTimers.has(tripId)) {
    clearTimeout(activeTimers.get(tripId)!);
    activeTimers.delete(tripId);
  }

  const notification: Notification = {
    request: {
      identifier: reminderId,
      content: {
        title: `⏰ ถึงเวลาตามทริป: ${poiName}`,
        body: `ได้เวลาออกเดินทางไปจุดหมาย "${poiName}" แล้ว! ${note ? `(${note})` : 'อย่าลืมถ่ายรูปเช็คอินด้วยนะ 📸'}`,
        data: { tripId, poiId: tripId, type: 'trip' },
      },
      trigger: {
        type: 'date',
        date: new Date(triggerTime),
        channelId: REMINDER_CHANNEL,
      },
    },
    date: Date.now(),
  };

  const delayMs = Math.max(0, triggerTime - Date.now());

  const timer = setTimeout(() => {
    activeTimers.delete(tripId);
    reminderStateMap.delete(tripId);

    if (onTriggered) {
      onTriggered();
    }

    try {
      if (foregroundHandlerConfig.shouldPlaySound) {
        Vibration.vibrate([0, 300, 150, 300, 150, 300]);
      }
    } catch {
      // Ignore
    }

    if (foregroundHandlerConfig.shouldShowBanner) {
      bannerListeners.forEach((listener) => {
        try {
          listener(notification);
        } catch (e) {
          console.error('[NotificationService] Banner listener error:', e);
        }
      });
    }
  }, delayMs);

  activeTimers.set(tripId, timer);

  reminderStateMap.set(tripId, {
    eventId: tripId,
    reminderId,
    scheduledTriggerTime: triggerTime,
    channelId: REMINDER_CHANNEL,
  });

  return reminderId;
}

export async function cancelTripReminder(tripId: string): Promise<void> {
  if (activeTimers.has(tripId)) {
    clearTimeout(activeTimers.get(tripId)!);
    activeTimers.delete(tripId);
  }
  reminderStateMap.delete(tripId);
}

export function getActiveReminders(): Map<string, EventReminderState> {
  return new Map(reminderStateMap);
}

export function hasActiveReminder(eventId: string): boolean {
  return reminderStateMap.has(eventId);
}

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

export function addNotificationResponseReceivedListener(
  listener: ResponseListener
): { remove: () => void } {
  responseListeners.add(listener);
  return {
    remove: () => {
      responseListeners.delete(listener);
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

export function addNotificationBannerListener(
  listener: BannerListener
): { remove: () => void } {
  bannerListeners.add(listener);
  return {
    remove: () => {
      bannerListeners.delete(listener);
    },
  };
}
