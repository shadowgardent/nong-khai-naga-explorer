export type TripItem = {
  id: string;
  poiId: string;            // รหัสสถานที่ใน pointsOfInterest
  poiName: string;          // ชื่อสถานที่
  district: string;         // อำเภอ
  icon: string;             // ไอคอนสถานที่
  scheduledTime: string;    // ISO 8601 Date String เวลาเดินทางไปถึง
  minutesDelay: number;     // จำนวนนาทีนับจากตอนสร้างทริป (เช่น 1, 5, 15, 30, 60)
  note: string;             // บันทึกกิจกรรมที่อยากทำ (เช่น ถ่ายรูปกับหลวงพ่อพระใส, เดินชิมอาหารริมโขง)
  reminderId?: string;       // ID ของการตั้งเตือนใน Notification Service
  status: 'scheduled' | 'arrived' | 'completed' | 'canceled';
  photos: TripPhoto[];      // รูปภาพถ่ายเช็คอิน ณ จุดนี้
  latitude: number;
  longitude: number;
  createdAt: string;
};

export type TripPhoto = {
  id: string;
  uri: string;
  createdAt: string;
  caption?: string;
};
