export default {
  expo: {
    scheme: 'spackl',
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID?.split('.').reverse().join('.'),
        }
      ],
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
          android: {
            compileSdkVersion: 33,
            targetSdkVersion: 33,
            googleServicesFile: './google-services.json',
          },
        },
      ],
    ],
    android: {
      package: 'com.spackl.app',
      googleServicesFile: './google-services.json',
      permissions: ['android.permission.INTERNET'],
    },
    ios: {
      bundleIdentifier: 'com.spackl.app',
      googleServicesFile: './GoogleService-Info.plist',
      config: {
        googleSignIn: {
          reservedClientId: process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID,
        },
      },
    },
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      eas: {
        projectId: 'your-project-id',
      },
    },
  }
};