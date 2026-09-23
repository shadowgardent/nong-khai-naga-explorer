import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;

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
      [
        'expo-splash-screen',
        {
          image: './assets/nong-khai-naga-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#0B332B',
        },
      ],
      ...(androidMapsApiKey
        ? [
            [
              'react-native-maps',
              {
                androidGoogleMapsApiKey: androidMapsApiKey,
              },
            ] as [string, any],
          ]
        : []),
    ],
    ios: {
      icon: './assets/nong-khai-naga-icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.nongkhai.explorer',
    },
    android: {
      package: 'com.nongkhai.explorer',
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: './assets/nong-khai-naga-icon.png',
        backgroundColor: '#0B332B',
      },
      ...(androidMapsApiKey
        ? {
            config: {
              googleMaps: {
                apiKey: androidMapsApiKey,
              },
            },
          }
        : {}),
    },
    web: {
      favicon: './assets/nong-khai-naga-icon.png',
    },
  };
};
