import * as ImagePicker from 'expo-image-picker';

export type CapturedPhoto = {
  id: string;
  uri: string;
  createdAt: string;
  poiId?: string;
  poiName?: string;
};

/**
 * ขอสิทธิ์และเปิดกล้องถ่ายรูปด้วย Expo ImagePicker Camera API
 */
export async function takePhotoWithCamera(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('camera-permission-denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('[CameraService] takePhotoWithCamera error:', error);
    throw error;
  }
}

/**
 * ขอสิทธิ์และเลือกรูปภาพจาก Photo Library
 */
export async function pickPhotoFromGallery(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('library-permission-denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('[CameraService] pickPhotoFromGallery error:', error);
    throw error;
  }
}
