import { useState, useEffect, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { PoiExplorerScreen } from './src/screens/PoiExplorerScreen';
import { EventListTab } from './src/components/EventListTab';
import { EventDetailModal } from './src/components/EventDetailModal';
import { Lab11TestModal } from './src/components/Lab11TestModal';
import { NotificationBanner } from './src/components/NotificationBanner';
import { colors } from './src/theme/colors';
import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
  openEventFromResponse,
  setNotificationHandler,
} from './src/services/notificationService';

type MainTab = 'landmarks' | 'events';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('landmarks');
  const [targetPoiId, setTargetPoiId] = useState<string | null>(null);

  // Lab 11 Event Routing State (/events/[id])
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);

  // -------------------------------------------------------------
  // Observer ใน Root Layout ตามข้อกำหนด Lab 11
  // รองรับ Cold Start, Foreground, และ Background อย่างสมบูรณ์
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. กำหนดพฤติกรรม Foreground Notification Handler ตาม Lab 11
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // 2. รองรับ Cold Start: อ่าน notification ที่ใช้เปิดแอป
    const initialResponse = getLastNotificationResponse();
    if (initialResponse) {
      const eventId = openEventFromResponse(initialResponse);
      if (eventId) {
        setTargetEventId(eventId);
        setEventModalVisible(true);
      }
      clearLastNotificationResponse();
    }

    // 3. รองรับตอนแอปกำลังทำงาน (Foreground) หรือกลับจาก Background
    const subscription = addNotificationResponseReceivedListener((response) => {
      const eventId = openEventFromResponse(response);
      if (eventId) {
        setTargetEventId(eventId);
        setEventModalVisible(true);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleOpenEventDetail = useCallback((eventId: string) => {
    setTargetEventId(eventId);
    setEventModalVisible(true);
  }, []);

  const handleCloseEventDetail = useCallback(() => {
    setEventModalVisible(false);
    setTargetEventId(null);
  }, []);

  const handleSelectPoiFromEvent = useCallback((poiId: string) => {
    setTargetPoiId(poiId);
    setActiveTab('landmarks');
  }, []);

  const handleTriggerColdStartCheck = useCallback(() => {
    const initialResponse = getLastNotificationResponse();
    if (initialResponse) {
      const eventId = openEventFromResponse(initialResponse);
      if (eventId) {
        setTargetEventId(eventId);
        setEventModalVisible(true);
      }
      clearLastNotificationResponse();
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Heads-Up Notification Banner (Foreground notification) */}
      <NotificationBanner />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {activeTab === 'landmarks' ? (
            <PoiExplorerScreen
              notificationPoiId={targetPoiId}
              onHandledNotification={() => setTargetPoiId(null)}
            />
          ) : (
            <EventListTab
              onOpenEventDetail={handleOpenEventDetail}
              onOpenTestPanel={() => setTestModalVisible(true)}
              onSelectPoi={handleSelectPoiFromEvent}
            />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNav}>
          <Pressable
            accessibilityLabel="หน้าสำรวจ 10 แลนด์มาร์ก"
            accessibilityRole="tab"
            onPress={() => setActiveTab('landmarks')}
            style={[styles.navItem, activeTab === 'landmarks' && styles.navItemActive]}
          >
            <Text style={styles.navIcon}>🗺️</Text>
            <Text style={[styles.navText, activeTab === 'landmarks' && styles.navTextActive]}>
              10 แลนด์มาร์ก
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="หน้ากิจกรรมและแจ้งเตือน Lab 11"
            accessibilityRole="tab"
            onPress={() => setActiveTab('events')}
            style={[styles.navItem, activeTab === 'events' && styles.navItemActive]}
          >
            <View style={styles.eventIconWrap}>
              <Text style={styles.navIcon}>🎪</Text>
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>11</Text>
              </View>
            </View>
            <Text style={[styles.navText, activeTab === 'events' && styles.navTextActive]}>
              กิจกรรม & Lab 11
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="เปิดแผงทดสอบแล็บ 11"
            accessibilityRole="button"
            onPress={() => setTestModalVisible(true)}
            style={styles.navItemTest}
          >
            <Text style={styles.navIcon}>🧪</Text>
            <Text style={styles.navTextTest}>ตรวจผลแล็บ</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Dynamic Route: /events/[id] Detail Modal (including 404 Fallback) */}
      <EventDetailModal
        eventId={targetEventId}
        onClose={handleCloseEventDetail}
        onSelectPoi={handleSelectPoiFromEvent}
        visible={eventModalVisible}
      />

      {/* Lab 11 Verification & Deliverables Modal */}
      <Lab11TestModal
        onClose={() => setTestModalVisible(false)}
        onSimulateDeepLink={handleOpenEventDetail}
        onTriggerColdStart={handleTriggerColdStartCheck}
        visible={testModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(11, 79, 63, 0.08)',
  },
  navItemTest: {
    flex: 0.9,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 169, 56, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 169, 56, 0.4)',
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  navText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  navTextTest: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.goldDark,
  },
  eventIconWrap: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: -3,
    right: -10,
    backgroundColor: colors.coral,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
});
