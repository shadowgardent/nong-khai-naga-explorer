import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Nong Khai Naga Explorer',
    slug: 'nong-khai-poi',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/nong-khai-naga-icon.png',
    userInterfaceStyle: 'light',
    plugins: [
      'expo-status-bar',
      'expo-camera',
      'expo-image-picker',
      'expo-notifications',
      'expo-location',
      [
        'expo-splash-screen',
        {
          image: './assets/nong-khai-naga-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#0B332B',
        },
      ],
    ],
    ios: {
      icon: './assets/nong-khai-naga-icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.nongkhai.explorer',
    },
    android: {
      package: 'com.nongkhai.explorer',
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
      adaptiveIcon: {
        foregroundImage: './assets/nong-khai-naga-icon.png',
        backgroundColor: '#0B332B',
      },
    },
    web: {
      favicon: './assets/nong-khai-naga-icon.png',
    },
  };
};
