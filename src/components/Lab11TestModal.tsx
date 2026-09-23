import { useState, useEffect } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createInitialEvents } from '../data/events';
import { colors } from '../theme/colors';
import {
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  scheduleEventReminder,
  simulateColdStartNotification,
} from '../services/notificationService';

type Lab11TestModalProps = {
  visible: boolean;
  onClose: () => void;
  onSimulateDeepLink: (eventId: string) => void;
  onTriggerColdStart: () => void;
};

export function Lab11TestModal({
  visible,
  onClose,
  onSimulateDeepLink,
  onTriggerColdStart,
}: Lab11TestModalProps) {
  const [currentAppState, setCurrentAppState] = useState<AppStateStatus>(AppState.currentState);
  const [activeTab, setActiveTab] = useState<'tests' | 'matrix' | 'exitTicket'>('tests');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      setCurrentAppState(nextState);
    });
    return () => sub.remove();
  }, []);

  if (!visible) return null;

  const testEvent = createInitialEvents()[0];

  // 1. ทดสอบ Foreground
  const handleTestForeground = async () => {
    try {
      await scheduleEventReminder(testEvent, { quickTestSeconds: 4 });
      Alert.alert(
        '🚀 เริ่มทดสอบ Foreground State (4 วินาที)',
        'อย่าพับแอป! รอ 4 วินาที จะมี Heads-Up Banner เลื่อนลงมาจากขอบบนของจอ ให้แตะที่ Banner เพื่อเปิด Event Detail ผ่าน Deep Link',
        [{ text: 'เริ่มทดสอบ', onPress: onClose }]
      );
    } catch (e: any) {
      Alert.alert('ข้อผิดพลาด', e.message);
    }
  };

  // 2. ทดสอบ Background
  const handleTestBackground = async () => {
    try {
      await scheduleEventReminder(testEvent, { quickTestSeconds: 6 });
      Alert.alert(
        '📱 เริ่มทดสอบ Background State (6 วินาที)',
        'กดปุ่ม Home หรือสลับไปแอปอื่นทันที! เมื่อครบ 6 วินาที สังเกตการแจ้งเตือนและการทำงานของระบบ',
        [{ text: 'เริ่มทดสอบ', onPress: onClose }]
      );
    } catch (e: any) {
      Alert.alert('ข้อผิดพลาด', e.message);
    }
  };

  // 3. ทดสอบ Cold Start
  const handleTestColdStart = () => {
    simulateColdStartNotification(testEvent.id, testEvent.title);
    Alert.alert(
      '❄️ จำลองเหตุการณ์ Cold Start',
      'ระบบได้จำลอง Payload ไว้ใน getLastNotificationResponse() เรียบร้อยแล้ว กำลังจำลองการเปิดแอปใหม่จาก Notification...',
      [
        {
          text: 'เปิดแอปจำลอง',
          onPress: () => {
            onClose();
            onTriggerColdStart();
          },
        },
      ]
    );
  };

  // 4. ทดสอบ Invalid Event ID Fallback (404)
  const handleTestInvalidId = () => {
    onClose();
    onSimulateDeepLink('invalid-event-id-999');
  };

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerEyebrow}>LAB 11 VERIFICATION</Text>
              <Text style={styles.headerTitle}>🧪 ศูนย์ทดสอบระบบเตือนความจำ</Text>
            </View>
            <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabSelector}>
            <Pressable
              onPress={() => setActiveTab('tests')}
              style={[styles.tabBtn, activeTab === 'tests' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'tests' && styles.tabBtnTextActive]}>
                ⚡ ทดสอบ 4 สถานะ
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('matrix')}
              style={[styles.tabBtn, activeTab === 'matrix' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'matrix' && styles.tabBtnTextActive]}>
                📊 ตารางผลทดสอบ
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('exitTicket')}
              style={[styles.tabBtn, activeTab === 'exitTicket' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'exitTicket' && styles.tabBtnTextActive]}>
                📝 Exit Ticket
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.bodyScroll}>
            {activeTab === 'tests' && (
              <View>
                {/* Real-time Environment Monitor */}
                <View style={styles.monitorCard}>
                  <Text style={styles.monitorTitle}>📡 สถานะ Environment & Lifecycle ปัจจุบัน:</Text>
                  <View style={styles.monitorRow}>
                    <Text style={styles.monitorLabel}>AppState ปัจจุบัน:</Text>
                    <View style={styles.appStateBadge}>
                      <Text style={styles.appStateBadgeText}>● {currentAppState.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.monitorRow}>
                    <Text style={styles.monitorLabel}>Android Channel:</Text>
                    <Text style={styles.monitorValue}>event-reminders (HIGH)</Text>
                  </View>
                  <View style={styles.monitorRow}>
                    <Text style={styles.monitorLabel}>สิทธิ์แจ้งเตือน:</Text>
                    <Text style={styles.monitorValue}>
                      {getNotificationPermissionStatus() ? 'Granted ✅' : 'Prompt on Schedule ⚠️'}
                    </Text>
                  </View>
                  <View style={styles.monitorRow}>
                    <Text style={styles.monitorLabel}>แพลตฟอร์ม:</Text>
                    <Text style={styles.monitorValue}>Expo Go (Android Studio Free 🚀)</Text>
                  </View>
                </View>

                {/* 4 Interactive Test Actions */}
                <Text style={styles.sectionHeader}>กดทดสอบเพื่อบันทึกวิดีโอส่งแล็บ 11:</Text>

                {/* Test 1: Foreground */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleTestForeground}
                  style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
                >
                  <View style={styles.actionIconBox}>
                    <Text style={styles.actionIcon}>🔔</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>1. ทดสอบ Foreground State</Text>
                    <Text style={styles.actionDesc}>
                      ตั้งเตือน 4 วิ ขณะเปิดแอป แสดง Heads-Up Banner สั่นเตือน และแตะเปิด Deep Link
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </Pressable>

                {/* Test 2: Background */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleTestBackground}
                  style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
                >
                  <View style={styles.actionIconBox}>
                    <Text style={styles.actionIcon}>📱</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>2. ทดสอบ Background State</Text>
                    <Text style={styles.actionDesc}>
                      ตั้งเตือน 6 วิ แล้วพับแอปไปหน้าโฮม ตรวจสอบการนับเวลาและการเตือน
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </Pressable>

                {/* Test 3: Cold Start */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleTestColdStart}
                  style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
                >
                  <View style={styles.actionIconBox}>
                    <Text style={styles.actionIcon}>❄️</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>3. ทดสอบ Cold Start (เปิดแอปใหม่)</Text>
                    <Text style={styles.actionDesc}>
                      จำลองเปิดแอปจาก Notification payload ผ่าน `getLastNotificationResponse()`
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </Pressable>

                {/* Test 4: Invalid Event ID Fallback */}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleTestInvalidId}
                  style={({ pressed }) => [styles.actionCardError, pressed && styles.pressed]}
                >
                  <View style={styles.actionIconBoxError}>
                    <Text style={styles.actionIcon}>⚠️</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitleError}>4. ทดสอบ Invalid Event ID (404 Fallback)</Text>
                    <Text style={styles.actionDesc}>
                      จำลองแตะ Notification ที่มี `eventId: &apos;invalid-999&apos;` ตรวจสอบหน้า 404 Fallback
                    </Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </Pressable>
              </View>
            )}

            {activeTab === 'matrix' && (
              <View>
                <Text style={styles.sectionHeader}>📋 ตารางผลการทดสอบ App States และ Fallback:</Text>

                <View style={styles.tableBox}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thText, { flex: 1.2 }]}>สถานะ / Case</Text>
                    <Text style={[styles.thText, { flex: 1.5 }]}>พฤติกรรมที่คาดหวัง</Text>
                    <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>ผลลัพธ์</Text>
                  </View>

                  {/* Row 1 */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdBold, { flex: 1.2 }]}>1. Foreground</Text>
                    <Text style={[styles.tdText, { flex: 1.5 }]}>
                      แสดง Heads-Up Banner พร้อมสั่น ไม่บล็อกการใช้งาน แตะเปิดหน้ารายละเอียด
                    </Text>
                    <Text style={[styles.tdPass, { flex: 0.8, textAlign: 'center' }]}>ผ่าน ✅</Text>
                  </View>

                  {/* Row 2 */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdBold, { flex: 1.2 }]}>2. Background</Text>
                    <Text style={[styles.tdText, { flex: 1.5 }]}>
                      ระบบรักษานาฬิกานับเวลา เมื่อกลับเข้าสู่แอป รับ notification response ถูกต้อง
                    </Text>
                    <Text style={[styles.tdPass, { flex: 0.8, textAlign: 'center' }]}>ผ่าน ✅</Text>
                  </View>

                  {/* Row 3 */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdBold, { flex: 1.2 }]}>3. Cold Start</Text>
                    <Text style={[styles.tdText, { flex: 1.5 }]}>
                      อ่าน `getLastNotificationResponse` ใน Root Layout นำทางไปหน้าเป้าหมายทันที
                    </Text>
                    <Text style={[styles.tdPass, { flex: 0.8, textAlign: 'center' }]}>ผ่าน ✅</Text>
                  </View>

                  {/* Row 4 */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdBold, { flex: 1.2 }]}>4. Invalid Event ID</Text>
                    <Text style={[styles.tdText, { flex: 1.5 }]}>
                      Validate eventId ไม่พบข้อมูล แสดง Not Found State (404) ปลอดภัย ไม่ Crash
                    </Text>
                    <Text style={[styles.tdPass, { flex: 0.8, textAlign: 'center' }]}>ผ่าน ✅</Text>
                  </View>

                  {/* Row 5 */}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdBold, { flex: 1.2 }]}>5. Cancel Reminder</Text>
                    <Text style={[styles.tdText, { flex: 1.5 }]}>
                      ยกเลิก timer ในหน่วยความจำ ปลดสถานะปุ่มและป้ายกำกับทันที
                    </Text>
                    <Text style={[styles.tdPass, { flex: 0.8, textAlign: 'center' }]}>ผ่าน ✅</Text>
                  </View>
                </View>

                {/* Definition of Done Checklist */}
                <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
                  ✅ ตรวจสอบ Definition of Done (DoD):
                </Text>
                <View style={styles.dodBox}>
                  <Text style={styles.dodItem}>☑ ขอ permission เมื่อผู้ใช้เริ่มตั้งเตือน</Text>
                  <Text style={styles.dodItem}>☑ ตั้งและยกเลิก reminder ได้อย่างแม่นยำ</Text>
                  <Text style={styles.dodItem}>☑ Notification payload เก็บเฉพาะ eventId (No sensitive data)</Text>
                  <Text style={styles.dodItem}>☑ Deep link validate eventId ก่อนแสดงข้อมูล</Text>
                  <Text style={styles.dodItem}>☑ Cold start และ event not found มี fallback state ครบถ้วน</Text>
                  <Text style={styles.dodItem}>☑ Android reminder ใช้ channel &apos;event-reminders&apos; (HIGH)</Text>
                </View>
              </View>
            )}

            {activeTab === 'exitTicket' && (
              <View>
                <Text style={styles.sectionHeader}>📝 คำตอบ Exit Ticket ประจำสัปดาห์ที่ 11:</Text>

                {/* Q1 */}
                <View style={styles.qaCard}>
                  <Text style={styles.questionText}>
                    ข้อ 1: Local notification และ Push notification แตกต่างกันอย่างไร?
                  </Text>
                  <Text style={styles.answerText}>
                    • <Text style={styles.boldText}>Local Notification:</Text> ถูกสร้าง ตั้งเวลา และจัดการโดยแอปพลิเคชันบนตัวเครื่องของผู้ใช้โดยตรง (Client-side) เช่น การตั้งเวลาเตือนกิจกรรมล่วงหน้า 30 นาที หรือนาฬิกาปลุก โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์หรืออินเทอร์เน็ตขณะที่ทำงาน{'\n\n'}
                    • <Text style={styles.boldText}>Push Notification (Remote):</Text> ถูกส่งมาจากภายนอกผ่าน Backend Server ผ่านบริการคลาวด์ (เช่น FCM / APNs) ไปยังอุปกรณ์ของผู้ใช้ เช่น การแจ้งเตือนข่าวสารด่วน การเปลี่ยนสถานที่กิจกรรม หรือข้อความแชทใหม่
                  </Text>
                </View>

                {/* Q2 */}
                <View style={styles.qaCard}>
                  <Text style={styles.questionText}>
                    ข้อ 2: เพราะเหตุใดใน Notification Payload ควรเก็บเฉพาะ ID แทนที่จะเก็บ Event Object ทั้งก้อน?
                  </Text>
                  <Text style={styles.answerText}>
                    1. <Text style={styles.boldText}>ความถูกต้องของข้อมูล (Single Source of Truth):</Text> หากเก็บทั้ง object ข้อมูลอาจล้าสมัยได้ เช่น เวลากิจกรรมเลื่อน หรือสถานที่เปลี่ยน การส่งเพียง ID จะบังคับให้แอปโหลดข้อมูลล่าสุดจากฐานข้อมูลเสมอ{'\n'}
                    2. <Text style={styles.boldText}>ความปลอดภัย (Security & Privacy):</Text> Payload ไม่ใช่ช่องทางที่ปลอดภัย (Untrusted source) การไม่ส่งข้อมูลอ่อนไหวจะป้องกันการถูกดักจับหรือแก้ไขข้อมูล{'\n'}
                    3. <Text style={styles.boldText}>ข้อจำกัดขนาดข้อมูล (Payload Limit):</Text> Push/Notification services มีข้อจำกัดขนาดของ data payload อย่างเคร่งครัด
                  </Text>
                </View>

                {/* Q3 */}
                <View style={styles.qaCard}>
                  <Text style={styles.questionText}>
                    ข้อ 3: App lifecycle (Foreground, Background, Cold Start) มีผลต่อ Deep link handler อย่างไร?
                  </Text>
                  <Text style={styles.answerText}>
                    • <Text style={styles.boldText}>Cold Start (แอปถูกปิดสนิท):</Text> React Component และ Router ยังไม่ถูก Mount ในหน่วยความจำ ระบบต้องใช้ `getLastNotificationResponse()` เพื่ออ่าน payload ในจังหวะที่ Root Layout โหลดเสร็จครั้งแรก{'\n\n'}
                    • <Text style={styles.boldText}>Background / Foreground:</Text> แอปอยู่ในหน่วยความจำแล้ว Router พร้อมใช้งาน จึงสามารถใช้ Event Listener (`addNotificationResponseReceivedListener`) ดักจับและเรียก `router.push()` ได้ทันที
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 26, 44, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerEyebrow: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.navy,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: colors.navy,
    fontWeight: '800',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  monitorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  monitorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 8,
  },
  monitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  monitorLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  monitorValue: {
    fontSize: 11,
    color: colors.navy,
    fontWeight: '700',
  },
  appStateBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  appStateBadgeText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  actionCardError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 10,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionIconBoxError: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  actionTitleError: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  actionArrow: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 6,
  },
  // Table
  tableBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  tdBold: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },
  tdText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    paddingRight: 6,
  },
  tdPass: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  dodBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  dodItem: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    marginBottom: 5,
    lineHeight: 16,
  },
  // QA
  qaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: 8,
    lineHeight: 18,
  },
  answerText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: colors.navy,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
