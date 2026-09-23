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
import { TripPlannerTab } from './src/components/TripPlannerTab';
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

type MainTab = 'landmarks' | 'planner' | 'events';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('planner'); // ตั้งทริปเป็นหน้าแรกให้เห็นระบบจัดทริปใหม่ได้ทันที
  const [targetPoiId, setTargetPoiId] = useState<string | null>(null);

  // Lab 11 Event Routing State (/events/[id])
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);

  // -------------------------------------------------------------
  // Observer ใน Root Layout ตามข้อกำหนด Lab 11 & Trip Notifications
  // -------------------------------------------------------------
  useEffect(() => {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const initialResponse = getLastNotificationResponse();
    if (initialResponse) {
      const data = initialResponse.notification.request.content.data;
      if (data?.type === 'trip' && data.poiId) {
        setTargetPoiId(data.poiId);
        setActiveTab('landmarks');
      } else {
        const eventId = openEventFromResponse(initialResponse);
        if (eventId) {
          setTargetEventId(eventId);
          setEventModalVisible(true);
        }
      }
      clearLastNotificationResponse();
    }

    const subscription = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'trip' && data.poiId) {
        setTargetPoiId(data.poiId);
        setActiveTab('landmarks');
      } else {
        const eventId = openEventFromResponse(response);
        if (eventId) {
          setTargetEventId(eventId);
          setEventModalVisible(true);
        }
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

  const handleSelectPoiFromEventOrTrip = useCallback((poiId: string) => {
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
          ) : activeTab === 'planner' ? (
            <TripPlannerTab
              onOpenTestPanel={() => setTestModalVisible(true)}
              onSelectPoi={handleSelectPoiFromEventOrTrip}
            />
          ) : (
            <EventListTab
              onOpenEventDetail={handleOpenEventDetail}
              onOpenTestPanel={() => setTestModalVisible(true)}
              onSelectPoi={handleSelectPoiFromEventOrTrip}
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
            accessibilityLabel="หน้าจัดทริปและถ่ายรูป"
            accessibilityRole="tab"
            onPress={() => setActiveTab('planner')}
            style={[styles.navItem, activeTab === 'planner' && styles.navItemActive]}
          >
            <Text style={styles.navIcon}>🧭</Text>
            <Text style={[styles.navText, activeTab === 'planner' && styles.navTextActive]}>
              จัดทริป & กล้อง
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
              กิจกรรม
            </Text>
          </Pressable>

          <Pressable
            accessibilityLabel="เปิดแผงทดสอบแล็บ 11"
            accessibilityRole="button"
            onPress={() => setTestModalVisible(true)}
            style={styles.navItemTest}
          >
            <Text style={styles.navIcon}>🧪</Text>
            <Text style={styles.navTextTest}>ตรวจแล็บ</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Dynamic Route: /events/[id] Detail Modal (including 404 Fallback) */}
      <EventDetailModal
        eventId={targetEventId}
        onClose={handleCloseEventDetail}
        onSelectPoi={handleSelectPoiFromEventOrTrip}
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 48 : 46, // เพิ่มระยะห่างด้านล่างสำหรับ Android เป็น 46px ตามที่ต้องการ
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(13, 110, 84, 0.1)',
  },
  navItemTest: {
    flex: 0.85,
    alignItems: 'center',
    paddingVertical: 6,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  navTextTest: {
    fontSize: 10,
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
