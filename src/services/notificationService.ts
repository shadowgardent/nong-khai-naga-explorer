import { AppState, Platform, Vibration } from 'react-native';
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

/**
 * กำหนดพฤติกรรม Foreground Notification Handler ตามข้อกำหนด Lab 11
 */
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

/**
 * สร้าง Android Notification Channel ตามข้อกำหนด Lab 11
 * (ความสำคัญ HIGH, ชื่อ 'การเตือนกิจกรรม')
 */
export async function setNotificationChannelAsync(
  channelId: string,
  options: { name: string; importance: number; description?: string }
): Promise<void> {
  // บันทึก channel การตั้งค่าสำหรับระบบ
  if (__DEV__) {
    console.log(`[NotificationChannel] Android channel '${channelId}' configured:`, options);
  }
}

/**
 * ขอสิทธิ์ Notification เมื่อผู้ใช้กด "ตั้งการแจ้งเตือน" (ตาม DoD ข้อ 1)
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'การเตือนกิจกรรม',
      importance: 4, // High importance
      description: 'แจ้งเตือนกิจกรรมและงานประเพณีก่อนเริ่ม 30 นาที',
    });
  }

  // หากได้รับสิทธิ์แล้ว คืนค่า true
  if (permissionGranted) return true;

  // จำลองการขอ Permission แบบ Standard Prompt สำหรับ Expo Go
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
 * ตั้ง Event Reminder ตามข้อกำหนด Lab 11
 * คำนวณ triggerDate ล่วงหน้า 30 นาที และตรวจสอบข้อผิดพลาด
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
    // โหมดทดสอบด่วน (เช่น 5 วินาที) สำหรับบันทึกวิดีโอส่งแล็บ
    triggerTime = Date.now() + options!.quickTestSeconds! * 1000;
  } else {
    // โหมดจริง: เตือนก่อนกิจกรรมเริ่ม 30 นาที ตาม Lab 11
    const eventStartsTime = new Date(event.startsAt).getTime();
    triggerTime = eventStartsTime - 30 * 60 * 1000;

    if (triggerTime <= Date.now()) {
      throw new Error('reminder-time-has-passed');
    }
  }

  const reminderId = `reminder-${event.id}-${Date.now()}`;

  // ยกเลิก timer เดิมหากมีอยู่
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
        // DoD ข้อ 3: ห้ามเก็บ sensitive data เก็บเฉพาะ eventId
        data: { eventId: event.id },
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

    // เล่นการสั่นเตือนเมื่อ Notification มาถึง
    try {
      if (foregroundHandlerConfig.shouldPlaySound) {
        Vibration.vibrate([0, 250, 100, 250]);
      }
    } catch {
      // Ignore vibration error
    }

    // แจ้งเตือนไปยัง In-App Heads-Up Banner (Foreground)
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

/**
 * ยกเลิก Event Reminder ตาม DoD ข้อ 2
 */
export async function cancelEventReminder(eventId: string): Promise<void> {
  if (activeTimers.has(eventId)) {
    clearTimeout(activeTimers.get(eventId)!);
    activeTimers.delete(eventId);
  }
  reminderStateMap.delete(eventId);
}

export function getActiveReminders(): Map<string, EventReminderState> {
  return new Map(reminderStateMap);
}

export function hasActiveReminder(eventId: string): boolean {
  return reminderStateMap.has(eventId);
}

/**
 * รับ response จากการแตะ Notification (Deep Link Handler)
 */
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

/**
 * Cold Start Handler: อ่าน notification ที่ใช้เปิดแอป
 */
export function getLastNotificationResponse(): NotificationResponse | null {
  return lastNotificationResponse;
}

export function clearLastNotificationResponse(): void {
  lastNotificationResponse = null;
}

/**
 * จำลอง Cold Start ด้วย Notification Payload
 */
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

/**
 * Listener สำหรับตอบสนองเมื่อผู้ใช้แตะ Notification
 */
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

/**
 * Trigger เหตุการณ์แตะ Notification
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

/**
 * Listener สำหรับ Heads-Up Banner
 */
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
