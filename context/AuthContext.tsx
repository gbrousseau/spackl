import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserType, events } from '@/types/userType';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '@/firebaseConfig';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  signOut,
  signInWithGoogle as googleSignIn,
} from '@/services/auth';
import { router } from 'expo-router';
import { Alert } from 'react-native/Libraries/Alert/Alert';

const auth = FIREBASE_AUTH;
const usersCollection = collection(FIREBASE_FIRESTORE, 'users');
const eventsCollection = collection(FIREBASE_FIRESTORE, 'events');
const [authUser, setAuthUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [userData, setUserData] = useState<UserType | null>(null);
const [userEvents, setUserEvents] = useState<events[] | null>(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    try {
      setAuthUser(user);
      setLoading(false);

      if (user) {
        const userDocRef = doc(usersCollection, user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userDataFromDB = userDocSnap.data() as UserType;
          setUserData(userDataFromDB);
        } else {
          const newUserData: UserType = {
            email: user.email || "",
            id: user.uid || "",
            firstName: "",
            lastName: "",
            profilePic_url: "",
            subscription: "",
            type: "user",
          };

          try {
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create user profile';
            setError(errorMessage);
            Alert.alert(
              'Profile Setup Error',
              'There was an error setting up your profile. Please try again or contact support.',
              [
                {
                  text: 'Try Again',
                  onPress: () => router.replace('/(auth)')
                }
              ]
            );
          }
        }
      } else {
        setUserData(null);
        setUserEvents([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      Alert.alert(
        'Authentication Error',
        'There was a problem with the authentication process. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)')
          }
        ]
      );
    }
  });

  return unsubscribe;
}, []);
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => { },
  signUp: async () => { },
  signOut: async () => { },
  signInWithGoogle: async () => { },
  clearError: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signIn(email, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      setError(null);
      await signUp(email, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut();
      router.replace('/welcome' as any);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign out');
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await googleSignIn();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to sign in with Google',
      );
      throw error;
    }
  };

  const clearError = () => setError(null);

  if (loading) {
    return null; // or a loading spinner component
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        signInWithGoogle: handleGoogleSignIn,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

async function signIn(email: string, password: string) {
  const auth = getAuth();
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}
async function signUp(email: string, password: string) {
  const auth = getAuth();
  return (await createUserWithEmailAndPassword(auth, email, password)).user;
}

