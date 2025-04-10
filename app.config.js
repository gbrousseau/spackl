export default {
  expo: {
    name: 'Spackl',
    slug: 'spackl',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'spackl',
    userInterfaceStyle: 'automatic',
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png',
          color: '#0891b2',
          sounds: ['./assets/sounds/notification.wav'],
        },
      ],
    ],
    notification: {
      icon: './assets/images/notification-icon.png',
      color: '#0891b2',
      iosDisplayInForeground: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hamhammer.spackle',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      package: 'com.hammer.spacklapp',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#0891b2',
      },
      permissions: ['NOTIFICATIONS', 'VIBRATE'],
    },
  },
};