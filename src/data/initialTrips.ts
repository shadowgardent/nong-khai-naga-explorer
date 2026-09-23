import type { TripItem } from '../types/trip';

/**
 * สร้างข้อมูลทริปตัวอย่างใหม่ทุกครั้งที่เรียกใช้
 * เพื่อให้เวลาเริ่มต้นเป็นปัจจุบันเสมอ ไม่เป็น Stale Data
 */
export function createInitialTrips(): TripItem[] {
  return [
    {
      id: 'trip-wat-pho-chai',
      poiId: 'wat-pho-chai',
      poiName: 'วัดโพธิ์ชัย (หลวงพ่อพระใส)',
      district: 'อ.เมืองหนองคาย',
      icon: '🛕',
      scheduledTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      minutesDelay: 5,
      note: 'นมัสการหลวงพ่อพระใส ขอพรเพื่อความเป็นสิริมงคล',
      status: 'scheduled',
      photos: [],
      latitude: 17.8837,
      longitude: 102.7562,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'trip-twin-naga',
      poiId: 'twin-naga-yard',
      poiName: 'ลานวัฒนธรรมพญานาคคู่',
      district: 'อ.เมืองหนองคาย',
      icon: '🐉',
      scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      minutesDelay: 30,
      note: 'ชมวิวพระอาทิตย์ตกริมฝั่งโขง และถ่ายรูปเช็คอินองค์พญานาค',
      status: 'scheduled',
      photos: [],
      latitude: 17.8858,
      longitude: 102.7441,
      createdAt: new Date().toISOString(),
    },
  ];
}
