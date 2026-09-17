import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import {
  addNotificationBannerListener,
  emitNotificationResponse,
  type Notification,
} from '../services/notificationService';

export function NotificationBanner() {
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 44;
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissBanner = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setActiveNotification(null);
    });
  }, [slideAnim]);

  useEffect(() => {
    const sub = addNotificationBannerListener((notification) => {
      setActiveNotification(notification);

      // เลื่อน Banner ลงมาจากขอบบนจอ
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 6,
      }).start();

      // ปิดอัตโนมัติหลังจาก 7 วินาที
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      dismissTimeoutRef.current = setTimeout(() => {
        dismissBanner();
      }, 7000);
    });

    return () => {
      sub.remove();
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [slideAnim, dismissBanner]);

  const handleBannerPress = useCallback(() => {
    if (!activeNotification) return;
    const notif = activeNotification;
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    dismissBanner();
    emitNotificationResponse(notif);
  }, [activeNotification, dismissBanner]);

  if (!activeNotification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topInset,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Pressable
        accessibilityLabel="แตะเพื่อเปิดรายละเอียดกิจกรรม"
        accessibilityRole="button"
        onPress={handleBannerPress}
        style={({ pressed }) => [styles.bannerInner, pressed && styles.bannerPressed]}
      >
        <View style={styles.topRow}>
          <View style={styles.appIdentity}>
            <Text style={styles.appIcon}>🐉</Text>
            <Text style={styles.appName}>NONG KHAI EXPLORER</Text>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.channelBadge}>การเตือนกิจกรรม</Text>
          </View>
          <Pressable
            accessibilityLabel="ปิดการแจ้งเตือน"
            hitSlop={8}
            onPress={dismissBanner}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {activeNotification.request.content.title}
        </Text>
        <Text numberOfLines={2} style={styles.body}>
          {activeNotification.request.content.body}
        </Text>

        <View style={styles.actionHintRow}>
          <Text style={styles.actionHint}>📍 แตะเพื่อเปิดดูรายละเอียดกิจกรรม (Deep Link)</Text>
          <Text style={styles.chevron}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    elevation: 10,
  },
  bannerInner: {
    backgroundColor: colors.surfaceDark ?? '#0B332B',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  appName: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bullet: {
    color: colors.goldLight,
    marginHorizontal: 5,
    fontSize: 10,
  },
  channelBadge: {
    color: '#E0F2FE',
    fontSize: 9,
    fontWeight: '600',
    backgroundColor: 'rgba(56,189,248,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  closeBtn: {
    padding: 2,
  },
  closeBtnText: {
    color: colors.surfaceWarm,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  body: {
    color: colors.surfaceWarm,
    fontSize: 12,
    lineHeight: 17,
  },
  actionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  actionHint: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '800',
  },
});
