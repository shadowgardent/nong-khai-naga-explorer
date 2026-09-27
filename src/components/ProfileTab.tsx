import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

type ProfileTabProps = {
  onOpenTestPanel?: () => void;
};

export function ProfileTab({ onOpenTestPanel }: ProfileTabProps) {
  // ข้อมูลนักศึกษา
  const studentInfo = {
    name: 'นายนวพรหม ภูผาผิว',
    studentId: '663450040-2',
    major: 'วิทยาการคอมพิวเตอร์และสารสนเทศ',
    faculty: 'คณะสหวิทยาการ (มหาวิทยาลัยขอนแก่น วิทยาเขตหนองคาย)',
    university: 'Khon Kaen University',
    email: 'nawaprom.p@kkumail.com',
    githubUsername: 'shadowgardent',
    githubUrl: 'https://github.com/shadowgardent',
    // ดึงรูป Avatar จาก GitHub ของ shadowgardent
    avatarUrl: 'https://github.com/shadowgardent.png',
  };

  const handleOpenEmail = () => {
    const url = `mailto:${studentInfo.email}?subject=ติดต่อจากแอป%20Nong%20Khai%20Naga%20Explorer`;
    Linking.openURL(url).catch(() => {
      Alert.alert('เปิดอีเมลไม่สำเร็จ', `สามารถส่งอีเมลมาที่: ${studentInfo.email}`);
    });
  };

  const handleOpenGitHub = () => {
    Linking.openURL(studentInfo.githubUrl).catch(() => {
      Alert.alert('เปิดลิงก์ไม่สำเร็จ', `URL: ${studentInfo.githubUrl}`);
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      {/* Hero Header Section */}
      <View style={styles.heroCard}>
        <View style={styles.heroBackgroundPattern} />
        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>🎓 DEVELOPER PROFILE</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>KKU CIS · 2026</Text>
          </View>
        </View>

        {/* Avatar Image with Gold border */}
        <View style={styles.avatarWrapper}>
          <Image
            accessibilityLabel={`รูปโปรไฟล์ของ ${studentInfo.name}`}
            defaultSource={require('../../assets/nong-khai-naga-icon.png')}
            source={{ uri: studentInfo.avatarUrl }}
            style={styles.avatarImage}
          />
          <View style={styles.avatarIconBadge}>
            <Text style={styles.avatarIconText}>💻</Text>
          </View>
        </View>

        {/* Name and Student ID */}
        <Text style={styles.studentName}>{studentInfo.name}</Text>
        <Text style={styles.studentIdLabel}>รหัสนักศึกษา: {studentInfo.studentId}</Text>
        <Text style={styles.studentMajor}>{studentInfo.major}</Text>
        <Text style={styles.studentFaculty}>{studentInfo.faculty}</Text>
      </View>

      {/* Contact & Social Links Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>📫 ช่องทางติดต่อ & โซเชียลมีเดีย</Text>

        {/* Email Button */}
        <Pressable
          accessibilityLabel={`ส่งอีเมลถึง ${studentInfo.email}`}
          accessibilityRole="button"
          onPress={handleOpenEmail}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.contactEmoji}>✉️</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactType}>อีเมลนักศึกษา (KKU Mail)</Text>
            <Text numberOfLines={1} style={styles.contactValue}>
              {studentInfo.email}
            </Text>
          </View>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>ส่งเมล ↗</Text>
          </View>
        </Pressable>

        {/* GitHub Button */}
        <Pressable
          accessibilityLabel="เปิดโปรไฟล์ GitHub shadowgardent"
          accessibilityRole="button"
          onPress={handleOpenGitHub}
          style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: '#E2E8F0' }]}>
            <Text style={styles.contactEmoji}>🐙</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactType}>GitHub Profile</Text>
            <Text numberOfLines={1} style={styles.contactValue}>
              github.com/{studentInfo.githubUsername}
            </Text>
          </View>
          <View style={[styles.actionPill, styles.actionPillDark]}>
            <Text style={styles.actionPillTextDark}>เปิดดู ↗</Text>
          </View>
        </Pressable>
      </View>

      {/* Project & Education Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>📖 ข้อมูลโครงงาน & รายวิชา</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>วิชา:</Text>
          <Text style={styles.infoValueText}>Mobile Application Development</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>แอปพลิเคชัน:</Text>
          <Text style={styles.infoValueText}>Nong Khai Naga Explorer (หนองคาย)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>เทคโนโลยี:</Text>
          <Text style={styles.infoValueText}>React Native, Expo SDK 57, TypeScript</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>สถานะระบบ:</Text>
          <Text style={[styles.infoValueText, { color: colors.emerald, fontWeight: '800' }]}>
            ● พร้อมส่งตรวจ (Lab Evaluation Ready)
          </Text>
        </View>

        {onOpenTestPanel && (
          <Pressable
            accessibilityLabel="เปิดแผงทดสอบแล็บ"
            accessibilityRole="button"
            onPress={onOpenTestPanel}
            style={({ pressed }) => [styles.testPanelButton, pressed && styles.pressed]}
          >
            <Text style={styles.testPanelButtonText}>🧪 เปิดแผงทดสอบและรายงานแล็บ 11 →</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.footerCopyright}>
        © 2026 {studentInfo.name} · KKU Computer Science & IT
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroBackgroundPattern: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(229, 169, 60, 0.08)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  roleBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    color: '#D2DFDB',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3.5,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceWarm,
  },
  avatarIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIconText: {
    fontSize: 14,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  studentIdLabel: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  studentMajor: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  studentFaculty: {
    color: '#A7C4BC',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.navy,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    marginBottom: 10,
  },
  contactIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactEmoji: {
    fontSize: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactType: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: '800',
  },
  actionPill: {
    backgroundColor: 'rgba(224, 90, 56, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionPillText: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: '800',
  },
  actionPillDark: {
    backgroundColor: 'rgba(11, 51, 43, 0.1)',
  },
  actionPillTextDark: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    width: 95,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  infoValueText: {
    flex: 1,
    fontSize: 12,
    color: colors.navy,
    fontWeight: '600',
  },
  testPanelButton: {
    marginTop: 14,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  testPanelButtonText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '800',
  },
  footerCopyright: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
