import { FIREBASE_FIRESTORE, FIREBASE_AUTH } from '@/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const db = FIREBASE_FIRESTORE;
const auth = FIREBASE_AUTH;

export const testFirebaseConnection = async () => {
  try {
    // Test Firestore
    const testCollection = collection(db, 'test');
    const testDoc = await addDoc(testCollection, {
      message: 'Test connection',
      timestamp: new Date().toISOString(),
    });

    console.log('Test document written with ID:', testDoc.id);

    // Read the test collection
    const querySnapshot = await getDocs(testCollection);
    console.log(
      'Test collection read successful. Documents found:',
      querySnapshot.size,
    );

    // Test Authentication state
    const { currentUser } = auth;
    console.log(
      'Current auth state:',
      currentUser ? 'Authenticated' : 'Not authenticated',
    );

    return {
      success: true,
      message: 'Firebase connection test successful',
      details: {
        firestoreWrite: true,
        firestoreRead: true,
        authStateCheck: true,
      },
    };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      message: 'Firebase connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
