export type NongKhaiEvent = {
  id: string;
  title: string;
  location: {
    name: string;
    address: string;
    poiId?: string; // รหัสเชื่อมโยงกับแลนด์มาร์กใน pointsOfInterest
    latitude: number;
    longitude: number;
  };
  startsAt: string; // ISO 8601 string เช่น "2026-09-17T18:00:00.000Z"
  displayTime: string; // ข้อความแสดงผล เช่น "วันนี้ 18:30 น."
  description: string;
  icon: string;
  category: 'festival' | 'cultural' | 'eco';
  categoryLabel: string;
  highlight: string;
};

export type EventReminderState = {
  eventId: string;
  reminderId: string;
  scheduledTriggerTime: number; // timestamp
  channelId: string;
  isQuickTest?: boolean;
};

export type NotificationPayloadData = {
  eventId?: string;
  tripId?: string;
  poiId?: string;
  type?: 'event' | 'trip';
  // ห้ามเก็บ sensitive data หรือ entire event object ตาม DoD ข้อ 3
};

export type NotificationChannelConfig = {
  id: string;
  name: string;
  importance: 'high' | 'default' | 'low';
  description?: string;
};
