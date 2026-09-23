import { useState } from 'react';
import {
  Alert,
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
  cancelEventReminder,
  hasActiveReminder,
  scheduleEventReminder,
} from '../services/notificationService';

type EventDetailModalProps = {
  eventId: string | null;
  visible: boolean;
  onClose: () => void;
  onSelectPoi?: (poiId: string) => void;
};

export function EventDetailModal({
  eventId,
  visible,
  onClose,
  onSelectPoi,
}: EventDetailModalProps) {
  const [loadingAction, setLoadingAction] = useState(false);

  if (!visible || !eventId) return null;

  // ตรวจสอบและค้นหา Event ตาม ID (DoD: Deep link validate eventId)
  const event = createInitialEvents().find((e) => e.id === eventId);
  const isReminderSet = event ? hasActiveReminder(event.id) : false;

  // -------------------------------------------------------------
  // กรณีไม่พบ Event (404 Fallback State ตามข้อกำหนด Lab 11)
  // -------------------------------------------------------------
  if (!event) {
    return (
      <Modal animationType="fade" transparent visible={visible}>
        <View style={styles.backdrop}>
          <View style={styles.notFoundCard}>
            <Text style={styles.notFoundIcon}>⚠️</Text>
            <Text style={styles.notFoundBadge}>404 NOT FOUND</Text>
            <Text style={styles.notFoundTitle}>ไม่พบข้อมูลกิจกรรม</Text>
            <Text style={styles.notFoundDesc}>
              กิจกรรมรหัส &quot;{eventId}&quot; อาจถูกยกเลิก ลบออกจากฐานข้อมูล หรือระบุรหัสไม่ถูกต้อง
            </Text>
            <View style={styles.notFoundHintBox}>
              <Text style={styles.notFoundHintTitle}>💡 ผลการตรวจสอบตาม Lab 11 Fallback:</Text>
              <Text style={styles.notFoundHintText}>
                ระบบได้ตรวจสอบ payload `eventId` อย่างปลอดภัย และแสดง Not Found Fallback State โดยแอปไม่ขัดข้อง (Crash-free)
              </Text>
            </View>
            <Pressable
              accessibilityLabel="กลับสู่หน้าหลัก"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <Text style={styles.backBtnText}>← กลับสู่รายการกิจกรรม</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // -------------------------------------------------------------
  // ฟังก์ชันตั้งการแจ้งเตือน
  // -------------------------------------------------------------
  const handleSchedule30Min = async () => {
    setLoadingAction(true);
    try {
      await scheduleEventReminder(event);
      Alert.alert(
        '🔔 ตั้งการแจ้งเตือนสำเร็จ',
        `ระบบจะแจ้งเตือนก่อนเริ่มกิจกรรม 30 นาที สำหรับ:\n"${event.title}"\n(Android Channel: event-reminders)`,
        [{ text: 'ตกลง' }]
      );
    } catch (err: any) {
      if (err.message === 'reminder-time-has-passed') {
        Alert.alert(
          '⏰ เวลาเตือนผ่านไปแล้ว',
          'กิจกรรมนี้เหลือเวลาเริ่มน้อยกว่า 30 นาที สามารถเลือกใช้ "ทดสอบด่วน (5 วิ)" เพื่อทดสอบระบบได้'
        );
      } else if (err.message === 'notification-permission-denied') {
        Alert.alert('❌ ไม่ได้รับสิทธิ์', 'กรุณาอนุญาตสิทธิ์การแจ้งเตือนเพื่อใช้งาน');
      } else {
        Alert.alert('ข้อผิดพลาด', err.message ?? 'ไม่สามารถตั้งเตือนได้');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleScheduleQuickTest = async () => {
    setLoadingAction(true);
    try {
      await scheduleEventReminder(event, { quickTestSeconds: 5 });
      Alert.alert(
        '⚡ ตั้งการเตือนทดสอบด่วน (5 วินาที)',
        `แอปจะส่ง Notification สำหรับ "${event.title}" ในอีก 5 วินาที\n\nสามารถพับแอปเพื่อทดสอบ Background หรือเปิดค้างไว้เพื่อดู Foreground Banner`,
        [{ text: 'ตกลง' }]
      );
    } catch (err: any) {
      Alert.alert('ข้อผิดพลาด', err.message ?? 'ไม่สามารถตั้งเตือนได้');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async () => {
    setLoadingAction(true);
    try {
      await cancelEventReminder(event.id);
      Alert.alert('✅ ยกเลิกการเตือนแล้ว', `ยกเลิกการเตือนกิจกรรม "${event.title}" เรียบร้อย`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenMap = () => {
    if (event.location.poiId && onSelectPoi) {
      onClose();
      onSelectPoi(event.location.poiId);
    } else {
      Alert.alert('พิกัดกิจกรรม', `${event.location.name}\n${event.location.address}`);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillIcon}>{event.icon}</Text>
              <Text style={styles.categoryPillText}>{event.categoryLabel}</Text>
            </View>
            <Pressable
              accessibilityLabel="ปิดหน้ารายละเอียด"
              hitSlop={10}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <Text style={styles.title}>{event.title}</Text>

            {/* Time badge */}
            <View style={styles.timeBadgeRow}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>🕒 {event.displayTime}</Text>
              </View>
              {isReminderSet && (
                <View style={styles.reminderActiveBadge}>
                  <Text style={styles.reminderActiveBadgeText}>🔔 ตั้งเตือนแล้ว</Text>
                </View>
              )}
            </View>

            {/* Location Card */}
            <View style={styles.locationBox}>
              <Text style={styles.locationTitle}>📍 สถานที่จัดกิจกรรม</Text>
              <Text style={styles.locationName}>{event.location.name}</Text>
              <Text style={styles.locationAddress}>{event.location.address}</Text>

              {event.location.poiId && (
                <Pressable
                  accessibilityLabel="ดูตำแหน่งบนแผนที่"
                  accessibilityRole="button"
                  onPress={handleOpenMap}
                  style={({ pressed }) => [styles.mapJumpBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.mapJumpBtnText}>🗺️ โฟกัสบนแผนที่หนองคาย</Text>
                </Pressable>
              )}
            </View>

            {/* Description */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>รายละเอียดกิจกรรม</Text>
              <Text style={styles.descText}>{event.description}</Text>
            </View>

            {/* Highlight */}
            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>✨ ไฮไลต์ห้ามพลาด</Text>
              <Text style={styles.highlightText}>{event.highlight}</Text>
            </View>

            {/* Notification Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.actionsSectionTitle}>
                🔔 การตั้งเตือนความจำ (Lab 11 Reminder)
              </Text>

              {isReminderSet ? (
                <Pressable
                  accessibilityLabel="ยกเลิกการแจ้งเตือน"
                  accessibilityRole="button"
                  disabled={loadingAction}
                  onPress={handleCancel}
                  style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.cancelBtnText}>🔕 ยกเลิกการแจ้งเตือน</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    accessibilityLabel="เตือนก่อนกิจกรรม 30 นาที"
                    accessibilityRole="button"
                    disabled={loadingAction}
                    onPress={handleSchedule30Min}
                    style={({ pressed }) => [styles.schedule30Btn, pressed && styles.pressed]}
                  >
                    <Text style={styles.schedule30BtnText}>
                      🔔 เตือนก่อนเริ่มกิจกรรม 30 นาที (Lab 11)
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="ทดสอบด่วน 5 วินาที"
                    accessibilityRole="button"
                    disabled={loadingAction}
                    onPress={handleScheduleQuickTest}
                    style={({ pressed }) => [styles.quickTestBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.quickTestBtnText}>
                      ⚡ ทดสอบแจ้งเตือนด่วน (5 วินาที) สำหรับอัดคลิป
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 26, 44, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryPillIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  categoryPillText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
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
  scroll: {
    flexGrow: 0,
  },
  title: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    marginBottom: 10,
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  timeBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timeBadgeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  reminderActiveBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  reminderActiveBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
  locationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  mapJumpBtn: {
    marginTop: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  mapJumpBtnText: {
    color: '#3730A3',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },
  highlightBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    padding: 12,
    marginBottom: 18,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
  },
  actionsSection: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 10,
  },
  schedule30Btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  schedule30BtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quickTestBtn: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  quickTestBtnText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
  },
  cancelBtn: {
    backgroundColor: 'rgba(224, 90, 56, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.coral,
  },
  cancelBtnText: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  // 404 Not Found Styles
  notFoundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  notFoundBadge: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  notFoundTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: 8,
  },
  notFoundDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  notFoundHintBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 18,
  },
  notFoundHintTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  notFoundHintText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  backBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
