import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {
  Callout,
  MapMarker,
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import { colors } from '../theme/colors';
import type { PointOfInterest } from '../types/poi';

type PoiMapProps = {
  poi: PointOfInterest;
};

const MAP_DELTA = 0.015;

const regionFor = (poi: PointOfInterest, delta = MAP_DELTA) => ({
  latitude: poi.latitude,
  longitude: poi.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export function PoiMap({ poi }: PoiMapProps) {
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<MapMarker>(null);
  const fullMapRef = useRef<MapView>(null);
  const [isFullMapVisible, setFullMapVisible] = useState(false);

  useEffect(() => {
    mapRef.current?.animateToRegion(regionFor(poi), 550);

    const timer = setTimeout(() => markerRef.current?.showCallout(), 650);
    return () => clearTimeout(timer);
  }, [poi.id, poi.latitude, poi.longitude]);

  const centerFullMap = () => {
    fullMapRef.current?.animateToRegion(regionFor(poi, 0.01), 450);
  };

  return (
    <>
      <View style={styles.frame}>
        <MapView
          ref={mapRef}
          initialRegion={regionFor(poi)}
          loadingEnabled
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsCompass
          style={styles.map}
        >
          <Marker
            key={poi.id}
            ref={markerRef}
            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
            pinColor={colors.pin}
            title={poi.name}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{poi.name}</Text>
                <Text style={styles.calloutAddress}>{poi.address}</Text>
              </View>
            </Callout>
          </Marker>
        </MapView>

        <View pointerEvents="none" style={styles.mapLabel}>
          <Text style={styles.mapLabelEyebrow}>NONG KHAI LANDMARK</Text>
          <Text numberOfLines={1} style={styles.mapLabelName}>
            {poi.icon} {poi.name}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="เปิดแผนที่แบบเต็มหน้าจอ"
          accessibilityRole="button"
          onPress={() => setFullMapVisible(true)}
          style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
        >
          <Text style={styles.expandIcon}>⛶</Text>
          <Text style={styles.expandText}>ขยายแผนที่</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setFullMapVisible(false)}
        presentationStyle="fullScreen"
        visible={isFullMapVisible}
      >
        <View style={styles.fullscreen}>
          <MapView
            ref={fullMapRef}
            initialRegion={regionFor(poi, 0.01)}
            loadingEnabled
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            showsBuildings
            showsCompass
            showsScale
            style={StyleSheet.absoluteFillObject}
          >
            <Marker
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              description={poi.address}
              pinColor={colors.pin}
              title={poi.name}
            />
          </MapView>

          <SafeAreaView pointerEvents="box-none" style={styles.fullOverlay}>
            <View style={styles.fullTopBar}>
              <Pressable
                accessibilityLabel="ปิดแผนที่เต็มหน้าจอ"
                accessibilityRole="button"
                onPress={() => setFullMapVisible(false)}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>

              <View style={styles.fullTitleWrap}>
                <Text style={styles.fullEyebrow}>NONG KHAI · POI</Text>
                <Text numberOfLines={1} style={styles.fullTitle}>
                  {poi.name}
                </Text>
              </View>

              <Pressable
                accessibilityLabel="เลื่อนแผนที่กลับไปที่หมุด"
                accessibilityRole="button"
                onPress={centerFullMap}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <Text style={styles.centerIcon}>◎</Text>
              </Pressable>
            </View>

            <View style={styles.fullBottomCard}>
              <View style={styles.fullIcon}>
                <Text style={styles.fullIconText}>{poi.icon}</Text>
              </View>
              <View style={styles.fullCopy}>
                <Text style={styles.fullCategory}>{poi.category}</Text>
                <Text style={styles.fullName}>{poi.name}</Text>
                <Text numberOfLines={2} style={styles.fullAddress}>
                  {poi.address}
                </Text>
                <Text style={styles.fullCoordinates}>
                  {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 320,
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceWarm,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 7,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLabel: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(11, 51, 43, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 120,
  },
  mapLabelEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  mapLabelName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  expandButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  expandIcon: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '900',
  },
  expandText: {
    color: colors.navy,
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
  },
  callout: {
    width: 210,
    paddingVertical: 3,
  },
  calloutTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  calloutAddress: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  fullOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  fullTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  circleButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.navy,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },
  centerIcon: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
  },
  fullTitleWrap: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 8,
  },
  fullEyebrow: {
    color: colors.emerald,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fullTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  fullBottomCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(11,51,43,0.95)',
    padding: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 7,
  },
  fullIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.gold,
  },
  fullIconText: {
    fontSize: 26,
  },
  fullCopy: {
    flex: 1,
    marginLeft: 12,
  },
  fullCategory: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 2,
  },
  fullAddress: {
    color: '#D2DFDB',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  fullCoordinates: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },
});
