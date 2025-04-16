import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import * as Device from 'expo-device';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

type AuthContextType = {
  user: User | null;
  deviceInfo: {
    platform: string;
    model: string;
  };
  phoneInfo: {
    phoneNumber: string;
    countryCode: string;
  } | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  requestPermissions: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  deviceInfo: {
    platform: Platform.OS,
    model: 'Unknown Device'
  },
  phoneInfo: null,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  loading: true,
  error: null,
  clearError: () => {},
  requestPermissions: async () => false,
});

// This hook will protect the route access based on user authentication
function useProtectedRoute(user: User | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to the sign-in page if not authenticated
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the sign-in page if authenticated
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({
    platform: Platform.OS,
    model: 'Unknown Device'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<{
    phoneNumber: string;
    countryCode: string;
  } | null>(null);
  const router = useRouter();
  
  useProtectedRoute(user, loading);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        ]);

        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      }

      // For iOS, permissions are handled through Info.plist
      return true;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      return false;
    }
  };

  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
          console.warn('Required permissions not granted');
          return;
        }

        const model = await Device.modelId || await Device.deviceName || 'Unknown Device';
        setDeviceInfo({
          platform: Platform.OS,
          model
        });
      } catch (error) {
        console.error('Error getting device info:', error);
      }
    };
    
    getDeviceInfo();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // Store user session
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));

        // Check if user exists in users collection
        const userRef = doc(FIREBASE_FIRESTORE, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        // Get user's groups
        const groupsQuery = query(
          collection(FIREBASE_FIRESTORE, 'groups'),
          where('members', 'array-contains', user.uid)
        );
        const groupsSnapshot = await getDocs(groupsQuery);
        const userGroups = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (!userDoc.exists()) {
          // Create new user document
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || '',
            phoneNumber: user.phoneNumber || '',
            photoURL: user.photoURL || '',
            createdAt: new Date(),
            lastLogin: new Date(),
            settings: {
              notifications: true,
              darkMode: false,
            },
            groups: userGroups,
            deviceInfo
          });
        } else {
          // Update existing user document
          await updateDoc(userRef, {
            email: user.email,
            displayName: user.displayName || '',
            phoneNumber: user.phoneNumber || '',
            photoURL: user.photoURL || '',
            lastLogin: new Date(),
            groups: userGroups,
            deviceInfo
          });
        }
      } else {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('deviceInfo');
      }
    });

    // Check for stored session on mount
    AsyncStorage.getItem('user').then((storedUser) => {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deviceInfo]);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Required permissions not granted');
      }

      const deviceInfo = {
        modelName: await Device.modelName || 'unknown',
        deviceName: await Device.deviceName || 'unknown',
        brand: await Device.brand || 'unknown',
        manufacturer: await Device.manufacturer || 'unknown',
        osName: await Device.osName || 'unknown',
        osVersion: await Device.osVersion || 'unknown',
        platformApiLevel: await Device.platformApiLevel || 'unknown'
      };

      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(FIREBASE_FIRESTORE, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        phoneNumber: deviceInfo.modelName,
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        lastLogin: new Date(),
        settings: {
          notifications: true,
          darkMode: false,
        },
        groups: [],
        deviceInfo
      });

      setUser(user);
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Required permissions not granted');
      }

      const deviceInfo = {
        modelName: await Device.modelName || 'unknown',
        deviceName: await Device.deviceName || 'unknown',
        brand: await Device.brand || 'unknown',
        manufacturer: await Device.manufacturer || 'unknown',
        osName: await Device.osName || 'unknown',
        osVersion: await Device.osVersion || 'unknown',
        platformApiLevel: await Device.platformApiLevel || 'unknown'
      };

      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      // Update user document in Firestore
      await updateDoc(doc(FIREBASE_FIRESTORE, 'users', user.uid), {
        lastLogin: new Date(),
        deviceInfo
      });

      setUser(user);
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const { serverAuthCode } = signInResult;
      const { accessToken } = await GoogleSignin.getTokens();

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(null, accessToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(FIREBASE_AUTH, googleCredential);
      setUser(userCredential.user);

      // Store user session
      await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));
      await AsyncStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));

      // Update or create user document in Firestore
      const userRef = doc(FIREBASE_FIRESTORE, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: new Date(),
          lastLogin: new Date(),
          deviceInfo,
        });
      } else {
        await updateDoc(userRef, {
          lastLogin: new Date(),
          deviceInfo,
        });
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setError('Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setError('Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Play services not available or outdated');
      } else {
        setError('Something went wrong with Google sign in');
        console.error('Google sign in error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(FIREBASE_AUTH);
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('deviceInfo');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const getPhoneInfo = async () => {
    try {
      if (Platform.OS === 'web') {
        setPhoneInfo({
          phoneNumber: '1234567890',
          countryCode: '+1'
        });
        return;
      }

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        console.warn('Required permissions not granted for phone info');
        return;
      }

      const deviceName = await Device.deviceName;
      const modelName = await Device.modelName;
      
      // Use a combination of device name and model as a unique identifier
      const deviceIdentifier = `${deviceName}-${modelName}`;
      
      if (deviceIdentifier) {
        setPhoneInfo({
          phoneNumber: deviceIdentifier,
          countryCode: '+1' // Default to +1 since we can't reliably get country code
        });
      }
    } catch (err) {
      console.error('Error getting phone info:', err);
      setPhoneInfo({
        phoneNumber: 'unknown',
        countryCode: '+1'
      });
    }
  };

  useEffect(() => {
    if (user) {
      getPhoneInfo();
    } else {
      setPhoneInfo(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        deviceInfo,
        phoneInfo,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        loading,
        error,
        clearError: () => setError(null),
        requestPermissions,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);