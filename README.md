# 🌊 Nong Khai Naga Explorer (แอปรวมพิกัดท่องเที่ยวหนองคาย)

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green?style=for-the-badge)](https://expo.dev/)

แอปพลิเคชันแนะนำสถานที่ท่องเที่ยวและแลนด์มาร์กสำคัญใน **จังหวัดหนองคาย (Nong Khai)** ออกแบบภายใต้แนวคิด **"เมืองพญานาคและมนต์เสน่ห์ริมฝั่งโขง"** โดดเด่นด้วยโทนสีเขียวมรกตและสีทองพญานาค พร้อมระบบแผนที่แบบ Interactive ที่ช่วยให้นักท่องเที่ยวและผู้ใช้งานสามารถสำรวจพิกัดและข้อมูลของสถานที่ต่างๆ ได้อย่างสะดวกรวดเร็ว

---

## 📱 จุดเด่นและฟังก์ชันการทำงาน (Key Highlights)

* **🗺️ Interactive Map Navigation**: แผนที่จะเลื่อนตำแหน่ง (Camera Pan/Zoom) ไปยังสถานที่ที่เลือกโดยอัตโนมัติ พร้อมแสดงหมุดและป้ายกำกับ
* **🔍 Fullscreen Map View**: รองรับการเปิดแผนที่มุมมองเต็มหน้าจอ พร้อมปุ่มลัดสำหรับรีเซ็ตมุมกล้องกลับมาที่จุดสนใจ (`◎`)
* **📍 10 Curated Locations**: คัดสรร 10 พิกัดสำคัญครอบคลุมทั้งโบราณสถาน วัฒนธรรม ธรรมชาติ และจุดเช็คอินยอดนิยม
* **⚡ Seamless Performance**: โหลดข้อมูลพิกัดแบบ Offline-first รวดเร็ว ไม่จำเป็นต้องรอการอนุญาตสิทธิ์ Location จากเครื่อง
* **🎨 Unique Naga Theme**: ดีไซน์อินเทอร์เฟซทันสมัยด้วยชุดสี Emerald Green & Naga Gold

---

## 📌 รายการ 10 แลนด์มาร์กแนะนำในจังหวัดหนองคาย

| # | ชื่อสถานที่ | หมวดหมู่ | ไฮไลท์สำคัญ |
|---|---|---|---|
| 01 | **วัดโพธิ์ชัย** | ศาสนาและวัฒนธรรม | หลวงพ่อพระใส พระพุทธรูปคู่บ้านคู่เมือง |
| 02 | **ศาลาแก้วกู่** | ศิลปะและประติมากรรม | อุทยานเทวาลัย ปูนปั้นขนาดมหึมา |
| 03 | **พระธาตุหล้าหนอง** | โบราณสถาน | พระธาตุกลางน้ำและตำนานพญานาคริมโขง |
| 04 | **ตลาดท่าเสด็จ** | ช้อปปิ้งและของฝาก | ตลาดอินโดจีน สินค้าพื้นเมืองริมแม่น้ำโขง |
| 05 | **ลานวัฒนธรรมพญานาคคู่** | จุดชมวิวและแลนด์มาร์ก | ประติมากรรมพญานาคพ่นน้ำริมฝั่งโขง |
| 06 | **สะพานมิตรภาพไทย-ลาว 1** | การเดินทาง | ประตูเชื่อมโยงสองฝั่งโขงแห่งแรก |
| 07 | **สกายวอล์ค วัดผาตากเสื้อ** | ธรรมชาติและวิวทิวทัศน์ | ทางเดินกระจกใสรูปเกือกม้าชมวิวแม่น้ำโขง |
| 08 | **ภูห้วยอีสัน** | ธรรมชาติ | จุดชมทะเลหมอกสุดอันซีน อ.สังคม |
| 09 | **พิพิธภัณฑ์สัตว์น้ำหนองคาย** | การเรียนรู้ | แหล่งรวบรวมพันธุ์ปลาน้ำจืดลุ่มน้ำโขง |
| 10 | **หาดจอมมณี** | สันทนาการ | หาดทรายริมโขง (พัทยาอีสาน) |

---

## 🛠️ สถาปัตยกรรมระบบ (Project Architecture)

โครงสร้างโฟลเดอร์ถูกจัดวางแบบ Modular เพื่อความสะดวกในการดูแลและพัฒนาต่อ:

```
nong-khai-poi/
├── assets/                     # ภาพประกอบและไอคอน
├── src/
│   ├── components/             # แผนที่แบบ Interactive และ Fullscreen Modal
│   │   └── PoiMap.tsx
│   ├── data/                   # ชุดข้อมูลพิกัดสถานที่ท่องเที่ยว 10 แห่ง
│   │   └── pointsOfInterest.ts
│   ├── screens/                # หน้าจอหลัก (Hero section, รายการสถานที่)
│   │   └── PoiExplorerScreen.tsx
│   ├── theme/                  # ธีมสี (Emerald Green, Naga Gold, ฯลฯ)
│   │   └── colors.ts
│   └── types/                  # Type Definition สำหรับ TypeScript
│       └── poi.ts
├── App.tsx                     # Entry Point ของแอปพลิเคชัน
├── app.config.ts               # การกำหนดค่า Expo และ Google Maps SDK
└── package.json
```

---

## 🚀 ขั้นตอนการติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันแอปพลิเคชันสำหรับพัฒนา (Development Server)
```bash
npm start
```
*เปิดแอป **Expo Go** บนสมาร์ตโฟน แล้วสแกน QR Code ที่แสดงใน Terminal หรือ Browser*

### 3. ตรวจสอบโค้ด (Code Quality Checks)
```bash
# ตรวจสอบความถูกต้องของ Type ด้วย TypeScript
npm run typecheck

# ตรวจสอบ Typecheck พร้อมการประมวลผล Config ของ Expo
npm run check
```

---

## 📦 การเตรียม Build สำหรับ Android Production

โปรเจกต์รองรับการ Deploy ผ่าน **EAS Build** โดยสามารถระบุ Google Maps API Key ผ่าน Environment Variable:

```bash
# กำหนดค่า API Key ในระบบ EAS
npx eas-cli env:create --name GOOGLE_MAPS_ANDROID_API_KEY --environment production --visibility secret

# เริ่มกระบวนการ Build
npx eas-cli build --profile production --platform android
```
*(Package Name: `com.nongkhai.explorer`)*

---

<div align="center">
  <sub>โครงงานนี้พัฒนาขึ้นเพื่อการศึกษาการพัฒนาแอปพลิเคชันด้วย React Native และ Expo</sub>
</div>
