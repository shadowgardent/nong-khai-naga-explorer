import { useState, useCallback } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { pointsOfInterest } from '../data/pointsOfInterest';
import { initialTrips } from '../data/initialTrips';
import { takePhotoWithCamera, pickPhotoFromGallery } from '../services/cameraService';
import { scheduleTripReminder, cancelTripReminder } from '../services/notificationService';
import { colors } from '../theme/colors';
import type { TripItem, TripPhoto } from '../types/trip';
import type { PointOfInterest } from '../types/poi';

type TripPlannerTabProps = {
  onSelectPoi: (poiId: string) => void;
  onOpenTestPanel: () => void;
};

const TIME_OPTIONS = [
  { label: '⚡ 1 นาที (ทดสอบด่วน)', minutes: 1 },
  { label: '⏱️ 5 นาที', minutes: 5 },
  { label: '⏱️ 15 นาที', minutes: 15 },
  { label: '⏱️ 30 นาที', minutes: 30 },
  { label: '⏱️ 1 ชั่วโมง', minutes: 60 },
];

export function TripPlannerTab({ onSelectPoi, onOpenTestPanel }: TripPlannerTabProps) {
  const [trips, setTrips] = useState<TripItem[]>(initialTrips);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest>(pointsOfInterest[0]);
  const [poiModalVisible, setPoiModalVisible] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(1);
  const [tripNote, setTripNote] = useState<string>('ถ่ายรูปเช็คอิน & ชมวิว');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal สำหรับส่องดูรูปเต็มจอ
  const [viewingPhotoUri, setViewingPhotoUri] = useState<string | null>(null);

  // -------------------------------------------------------------
  // เพิ่มจุดหมายใหม่เข้าทริป & ตั้งเวลาเตือน
  // -------------------------------------------------------------
  const handleAddTripItem = useCallback(async () => {
    if (!selectedPoi) return;
    setIsSubmitting(true);

    try {
      const tripId = `trip-${selectedPoi.id}-${Date.now()}`;
      const triggerTime = Date.now() + selectedMinutes * 60 * 1000;
      const scheduledIso = new Date(triggerTime).toISOString();

      // บันทึกสถานะตั้งเตือนใน Notification Service
      const reminderId = await scheduleTripReminder(
        tripId,
        selectedPoi.name,
        triggerTime,
        tripNote,
        () => {
          // Callback เมื่อถึงเวลาเตือน เปลี่ยนสถานะทริปเป็น 'arrived'
          setTrips((prev) =>
            prev.map((t) => (t.id === tripId ? { ...t, status: 'arrived' } : t))
          );
        }
      );

      const newTrip: TripItem = {
        id: tripId,
        poiId: selectedPoi.id,
        poiName: selectedPoi.name,
        district: selectedPoi.district,
        icon: selectedPoi.icon,
        scheduledTime: scheduledIso,
        minutesDelay: selectedMinutes,
        note: tripNote,
        reminderId,
        status: 'scheduled',
        photos: [],
        latitude: selectedPoi.latitude,
        longitude: selectedPoi.longitude,
        createdAt: new Date().toISOString(),
      };

      setTrips((prev) => [newTrip, ...prev]);
      Alert.alert(
        '🔔 ตั้งทริปสำเร็จ!',
        `ระบบจะแจ้งเตือนเมื่อถึงเวลาเดินทางไป "${selectedPoi.name}" ในอีก ${selectedMinutes} นาที`,
        [{ text: 'ตกลง' }]
      );
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตั้งการแจ้งเตือนทริปได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPoi, selectedMinutes, tripNote]);

  // -------------------------------------------------------------
  // ถ่ายรูปด้วยกล้องสำหรับจุดหมายในทริป
  // -------------------------------------------------------------
  const handleTakePhoto = useCallback(async (tripId: string) => {
    try {
      const photoUri = await takePhotoWithCamera();
      if (photoUri) {
        const newPhoto: TripPhoto = {
          id: `photo-${Date.now()}`,
          uri: photoUri,
          createdAt: new Date().toISOString(),
        };

        setTrips((prev) =>
          prev.map((trip) => {
            if (trip.id === tripId) {
              return {
                ...trip,
                status: 'completed',
                photos: [newPhoto, ...trip.photos],
              };
            }
            return trip;
          })
        );

        Alert.alert('📸 ถ่ายรูปสำเร็จ!', 'บันทึกภาพถ่ายเช็คอินจุดหมายนี้เรียบร้อยแล้ว');
      }
    } catch (error: any) {
      if (error?.message === 'camera-permission-denied') {
        Alert.alert('ต้องการสิทธิ์การใช้กล้อง', 'โปรดอนุญาตสิทธิ์ใช้งานกล้องถ่ายรูปในการตั้งค่าเครื่อง');
      } else {
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดกล้องถ่ายรูปได้');
      }
    }
  }, []);

  // -------------------------------------------------------------
  // เลือกรูปจาก Photo Library
  // -------------------------------------------------------------
  const handlePickPhoto = useCallback(async (tripId: string) => {
    try {
      const photoUri = await pickPhotoFromGallery();
      if (photoUri) {
        const newPhoto: TripPhoto = {
          id: `photo-${Date.now()}`,
          uri: photoUri,
          createdAt: new Date().toISOString(),
        };

        setTrips((prev) =>
          prev.map((trip) => {
            if (trip.id === tripId) {
              return {
                ...trip,
                status: 'completed',
                photos: [newPhoto, ...trip.photos],
              };
            }
            return trip;
          })
        );
      }
    } catch (error: any) {
      if (error?.message === 'library-permission-denied') {
        Alert.alert('ต้องการสิทธิ์คลังภาพ', 'โปรดอนุญาตสิทธิ์เข้าถึงคลังภาพในการตั้งค่าเครื่อง');
      }
    }
  }, []);

  // -------------------------------------------------------------
  // ลบทริป / ยกเลิกการตั้งเตือน
  // -------------------------------------------------------------
  const handleDeleteTrip = useCallback((tripId: string, poiName: string) => {
    Alert.alert('ยืนยันการลบทริป', `คุณต้องการลบ "${poiName}" ออกจากทริปใช่หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await cancelTripReminder(tripId);
          setTrips((prev) => prev.filter((t) => t.id !== tripId));
        },
      },
    ]);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Banner หัวข้อจัดทริป */}
      <View style={styles.headerCard}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerIcon}>🧭</Text>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>วางแผนทริป & ตั้งเวลาเตือน</Text>
            <Text style={styles.headerSubtitle}>
              เลือกสถานที่ กำหนดเวลา พอถึงเวลาจะแจ้งเตือนพร้อมถ่ายรูปเช็คอิน! 📸
            </Text>
          </View>
        </View>

        {/* ฟอร์มจัดทริป */}
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>1. เลือกสถานที่ท่องเที่ยวหนองคาย</Text>
          <Pressable
            accessibilityLabel="เลือกสถานที่ท่องเที่ยว"
            onPress={() => setPoiModalVisible(true)}
            style={styles.poiSelector}
          >
            <Text style={styles.poiSelectorIcon}>{selectedPoi.icon}</Text>
            <View style={styles.poiSelectorInfo}>
              <Text style={styles.poiSelectorName}>{selectedPoi.name}</Text>
              <Text style={styles.poiSelectorDistrict}>{selectedPoi.district}</Text>
            </View>
            <Text style={styles.poiSelectorArrow}>▼</Text>
          </Pressable>

          <Text style={styles.inputLabel}>2. กำหนดเวลาเดินทางไปถึง (นับจากตอนนี้)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
            {TIME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.minutes}
                onPress={() => setSelectedMinutes(opt.minutes)}
                style={[
                  styles.timeChip,
                  selectedMinutes === opt.minutes && styles.timeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    selectedMinutes === opt.minutes && styles.timeChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>3. บันทึกกิจกรรมที่ตั้งใจทำ</Text>
          <TextInput
            onChangeText={setTripNote}
            placeholder="เช่น ถ่ายรูปกับพญานาค, นมัสการพระใส..."
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
            value={tripNote}
          />

          <Pressable
            accessibilityLabel="เพิ่มจุดหมายเข้าทริปและตั้งเตือน"
            disabled={isSubmitting}
            onPress={handleAddTripItem}
            style={[styles.addButton, isSubmitting && styles.addButtonDisabled]}
          >
            <Text style={styles.addButtonIcon}>🔔</Text>
            <Text style={styles.addButtonText}>
              {isSubmitting ? 'กำลังตั้งเตือน...' : 'เพิ่มจุดหมายเข้าทริป & ตั้งเตือน'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* รายการจุดหมายในทริป */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📍 แผนการเดินทางของคุณ ({trips.length} จุดหมาย)</Text>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีจุดหมายในทริป</Text>
          <Text style={styles.emptySubtitle}>
            เลือกสถานที่และกำหนดเวลาด้านบน เพื่อเริ่มวางแผนทริปท่องเที่ยวหนองคาย
          </Text>
        </View>
      ) : (
        trips.map((trip, idx) => {
          const scheduledTimeFormatted = new Date(trip.scheduledTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripCardHeader}>
                <View style={styles.tripIconWrap}>
                  <Text style={styles.tripIcon}>{trip.icon}</Text>
                </View>
                <View style={styles.tripHeaderInfo}>
                  <Text style={styles.tripName}>{trip.poiName}</Text>
                  <Text style={styles.tripMeta}>
                    {trip.district} • เวลาเตือน {scheduledTimeFormatted} น.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="ลบทริปนี้"
                  onPress={() => handleDeleteTrip(trip.id, trip.poiName)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </Pressable>
              </View>

              {/* Status Badge */}
              <View style={styles.statusRow}>
                {trip.status === 'arrived' ? (
                  <View style={[styles.statusBadge, styles.statusArrived]}>
                    <Text style={styles.statusTextArrived}>🔔 ถึงเวลาแล้ว! ได้เวลาออกเดินทาง</Text>
                  </View>
                ) : trip.status === 'completed' ? (
                  <View style={[styles.statusBadge, styles.statusCompleted]}>
                    <Text style={styles.statusTextCompleted}>✅ ไปมาแล้ว (เช็คอินสำเร็จ)</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.statusScheduled]}>
                    <Text style={styles.statusTextScheduled}>
                      ⏳ ตั้งเตือนไว้แล้ว (อีกประมาณ {trip.minutesDelay} นาที)
                    </Text>
                  </View>
                )}
              </View>

              {/* Note */}
              {trip.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>📝 {trip.note}</Text>
                </View>
              ) : null}

              {/* Photos Gallery attached to trip stop */}
              {trip.photos.length > 0 && (
                <View style={styles.photosSection}>
                  <Text style={styles.photosTitle}>
                    📸 ภาพถ่ายเช็คอิน ({trip.photos.length} รูป)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                    {trip.photos.map((photo) => (
                      <Pressable key={photo.id} onPress={() => setViewingPhotoUri(photo.uri)}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <Pressable
                  accessibilityLabel="ถ่ายรูปด้วยกล้อง"
                  onPress={() => handleTakePhoto(trip.id)}
                  style={styles.cameraButton}
                >
                  <Text style={styles.actionIcon}>📸</Text>
                  <Text style={styles.cameraButtonText}>ถ่ายรูปเช็คอิน</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="เลือกรูปจากคลัง"
                  onPress={() => handlePickPhoto(trip.id)}
                  style={styles.galleryButton}
                >
                  <Text style={styles.actionIcon}>🖼️</Text>
                  <Text style={styles.galleryButtonText}>คลังภาพ</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="นำทางบนแผนที่"
                  onPress={() => onSelectPoi(trip.poiId)}
                  style={styles.mapButton}
                >
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={styles.mapButtonText}>นำทาง</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      {/* Modal สำหรับเลือก POI 10 แห่ง */}
      <Modal visible={poiModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกสถานที่ท่องเที่ยว (10 แลนด์มาร์ก)</Text>
              <Pressable onPress={() => setPoiModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll}>
              {pointsOfInterest.map((poi) => (
                <Pressable
                  key={poi.id}
                  onPress={() => {
                    setSelectedPoi(poi);
                    setPoiModalVisible(false);
                  }}
                  style={[
                    styles.poiOptionItem,
                    selectedPoi.id === poi.id && styles.poiOptionActive,
                  ]}
                >
                  <Text style={styles.poiOptionIcon}>{poi.icon}</Text>
                  <View style={styles.poiOptionInfo}>
                    <Text style={styles.poiOptionName}>{poi.name}</Text>
                    <Text style={styles.poiOptionSub}>{poi.district} • {poi.category}</Text>
                  </View>
                  {selectedPoi.id === poi.id && <Text style={styles.checkIcon}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Photo Viewer Modal */}
      <Modal visible={!!viewingPhotoUri} transparent animationType="fade">
        <View style={styles.fullPhotoOverlay}>
          <Pressable onPress={() => setViewingPhotoUri(null)} style={styles.fullPhotoClose}>
            <Text style={styles.fullPhotoCloseText}>✕ ปิด</Text>
          </Pressable>
          {viewingPhotoUri && (
            <Image source={{ uri: viewingPhotoUri }} style={styles.fullPhotoImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  formContainer: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
    marginTop: 8,
  },
  poiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  poiSelectorIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  poiSelectorInfo: {
    flex: 1,
  },
  poiSelectorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  poiSelectorDistrict: {
    fontSize: 11,
    color: colors.textMuted,
  },
  poiSelectorArrow: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 8,
  },
  timeScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    elevation: 2,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tripIcon: {
    fontSize: 22,
  },
  tripHeaderInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  tripMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
  },
  deleteIcon: {
    fontSize: 16,
  },
  statusRow: {
    marginTop: 10,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusScheduled: {
    backgroundColor: 'rgba(232, 169, 56, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 169, 56, 0.4)',
  },
  statusTextScheduled: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldDark,
  },
  statusArrived: {
    backgroundColor: 'rgba(224, 90, 56, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 90, 56, 0.4)',
  },
  statusTextArrived: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.coral,
  },
  statusCompleted: {
    backgroundColor: 'rgba(14, 143, 117, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(14, 143, 117, 0.4)',
  },
  statusTextCompleted: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },
  noteBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: colors.text,
    fontStyle: 'italic',
  },
  photosSection: {
    marginTop: 10,
  },
  photosTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  cameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  galleryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
  },
  galleryButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  mapButton: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 8,
  },
  mapButtonText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modalScroll: {
    marginBottom: 16,
  },
  poiOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: colors.surfaceMuted,
  },
  poiOptionActive: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  poiOptionIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  poiOptionInfo: {
    flex: 1,
  },
  poiOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  poiOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  fullPhotoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhotoClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullPhotoCloseText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  fullPhotoImage: {
    width: '94%',
    height: '80%',
  },
});
