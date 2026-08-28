import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

  if (isProductionBuild && !androidMapsApiKey) {
    throw new Error(
      'Production build ต้องกำหนด GOOGLE_MAPS_ANDROID_API_KEY ใน EAS Environment Variables',
    );
  }

  return {
    ...config,
    name: 'Nong Khai Naga Explorer',
    slug: 'nong-khai-poi',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/khon-kaen-dino-icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/khon-kaen-dino-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0B332B',
    },
    ios: {
      icon: './assets/khon-kaen-dino-icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.nongkhai.explorer',
    },
    android: {
      package: 'com.nongkhai.explorer',
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: './assets/khon-kaen-dino-icon.png',
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
      favicon: './assets/khon-kaen-dino-favicon.png',
    },
  };
};
