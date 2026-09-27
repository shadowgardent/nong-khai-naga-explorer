import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { colors } from '../theme/colors';
import type { PointOfInterest } from '../types/poi';

type PoiMapProps = {
  poi: PointOfInterest;
};

const createLeafletHtml = (initialPoi: PointOfInterest, zoom = 15) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #E2EFEA; }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      background: #0B332B;
      border: 3px solid #E5A93C;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0,0,0,0.38);
      font-size: 20px;
      line-height: 42px;
      text-align: center;
    }
    .leaflet-popup-content-wrapper {
      background: #0B332B;
      color: #FFFFFF;
      border-radius: 14px;
      border: 1.5px solid #E5A93C;
      box-shadow: 0 6px 18px rgba(0,0,0,0.4);
      padding: 4px 6px;
    }
    .leaflet-popup-tip {
      background: #0B332B;
      border: 1.5px solid #E5A93C;
    }
    .popup-title {
      font-weight: 800;
      font-size: 13px;
      color: #E5A93C;
      margin-bottom: 2px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .user-location-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #0284C7;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(2, 132, 199, 0.35);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.6); }
      70% { box-shadow: 0 0 0 12px rgba(2, 132, 199, 0); }
      100% { box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${initialPoi.latitude}, ${initialPoi.longitude}], ${zoom});

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    var userMarker = null;

    var marker = L.marker([${initialPoi.latitude}, ${initialPoi.longitude}], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<span>' + ${JSON.stringify(initialPoi.icon)} + '</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -22]
      })
    }).addTo(map);

    marker.bindPopup('<div class="popup-title">' + ${JSON.stringify(initialPoi.name)} + '</div><div class="popup-address">' + ${JSON.stringify(initialPoi.address)} + '</div>').openPopup();

    window.updatePoi = function(lat, lng, name, address, icon) {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
      marker.setLatLng([lat, lng]);
      marker.setIcon(L.divIcon({
        className: 'custom-marker',
        html: '<span>' + icon + '</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -22]
      }));
      marker.bindPopup('<div class="popup-title">' + name + '</div><div class="popup-address">' + address + '</div>').openPopup();
    };

    window.updateUserGps = function(lat, lng) {
      if (!userMarker) {
        userMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'user-location-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);
        userMarker.bindPopup('<div class="popup-title" style="color:#0284C7">📍 ตำแหน่งของคุณ</div><div class="popup-address">พิกัด GPS ปัจจุบัน</div>');
      } else {
        userMarker.setLatLng([lat, lng]);
      }
      map.flyTo([lat, lng], 16, { duration: 1.0 });
      userMarker.openPopup();
    };
  </script>
</body>
</html>
`;

export function PoiMap({ poi }: PoiMapProps) {
  const webViewRef = useRef<WebView>(null);
  const fullWebViewRef = useRef<WebView>(null);
  const [isFullMapVisible, setFullMapVisible] = useState(false);

  // HTML เริ่มต้นสร้างเพียงครั้งแรก จากนั้นสั่ง animate ด้วย JavaScript injection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialHtml = useMemo(() => createLeafletHtml(poi, 15), []);
  const fullHtml = useMemo(() => createLeafletHtml(poi, 15), [poi.id]);

  useEffect(() => {
    const script = `
      if (window.updatePoi) {
        window.updatePoi(${poi.latitude}, ${poi.longitude}, ${JSON.stringify(poi.name)}, ${JSON.stringify(poi.address)}, ${JSON.stringify(poi.icon)});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
    if (isFullMapVisible) {
      fullWebViewRef.current?.injectJavaScript(script);
    }
  }, [poi.id, poi.latitude, poi.longitude, isFullMapVisible]);

  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // -------------------------------------------------------------
  // ขอสิทธิ์และดึงตำแหน่ง GPS ปัจจุบันของผู้ใช้งาน
  // -------------------------------------------------------------
  const locateUserGps = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องการสิทธิ์ระบุตำแหน่ง (GPS)',
          'กรุณาเปิดการอนุญาตใช้งานตำแหน่ง (Location Permission) ในการตั้งค่าเครื่อง'
        );
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setUserCoords({ latitude, longitude });

      const script = `
        if (window.updateUserGps) {
          window.updateUserGps(${latitude}, ${longitude});
        }
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullWebViewRef.current?.injectJavaScript(script);

      Alert.alert(
        '📍 ระบุตำแหน่ง GPS สำเร็จ!',
        `พิกัดของคุณ: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}\nแผนที่ได้เลื่อนไปแสดงตำแหน่งของคุณเรียบร้อยแล้ว`
      );
    } catch (err: any) {
      Alert.alert(
        'ไม่สามารถระบุพิกัดได้',
        'กรุณาตรวจสอบว่าเปิด GPS บนอุปกรณ์แล้วหรือไม่'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const centerFullMap = () => {
    const script = `
      if (window.updatePoi) {
        window.updatePoi(${poi.latitude}, ${poi.longitude}, ${JSON.stringify(poi.name)}, ${JSON.stringify(poi.address)}, ${JSON.stringify(poi.icon)});
      }
      true;
    `;
    fullWebViewRef.current?.injectJavaScript(script);
  };

  return (
    <>
      <View style={styles.frame}>
        <WebView
          ref={webViewRef}
          domStorageEnabled
          javaScriptEnabled
          originWhitelist={['*']}
          scalesPageToFit={false}
          scrollEnabled={false}
          source={{ html: initialHtml }}
          style={styles.map}
        />

        <View pointerEvents="none" style={styles.mapLabel}>
          <Text style={styles.mapLabelEyebrow}>NONG KHAI LANDMARK</Text>
          <Text numberOfLines={1} style={styles.mapLabelName}>
            {poi.icon} {poi.name}
          </Text>
        </View>

        <View style={styles.mapActionsRow}>
          <Pressable
            accessibilityLabel="ระบุตำแหน่งพิกัด GPS ของฉัน"
            accessibilityRole="button"
            onPress={locateUserGps}
            style={({ pressed }) => [styles.gpsLocationButton, pressed && styles.pressed]}
          >
            {isLocating ? (
              <ActivityIndicator color={colors.navy} size="small" />
            ) : (
              <>
                <Text style={styles.gpsIconText}>🎯</Text>
                <Text style={styles.gpsText}>ตำแหน่งฉัน</Text>
              </>
            )}
          </Pressable>

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
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setFullMapVisible(false)}
        presentationStyle="fullScreen"
        visible={isFullMapVisible}
      >
        <View style={styles.fullscreen}>
          <WebView
            ref={fullWebViewRef}
            domStorageEnabled
            javaScriptEnabled
            originWhitelist={['*']}
            scalesPageToFit={false}
            scrollEnabled={false}
            source={{ html: fullHtml }}
            style={styles.map}
          />

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
                accessibilityLabel="ระบุตำแหน่งพิกัด GPS ของฉัน"
                accessibilityRole="button"
                onPress={locateUserGps}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed, { marginRight: 6 }]}
              >
                {isLocating ? (
                  <ActivityIndicator color={colors.gold} size="small" />
                ) : (
                  <Text style={styles.centerIcon}>🎯</Text>
                )}
              </Pressable>

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
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
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
  mapActionsRow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsIconText: {
    fontSize: 13,
  },
  gpsText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.gold,
    paddingHorizontal: 11,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  expandIcon: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
  },
  expandText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
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
