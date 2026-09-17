import { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { initialEvents } from '../data/events';
import { colors } from '../theme/colors';
import type { NongKhaiEvent } from '../types/event';
import {
  cancelEventReminder,
  ensureNotificationPermission,
  getNotificationPermissionStatus,
  hasActiveReminder,
  scheduleEventReminder,
} from '../services/notificationService';

type EventListTabProps = {
  onOpenEventDetail: (eventId: string) => void;
  onOpenTestPanel: () => void;
  onSelectPoi: (poiId: string) => void;
};

export function EventListTab({
  onOpenEventDetail,
  onOpenTestPanel,
  onSelectPoi,
}: EventListTabProps) {
  const [events, setEvents] = useState<NongKhaiEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.location.name.toLowerCase().includes(q) ||
      e.categoryLabel.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  });

  const handleSchedule30Min = async (event: NongKhaiEvent) => {
    try {
      await scheduleEventReminder(event);
      setRefreshKey((k) => k + 1);
      Alert.alert(
        '🔔 ตั้งการแจ้งเตือนสำเร็จ (Lab 11)',
        `ระบบจะแจ้งเตือนก่อนกิจกรรม "${event.title}" เริ่ม 30 นาที\n\n📌 ช่องทาง: Android Channel "event-reminders"\n🔒 ความปลอดภัย: Payload บันทึกเฉพาะ eventId`,
        [{ text: 'ตกลง' }]
      );
    } catch (err: any) {
      if (err.message === 'reminder-time-has-passed') {
        Alert.alert(
          '⏰ เวลาเตือนผ่านไปแล้ว',
          'กิจกรรมนี้เริ่มในอีกไม่เกิน 30 นาที สามารถเลือกใช้ "ทดสอบด่วน 5 วิ" เพื่อทดสอบการแจ้งเตือน'
        );
      } else {
        Alert.alert('ข้อผิดพลาด', err.message ?? 'ไม่สามารถตั้งเตือนได้');
      }
    }
  };

  const handleScheduleQuickTest = async (event: NongKhaiEvent) => {
    try {
      await scheduleEventReminder(event, { quickTestSeconds: 5 });
      setRefreshKey((k) => k + 1);
      Alert.alert(
        '⚡ เริ่มนับถอยหลังทดสอบด่วน 5 วินาที',
        `ระบบจะส่งการแจ้งเตือนสำหรับ "${event.title}" ภายใน 5 วินาที\n\nสามารถเปิดหน้าแอปไว้เพื่อดู Foreground Banner หรือพับแอปเพื่อทดสอบ`,
        [{ text: 'ตกลง' }]
      );
    } catch (err: any) {
      Alert.alert('ข้อผิดพลาด', err.message ?? 'ไม่สามารถตั้งเตือนได้');
    }
  };

  const handleCancelReminder = async (event: NongKhaiEvent) => {
    await cancelEventReminder(event.id);
    setRefreshKey((k) => k + 1);
    Alert.alert('✅ ยกเลิกการเตือนแล้ว', `ยกเลิกการเตือนกิจกรรม "${event.title}" เรียบร้อย`);
  };

  return (
    <FlatList
      keyExtractor={(item) => item.id}
      data={filteredEvents}
      extraData={refreshKey}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {/* Header Banner */}
          <View style={styles.bannerBox}>
            <View style={styles.bannerTagRow}>
              <Text style={styles.bannerTag}>LAB 11 — EVENT REMINDERS</Text>
              <View style={styles.channelPill}>
                <Text style={styles.channelPillText}>Channel: event-reminders</Text>
              </View>
            </View>

            <Text style={styles.bannerTitle}>🎪 กิจกรรม & ประเพณีหนองคาย</Text>
            <Text style={styles.bannerSubtitle}>
              ระบบแจ้งเตือน Local Event Reminder ก่อนเริ่มกิจกรรม 30 นาที พร้อมรองรับ Deep Link และจำลอง App Lifecycle 100% บน Expo Go
            </Text>

            {/* Status indicators */}
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusDot}>🟢</Text>
                <Text style={styles.statusText}>
                  สิทธิ์: {getNotificationPermissionStatus() ? 'อนุญาตแล้ว' : 'ขอเมื่อเริ่มตั้ง'}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusDot}>⚡</Text>
                <Text style={styles.statusText}>ความสำคัญ: HIGH</Text>
              </View>
            </View>

            {/* Test Panel Shortcut */}
            <Pressable
              accessibilityLabel="เปิดแผงทดสอบแล็บ 11"
              accessibilityRole="button"
              onPress={onOpenTestPanel}
              style={({ pressed }) => [styles.testPanelBtn, pressed && styles.pressed]}
            >
              <Text style={styles.testPanelBtnText}>
                🧪 เปิดแผงทดสอบส่งแล็บ (Foreground / Background / Cold Start / 404) →
              </Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ค้นหากิจกรรม, สถานที่ หรือเทศกาล..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.countRow}>
            <Text style={styles.countText}>
              กิจกรรมทั้งหมด ({filteredEvents.length} รายการ)
            </Text>
            <Text style={styles.countHint}>แตะการ์ดเพื่อดูรายละเอียด</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const isReminderActive = hasActiveReminder(item.id);

        return (
          <Pressable
            accessibilityLabel={`ดูรายละเอียด ${item.title}`}
            accessibilityRole="button"
            onPress={() => onOpenEventDetail(item.id)}
            style={({ pressed }) => [styles.eventCard, pressed && styles.cardPressed]}
          >
            {/* Card Top */}
            <View style={styles.cardTopRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeIcon}>{item.icon}</Text>
                <Text style={styles.categoryBadgeText}>{item.categoryLabel}</Text>
              </View>
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>🕒 {item.displayTime}</Text>
              </View>
            </View>

            {/* Card Title & Location */}
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text numberOfLines={1} style={styles.cardLocation}>
              📍 {item.location.name}
            </Text>
            <Text numberOfLines={2} style={styles.cardDesc}>
              {item.description}
            </Text>

            {/* Card Actions */}
            <View style={styles.cardActionsRow}>
              {isReminderActive ? (
                <View style={styles.activeReminderWrap}>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>🔔 ตั้งเตือนไว้แล้ว</Text>
                  </View>
                  <Pressable
                    accessibilityLabel="ยกเลิกเตือน"
                    accessibilityRole="button"
                    onPress={() => handleCancelReminder(item)}
                    style={({ pressed }) => [styles.cardCancelBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.cardCancelBtnText}>🔕 ยกเลิก</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.btnGroup}>
                  <Pressable
                    accessibilityLabel="เตือนก่อน 30 นาที"
                    accessibilityRole="button"
                    onPress={() => handleSchedule30Min(item)}
                    style={({ pressed }) => [styles.cardRemindBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.cardRemindBtnText}>🔔 เตือน 30 นาที</Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel="ทดสอบด่วน 5 วิ"
                    accessibilityRole="button"
                    onPress={() => handleScheduleQuickTest(item)}
                    style={({ pressed }) => [styles.cardQuickBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.cardQuickBtnText}>⚡ ทดสอบ 5 วิ</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.detailLink}>
                <Text style={styles.detailLinkText}>รายละเอียด →</Text>
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerWrap: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  bannerBox: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.gold,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bannerTag: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  channelPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelPillText: {
    color: '#7DD3FC',
    fontSize: 9,
    fontWeight: '700',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: colors.surfaceWarm,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    fontSize: 8,
    marginRight: 4,
  },
  statusText: {
    color: colors.surfaceWarm,
    fontSize: 11,
    fontWeight: '600',
  },
  testPanelBtn: {
    backgroundColor: 'rgba(232, 169, 56, 0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  testPanelBtnText: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navy,
    padding: 0,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    padding: 4,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },
  countHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.995 }],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  timePill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timePillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: 4,
    lineHeight: 22,
  },
  cardLocation: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardRemindBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  cardRemindBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardQuickBtn: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  cardQuickBtnText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },
  activeReminderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '800',
  },
  cardCancelBtn: {
    backgroundColor: 'rgba(224, 90, 56, 0.1)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.coral,
  },
  cardCancelBtnText: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: '700',
  },
  detailLink: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  detailLinkText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
