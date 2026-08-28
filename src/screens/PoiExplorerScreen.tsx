import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PoiMap } from '../components/PoiMap';
import { pointsOfInterest } from '../data/pointsOfInterest';
import { colors } from '../theme/colors';
import type { PointOfInterest } from '../types/poi';

export function PoiExplorerScreen() {
  const [selectedPoi, setSelectedPoi] = useState(pointsOfInterest[0]);
  const listRef = useRef<FlatList<PointOfInterest>>(null);

  const selectPoi = (poi: PointOfInterest) => {
    setSelectedPoi(poi);
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 340, animated: true });
    }, 80);
  };

  return (
    <FlatList
      ref={listRef}
      contentContainerStyle={styles.content}
      data={pointsOfInterest}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <View style={styles.orbitLarge} />
            <View style={styles.orbitSmall} />
            <View style={styles.heroTopRow}>
              <View style={styles.brandLockup}>
                <View style={styles.brandBadgeIcon}>
                  <Text style={styles.brandEmoji}>🐉</Text>
                </View>
                <View>
                  <Text style={styles.brandEyebrow}>NONG KHAI</Text>
                  <Text style={styles.brandName}>NAGA EXPLORER</Text>
                </View>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeNumber}>10</Text>
                <Text style={styles.heroBadgeText}>PLACES</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>เยือนแดนพญานาค{`\n`}เลาะริมโขงหนองคาย</Text>
            <Text style={styles.heroSubtitle}>
              สัมผัสมนต์เสน่ห์ริมฝั่งโขง วัฒนธรรม และแหล่งท่องเที่ยวอันซีน เลือกสถานที่แล้วออกเดินทาง
            </Text>

            <View style={styles.heroChips}>
              <View style={styles.heroChipGold}>
                <Text style={styles.heroChipGoldText}>🐉 NAGA CITY</Text>
              </View>
              <View style={styles.heroChipDark}>
                <Text style={styles.heroChipDarkText}>🌊 MEKONG RIVER</Text>
              </View>
            </View>
          </View>

          <View style={styles.mapSectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>INTERACTIVE MAP</Text>
              <Text style={styles.sectionTitle}>แผนที่นำทาง</Text>
              <Text style={styles.sectionSubtitle}>แตะ “ขยายแผนที่” เพื่อเปิดมุมมองเต็มจอ</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveDot}>●</Text>
              <Text style={styles.liveText}>SELECTED</Text>
            </View>
          </View>

          <PoiMap poi={selectedPoi} />

          <View style={styles.selectedCard}>
            <View style={styles.selectedTopRow}>
              <View style={styles.selectedIcon}>
                <Text style={styles.selectedIconText}>{selectedPoi.icon}</Text>
              </View>
              <View style={styles.selectedCopy}>
                <Text style={styles.selectedCategory}>{selectedPoi.category}</Text>
                <Text style={styles.selectedName}>{selectedPoi.name}</Text>
              </View>
              <View style={styles.selectedMark}>
                <Text style={styles.selectedMarkText}>✓</Text>
              </View>
            </View>

            <Text style={styles.selectedAddress}>⌖ {selectedPoi.address}</Text>
            <Text style={styles.selectedDescription}>{selectedPoi.description}</Text>

            <View style={styles.coordinateBar}>
              <Text style={styles.coordinateLabel}>COORDINATES</Text>
              <Text style={styles.coordinates}>
                {selectedPoi.latitude.toFixed(5)} · {selectedPoi.longitude.toFixed(5)}
              </Text>
            </View>
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>RECOMMENDED LANDMARKS</Text>
              <Text style={styles.sectionTitle}>10 สถานที่น่าสนใจ</Text>
            </View>
            <Text style={styles.listHint}>แตะเพื่อดูพิกัด</Text>
          </View>
        </View>
      }
      renderItem={({ item, index }) => {
        const selected = item.id === selectedPoi.id;

        return (
          <Pressable
            accessibilityHint="แสดงตำแหน่งสถานที่นี้บนแผนที่"
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => selectPoi(item)}
            style={({ pressed }) => [
              styles.poiCard,
              selected && styles.poiCardSelected,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.index, selected && styles.indexSelected]}>
              <Text style={[styles.indexText, selected && styles.indexTextSelected]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
            <View style={[styles.poiIcon, selected && styles.poiIconSelected]}>
              <Text style={styles.poiIconText}>{item.icon}</Text>
            </View>
            <View style={styles.poiCopy}>
              <Text style={[styles.poiName, selected && styles.poiNameSelected]}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={[styles.poiMeta, selected && styles.poiMetaSelected]}>
                {item.category} · {item.address}
              </Text>
            </View>
            <View style={[styles.chevronBubble, selected && styles.chevronBubbleSelected]}>
              <Text style={[styles.chevron, selected && styles.chevronSelected]}>
                {selected ? '✓' : '›'}
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
    paddingBottom: 40,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.navy,
    padding: 22,
    marginTop: 8,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 9,
  },
  orbitLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    top: -90,
    right: -60,
    borderRadius: 110,
    borderWidth: 32,
    borderColor: 'rgba(229,169,60,0.14)',
  },
  orbitSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    bottom: -40,
    left: 110,
    borderRadius: 50,
    backgroundColor: 'rgba(13,110,84,0.3)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(229,169,60,0.2)',
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandEmoji: {
    fontSize: 26,
  },
  brandEyebrow: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  heroBadge: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeNumber: {
    color: colors.gold,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
  heroBadgeText: {
    color: '#E0EDE8',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 36,
    fontWeight: '900',
    marginTop: 22,
  },
  heroSubtitle: {
    maxWidth: 320,
    color: '#C5D8D3',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  heroChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  heroChipGold: {
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroChipGoldText: {
    color: colors.navy,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  heroChipDark: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 8,
  },
  heroChipDarkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  mapSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionEyebrow: {
    color: colors.emerald,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#D1EAE2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 2,
  },
  liveDot: {
    color: colors.emerald,
    fontSize: 8,
    marginRight: 5,
  },
  liveText: {
    color: colors.emerald,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  selectedCard: {
    borderRadius: 24,
    borderWidth: 1,
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
  selectedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.surfaceWarm,
  },
  selectedIconText: {
    fontSize: 24,
  },
  selectedCopy: {
    flex: 1,
    marginLeft: 12,
  },
  selectedCategory: {
    color: colors.emerald,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  selectedName: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  selectedMark: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.gold,
    marginLeft: 8,
  },
  selectedMarkText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
  },
  selectedAddress: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 12,
  },
  selectedDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  coordinateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    backgroundColor: '#E7F0ED',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
  },
  coordinateLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coordinates: {
    color: colors.emeraldDark,
    fontSize: 10,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  listHint: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 3,
  },
  poiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 10,
  },
  poiCardSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.navy,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  index: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E8F1ED',
  },
  indexSelected: {
    backgroundColor: colors.gold,
  },
  indexText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },
  indexTextSelected: {
    color: colors.navy,
  },
  poiIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceWarm,
    marginLeft: 8,
  },
  poiIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  poiIconText: {
    fontSize: 20,
  },
  poiCopy: {
    flex: 1,
    marginLeft: 10,
  },
  poiName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  poiNameSelected: {
    color: '#FFFFFF',
  },
  poiMeta: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  poiMetaSelected: {
    color: '#C5D8D3',
  },
  chevronBubble: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#EBF3F0',
    marginLeft: 8,
  },
  chevronBubbleSelected: {
    backgroundColor: colors.gold,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 19,
  },
  chevronSelected: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
