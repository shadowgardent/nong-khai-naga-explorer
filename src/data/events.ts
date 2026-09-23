import type { NongKhaiEvent } from '../types/event';

/**
 * คืนค่าเวลาเริ่มต้นสำหรับ Event เพื่อให้เวลา trigger (ก่อนเริ่ม 30 นาที)
 * เป็นเวลาในอนาคตเสมอสำหรับการทดสอบจริง
 */
export function getRelativeEventDate(minutesFromNow: number): string {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return date.toISOString();
}

export function formatEventTimeDisplay(isoString: string): string {
  const d = new Date(isoString);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `เวลา ${hours}:${minutes} น.`;
}

/**
 * สร้างข้อมูลกิจกรรมใหม่ทุกครั้งที่เรียกใช้
 * เพื่อให้เวลาเริ่มต้นเป็นปัจจุบันเสมอ ไม่เป็น Stale Data
 */
export function createInitialEvents(): NongKhaiEvent[] {
  return [
    {
      id: 'event-naga-fireball',
      title: 'งานประเพณีออกพรรษาและบั้งไฟพญานาคโลก',
      location: {
        name: 'ลานวัฒนธรรมพญานาคคู่ ริมฝั่งโขง',
        address: 'หน้าวัดลำดวน ถนนริมโขง อำเภอเมืองหนองคาย',
        poiId: 'twin-naga-yard',
        latitude: 17.8858,
        longitude: 102.7441,
      },
      startsAt: getRelativeEventDate(45),
      displayTime: 'เริ่มในอีก 45 นาที',
      description:
        'ปรากฏการณ์บั้งไฟพญานาคอันลึกลับเหนือลำน้ำโขง พร้อมพิธีบวงสรวงสักการะองค์พญานาคราชและการไหลเรือไฟตระการตาสองฝั่งไทย-ลาว',
      icon: '🐉',
      category: 'festival',
      categoryLabel: 'เทศกาลประเพณี',
      highlight: 'ชมบั้งไฟพญานาคพวยพุ่งกลางแม่น้ำโขงและขบวนแห่เรือไฟ',
    },
    {
      id: 'event-luang-pho-phra-sai',
      title: 'พิธีสมโภชและสรงน้ำหลวงพ่อพระใส',
      location: {
        name: 'วัดโพธิ์ชัย (พระอารามหลวง)',
        address: 'ถนนโพธิ์ชัย ตำบลในเมือง อำเภอเมืองหนองคาย',
        poiId: 'wat-pho-chai',
        latitude: 17.8837,
        longitude: 102.7562,
      },
      startsAt: getRelativeEventDate(60),
      displayTime: 'เริ่มในอีก 1 ชั่วโมง',
      description:
        'งานบุญใหญ่ประจำปี อัญเชิญหลวงพ่อพระใส พระพุทธรูปคู่บ้านคู่เมืองลงจากพระอุโบสถ เพื่อให้พุทธศาสนิกชนสรงน้ำขอพรเพื่อความเป็นสิริมงคล',
      icon: '🛕',
      category: 'cultural',
      categoryLabel: 'พิธีกรรม & วัฒนธรรม',
      highlight: 'ขบวนแห่อัญเชิญหลวงพ่อพระใสรอบพระอารามหลวง',
    },
    {
      id: 'event-tha-sadet-night',
      title: 'ถนนคนเดินริมโขง & เทศกาลอาหารอินโดจีน',
      location: {
        name: 'ตลาดท่าเสด็จ (ตลาดอินโดจีน)',
        address: 'ถนนริมโขง ตำบลในเมือง อำเภอเมืองหนองคาย',
        poiId: 'tha-sadet-market',
        latitude: 17.8860,
        longitude: 102.7482,
      },
      startsAt: getRelativeEventDate(90),
      displayTime: 'เริ่มในอีก 1.5 ชั่วโมง',
      description:
        'สัมผัสบรรยากาศยามเย็นริมแม่น้ำโขง ชิมอาหารพื้นเมืองอีสาน-เวียดนาม ช้อปปิ้งของฝากหัตถกรรมพื้นบ้าน และฟังดนตรีสดริมฝั่งโขง',
      icon: '🛍️',
      category: 'cultural',
      categoryLabel: 'ไลฟ์สไตล์ริมโขง',
      highlight: 'ลิ้มลองแหนมเนืองต้นตำรับ ข้าวจี่ร้อนๆ และชมวิวสะพานมิตรภาพ',
    },
    {
      id: 'event-skywalk-mist',
      title: 'ชมทะเลหมอกและตะวันขึ้น สกายวอล์กวัดผาตากเสื้อ',
      location: {
        name: 'วัดผาตากเสื้อ (สกายวอล์กกระจกใส)',
        address: 'ตำบลผาตั้ง อำเภอสังคม จังหวัดหนองคาย',
        poiId: 'skywalk-pha-tak-suea',
        latitude: 18.0387,
        longitude: 102.3045,
      },
      startsAt: getRelativeEventDate(120),
      displayTime: 'เริ่มในอีก 2 ชั่วโมง',
      description:
        'กิจกรรมชมทะเลหมอกยามเช้าเหนือแม่น้ำโขงบนสกายวอล์กกระจกใสรูปเกือกม้าแห่งแรกของประเทศไทย มองเห็นผืนป่าและประเทศลาวแบบพาโนรามา',
      icon: '🌄',
      category: 'eco',
      categoryLabel: 'ธรรมชาติ & ชมวิว',
      highlight: 'จุดชมวิวแม่น้ำโขงและสายหมอกที่สวยที่สุดในจังหวัดหนองคาย',
    },
  ];
}
