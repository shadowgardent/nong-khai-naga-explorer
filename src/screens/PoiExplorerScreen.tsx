import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PoiMap } from '../components/PoiMap';
import { pointsOfInterest } from '../data/pointsOfInterest';
import { colors } from '../theme/colors';
import type { PoiCategoryGroup, PointOfInterest } from '../types/poi';

const CATEGORY_TABS: { key: PoiCategoryGroup; label: string; icon: string; count: number }[] = [
  { key: 'all', label: 'ทั้งหมด', icon: '🌟', count: 10 },
  { key: 'sacred', label: 'สายมู & วัด', icon: '🛕', count: 3 },
  { key: 'nature', label: 'ธรรมชาติ & วิวโขง', icon: '🌄', count: 3 },
  { key: 'lifestyle', label: 'ชิมช้อป & แลนด์มาร์ก', icon: '🛍️', count: 4 },
];

type PoiExplorerScreenProps = {
  /** poiId ที่ส่งมาจาก App.tsx เมื่อผู้ใช้แตะ Notification เพื่อโฟกัสสถานที่นั้นอัตโนมัติ */
  notificationPoiId?: string | null;
  /** Callback เมื่อจัดการโฟกัสสถานที่เสร็จแล้ว */
  onHandledNotification?: () => void;
};

export function PoiExplorerScreen({
  notificationPoiId,
  onHandledNotification,
}: PoiExplorerScreenProps) {
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest>(pointsOfInterest[0]);
  const [activeCategory, setActiveCategory] = useState<PoiCategoryGroup>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<FlatList<PointOfInterest>>(null);

  // In-App Reminder timer (สำหรับรันบน Expo Go 100% ป้องกัน crash บน Android)
  const [activeReminderPoiId, setActiveReminderPoiId] = useState<string | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
    };
  }, []);

  // -----------------------------------------------------------------
  // Deep Link Handler: รับ poiId จาก Notification
  // ทำงานทั้งตอน Cold Start, Background, และ Foreground อย่างแม่นยำ
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!notificationPoiId) return;

    const target = pointsOfInterest.find((p) => p.id === notificationPoiId);
    if (target) {
      // รีเซ็ต filter ให้เห็นสถานที่นั้น แล้วโฟกัส
      setActiveCategory('all');
      setSearchQuery('');
      setSelectedPoi(target);
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 330, animated: true });
      }, 250);
    }

    onHandledNotification?.();
  }, [notificationPoiId, onHandledNotification]);

  const filteredPois = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pointsOfInterest.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.categoryGroup === activeCategory;
      const matchSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.district.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const selectPoi = (poi: PointOfInterest) => {
    setSelectedPoi(poi);
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 330, animated: true });
    }, 100);
  };

  const openNavigation = (poi: PointOfInterest) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('เปิดแผนที่ไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    });
  };

  const showCoordinates = (poi: PointOfInterest) => {
    Alert.alert(
      'พิกัด GPS',
      `${poi.name}\n\nLatitude: ${poi.latitude.toFixed(5)}\nLongitude: ${poi.longitude.toFixed(5)}`,
    );
  };

  // -----------------------------------------------------------------
  // ตั้งการแจ้งเตือน In-App Reminder (5 วินาที สำหรับทดสอบ/สาธิตใน Expo Go)
  // -----------------------------------------------------------------
  const handleScheduleReminder = useCallback((poi: PointOfInterest) => {
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
    }
    setActiveReminderPoiId(poi.id);

    Alert.alert(
      '🔔 ตั้งเตือนความจำแล้ว',
      `ระบบจะแจ้งเตือนการท่องเที่ยว "${poi.name}" ในอีก 5 วินาที\n(รองรับ 100% บน Expo Go)`,
      [{ text: 'ตกลง' }],
    );

    reminderTimerRef.current = setTimeout(() => {
      setActiveReminderPoiId(null);
      Alert.alert(
        '🔔 ถึงเวลาท่องเที่ยวหนองคาย!',
        `ได้เวลาไปเยือน "${poi.name}" (${poi.district}) แล้ว!\n\n💡 เวลาแนะนำ: ${poi.bestTime}\n📍 ไฮไลต์: ${poi.tag}`,
        [
          { text: 'ปิด', style: 'cancel' },
          {
            text: '📍 ดูบนแผนที่',
            onPress: () => {
              setSelectedPoi(poi);
              listRef.current?.scrollToOffset({ offset: 330, animated: true });
            },
          },
        ],
      );
    }, 5000);
  }, []);

  // -----------------------------------------------------------------
  // ยกเลิกการแจ้งเตือน
  // -----------------------------------------------------------------
  const handleCancelReminder = useCallback((poi: PointOfInterest) => {
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
      reminderTimerRef.current = null;
    }
    setActiveReminderPoiId(null);
    Alert.alert('✅ ยกเลิกการแจ้งเตือนแล้ว', `ยกเลิกการแจ้งเตือน "${poi.name}" เรียบร้อย`);
  }, []);

  return (
    <FlatList
      ref={listRef}
      contentContainerStyle={styles.content}
      data={filteredPois}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>ไม่พบสถานที่ที่ค้นหา</Text>
          <Text style={styles.emptyDesc}>ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={styles.resetButtonText}>รีเซ็ตการค้นหา</Text>
          </Pressable>
        </View>
      }
      ListHeaderComponent={
        <View>
          {/* Header & Hero Section */}
          <View style={styles.heroBanner}>
            <View style={styles.nagaWavePattern} />
            <View style={styles.nagaWaterGlow} />

            <View style={styles.headerTopBar}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandIcon}>🐉</Text>
                <View style={styles.brandTextWrap}>
                  <Text style={styles.brandSub}>NONG KHAI · THAILAND</Text>
                  <Text style={styles.brandTitle}>NAGA EXPLORER</Text>
                </View>
              </View>
              <View style={styles.mekongTag}>
                <Text style={styles.mekongTagDot}>🌊</Text>
                <Text style={styles.mekongTagText}>ริมฝั่งโขง</Text>
              </View>
            </View>

            <Text style={styles.heroHeading}>
              มนต์เสน่ห์แดนพญานาค{`\n`}เยือนเมืองริมโขงหนองคาย
            </Text>
            <Text style={styles.heroDescription}>
              สำรวจ 10 พิกัดไฮไลท์ ไหว้พระศักดิ์สิทธิ์ ชมทะเลหมอก 360 องศา และสัมผัสวัฒนธรรมอินโดจีน
            </Text>

            <View style={styles.statsPills}>
              <View style={styles.statPillGold}>
                <Text style={styles.statPillGoldText}>📍 10 แลนด์มาร์ก</Text>
              </View>
              <View style={styles.statPillDark}>
                <Text style={styles.statPillDarkText}>🧭 เมือง & สังคม</Text>
              </View>
              <View style={styles.statPillDark}>
                <Text style={styles.statPillDarkText}>🗺️ OpenStreetMap</Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              clearButtonMode="while-editing"
              onChangeText={setSearchQuery}
              placeholder="ค้นหาวัด, ทะเลหมอก, ริมโขง, อำเภอ..."
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable
                accessibilityLabel="ล้างคำค้นหา"
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Category Filter Tabs */}
          <ScrollView
            contentContainerStyle={styles.categoryScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.key;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  key={tab.key}
                  onPress={() => setActiveCategory(tab.key)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    isActive && styles.categoryChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.categoryChipIcon}>{tab.icon}</Text>
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      isActive && styles.categoryChipLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.categoryChipCount,
                      isActive && styles.categoryChipCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipCountText,
                        isActive && styles.categoryChipCountTextActive,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Interactive Map Header */}
          <View style={styles.mapHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>OPENSTREETMAP INTERACTIVE</Text>
              <Text style={styles.sectionTitle}>แผนที่นำทางพิกัดจริง</Text>
            </View>
            <View style={styles.activePinBadge}>
              <Text style={styles.activePinDot}>●</Text>
              <Text numberOfLines={1} style={styles.activePinText}>
                {selectedPoi.name}
              </Text>
            </View>
          </View>

          {/* Map Component */}
          <PoiMap poi={selectedPoi} />

          {/* Detailed Guide Card of Selected POI */}
          <View style={styles.travelGuideCard}>
            <View style={styles.goldHeaderStrip} />

            <View style={styles.guideTopRow}>
              <View style={styles.guideIconBubble}>
                <Text style={styles.guideIconEmoji}>{selectedPoi.icon}</Text>
              </View>
              <View style={styles.guideTitleWrap}>
                <View style={styles.badgeRow}>
                  <View style={styles.districtBadge}>
                    <Text style={styles.districtBadgeText}>📍 {selectedPoi.district}</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>✨ {selectedPoi.tag}</Text>
                  </View>
                </View>
                <Text style={styles.guideName}>{selectedPoi.name}</Text>
                <Text style={styles.guideCategory}>{selectedPoi.category}</Text>
              </View>
            </View>

            <Text style={styles.guideDescription}>{selectedPoi.description}</Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🕒 เวลาแนะนำ:</Text>
                <Text style={styles.infoValue}>{selectedPoi.bestTime}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📌 ที่ตั้ง:</Text>
                <Text numberOfLines={2} style={styles.infoValue}>
                  {selectedPoi.address}
                </Text>
              </View>
            </View>

            {/* Travel Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel="นำทางไปยังสถานที่นี้ด้วย Google Maps"
                accessibilityRole="button"
                onPress={() => openNavigation(selectedPoi)}
                style={({ pressed }) => [styles.navigateBtn, pressed && styles.pressed]}
              >
                <Text style={styles.navigateBtnIcon}>🧭</Text>
                <Text style={styles.navigateBtnText}>เปิดเส้นทางนำทาง</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="ดูพิกัด GPS"
                accessibilityRole="button"
                onPress={() => showCoordinates(selectedPoi)}
                style={({ pressed }) => [styles.gpsBtn, pressed && styles.pressed]}
              >
                <Text style={styles.gpsBtnText}>
                  🌐 {selectedPoi.latitude.toFixed(4)}, {selectedPoi.longitude.toFixed(4)}
                </Text>
              </Pressable>
            </View>

            {/* Notification Reminder Button */}
            {activeReminderPoiId === selectedPoi.id ? (
              <Pressable
                accessibilityLabel="ยกเลิกการแจ้งเตือนสถานที่นี้"
                accessibilityRole="button"
                onPress={() => handleCancelReminder(selectedPoi)}
                style={({ pressed }) => [styles.reminderCancelBtn, pressed && styles.pressed]}
              >
                <Text style={styles.reminderBtnIcon}>🔕</Text>
                <Text style={styles.reminderCancelBtnText}>ยกเลิกการแจ้งเตือน</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityLabel="ตั้งการแจ้งเตือนทดสอบ 5 วินาที"
                accessibilityRole="button"
                onPress={() => handleScheduleReminder(selectedPoi)}
                style={({ pressed }) => [
                  styles.reminderBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.reminderBtnIcon}>🔔</Text>
                <Text style={styles.reminderBtnText}>ทดสอบแจ้งเตือน (5 วิ)</Text>
              </Pressable>
            )}
          </View>

          {/* Landmark List Header */}
          <View style={styles.listHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>NONG KHAI PLACES</Text>
              <Text style={styles.sectionTitle}>
                รายการสถานที่ ({filteredPois.length} แห่ง)
              </Text>
            </View>
            <Text style={styles.listSubtitleHint}>แตะเพื่อขยับแผนที่</Text>
          </View>
        </View>
      }
      renderItem={({ item, index }) => {
        const isSelected = item.id === selectedPoi.id;

        return (
          <Pressable
            accessibilityHint="แตะเพื่อเลื่อนแผนที่มายังจุดนี้"
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => selectPoi(item)}
            style={({ pressed }) => [
              styles.nagaCard,
              isSelected && styles.nagaCardActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.cardRank, isSelected && styles.cardRankActive]}>
              <Text style={[styles.cardRankText, isSelected && styles.cardRankTextActive]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>

            <View style={[styles.cardIconBox, isSelected && styles.cardIconBoxActive]}>
              <Text style={styles.cardIconText}>{item.icon}</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardMetaRow}>
                <Text style={[styles.cardDistrict, isSelected && styles.cardDistrictActive]}>
                  {item.district}
                </Text>
                <Text style={[styles.cardTag, isSelected && styles.cardTagActive]}>
                  · {item.tag}
                </Text>
              </View>
              <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                {item.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.cardAddress, isSelected && styles.cardAddressActive]}
              >
                🕒 {item.bestTime} · {item.address}
              </Text>
            </View>

            <View style={[styles.cardSelectBtn, isSelected && styles.cardSelectBtnActive]}>
              {activeReminderPoiId === item.id && (
                <Text style={styles.cardReminderBadge}>🔔 </Text>
              )}
              <Text style={[styles.cardSelectBtnText, isSelected && styles.cardSelectBtnTextActive]}>
                {isSelected ? '✓ หมุดนี้' : 'ดูพิกัด'}
              </Text>
            </View>
          </Pressable>
        );
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  heroBanner: {
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.navy,
    padding: 22,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.gold,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  nagaWavePattern: {
    position: 'absolute',
    width: 260,
    height: 260,
    top: -100,
    right: -80,
    borderRadius: 130,
    borderWidth: 36,
    borderColor: 'rgba(229,169,60,0.12)',
  },
  nagaWaterGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    bottom: -50,
    left: 80,
    borderRadius: 70,
    backgroundColor: 'rgba(18,90,107,0.35)',
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brandSub: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  mekongTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229,169,60,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mekongTagDot: {
    fontSize: 11,
    marginRight: 4,
  },
  mekongTagText: {
    color: '#E3F2ED',
    fontSize: 10,
    fontWeight: '800',
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 18,
  },
  heroDescription: {
    color: '#C6DDD6',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  statsPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 6,
  },
  statPillGold: {
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statPillGoldText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '900',
  },
  statPillDark: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  statPillDarkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    padding: 0,
    fontWeight: '600',
  },
  clearSearchBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  categoryChipIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  categoryChipLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  categoryChipLabelActive: {
    color: '#FFFFFF',
  },
  categoryChipCount: {
    borderRadius: 999,
    backgroundColor: '#E8F1ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  categoryChipCountActive: {
    backgroundColor: colors.gold,
  },
  categoryChipCountText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '900',
  },
  categoryChipCountTextActive: {
    color: colors.navy,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionEyebrow: {
    color: colors.emerald,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  activePinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 160,
    borderRadius: 999,
    backgroundColor: '#D7EBE3',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activePinDot: {
    color: colors.emerald,
    fontSize: 8,
    marginRight: 5,
  },
  activePinText: {
    color: colors.navy,
    fontSize: 9,
    fontWeight: '800',
  },
  travelGuideCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 14,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  goldHeaderStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gold,
  },
  guideTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  guideIconBubble: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  guideIconEmoji: {
    fontSize: 26,
  },
  guideTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  districtBadge: {
    borderRadius: 6,
    backgroundColor: '#E2EFEA',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  districtBadgeText: {
    color: colors.primaryDark,
    fontSize: 9,
    fontWeight: '800',
  },
  tagBadge: {
    borderRadius: 6,
    backgroundColor: colors.goldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagBadgeText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '800',
  },
  guideName: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  guideCategory: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  guideDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  infoBox: {
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    width: 80,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  navigateBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  navigateBtnIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  navigateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  gpsBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  gpsBtnText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    shadowColor: colors.goldDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderBtnLoading: {
    opacity: 0.6,
  },
  reminderCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.coral,
    backgroundColor: 'rgba(224,90,56,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  reminderBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  reminderBtnText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '900',
  },
  reminderCancelBtnText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: '900',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listSubtitleHint: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  nagaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
  },
  nagaCardActive: {
    borderColor: colors.gold,
    backgroundColor: colors.navy,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  cardRank: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E7F1ED',
  },
  cardRankActive: {
    backgroundColor: colors.gold,
  },
  cardRankText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },
  cardRankTextActive: {
    color: colors.navy,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceWarm,
    marginLeft: 10,
  },
  cardIconBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  cardIconText: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    marginLeft: 10,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDistrict: {
    color: colors.emerald,
    fontSize: 9,
    fontWeight: '900',
  },
  cardDistrictActive: {
    color: colors.gold,
  },
  cardTag: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 3,
  },
  cardTagActive: {
    color: '#D2DFDB',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  cardTitleActive: {
    color: '#FFFFFF',
  },
  cardAddress: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  cardAddressActive: {
    color: '#B6D1C9',
  },
  cardSelectBtn: {
    borderRadius: 10,
    backgroundColor: '#EBF3F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
  },
  cardSelectBtnActive: {
    backgroundColor: colors.gold,
  },
  cardSelectBtnText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: '900',
  },
  cardSelectBtnTextActive: {
    color: colors.navy,
  },
  cardReminderBadge: {
    fontSize: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  resetButton: {
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
  resetButtonText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
