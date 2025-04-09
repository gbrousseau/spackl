
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { FirebaseError } from '@firebase/util';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
if (GoogleSignin) {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
}
const db = firestore();
const authentication = auth();
export async function signInWithEmail(email: string, password: string) {
  try {
    await authentication.signInWithEmailAndPassword(email, password);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to sign in');
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    await authentication.createUserWithEmailAndPassword(email, password);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to sign up');
  }
}
export async function getCurrentUser() {
  try {
    return authentication.currentUser;
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get current user');
  }
}

export async function updateUserProfile(displayName: string, photoURL: string) {
  try {
    const user = authentication.currentUser;
    if (user) {
      await user.updateProfile({
        displayName,
        photoURL,
      });
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to update user profile');
  }
}

export async function updateUserData(uid: string, data: any) {
  try {
    await db.collection('users').doc(uid).set(data, { merge: true });
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to update user data');
  }
}
export async function getUserProfile(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data();
    } else {
      throw new Error('User profile not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user profile');
  }
}
export async function getUserEmail(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.email) {
        return userData.email;
      } else {
        throw new Error('Email not found in user data');
      }
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user email');
  }
}
export async function getUserName(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.displayName) { // Check for displayName
        return userData.displayName;
      } else {
        throw new Error('Display name not found in user data');
      }
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user name');
  }
}
export async function getUserPhotoURL(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.photoURL) { // Check for photoURL
        return userData.photoURL;
      } else {
        throw new Error('Photo URL not found in user data');
      }
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user photo URL');
  }
}
export async function getUserId(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.uid) { // Check for uid
        return userData.uid;
      } else {
        throw new Error('User ID not found in user data');
      }
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user ID');
  }
}
export async function getUserPhoneNumber(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.phoneNumber) { // Check for phoneNumber
        return userData.phoneNumber;
      } else {
        throw new Error('Phone number not found in user data');
      }
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user phone number');
  }
}
export async function getUserAddress(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData && userData.address) { // Check for address
        return userData.address;
      } else {
        throw new Error('Address not found in user data');
      }
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user address');
  }
}

export async function getUserData(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data();
    } else {
      throw new Error('User data not found');
    }
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to get user data');
  }
}
export async function signOut() {
  try {
    await authentication.signOut();
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to sign out');
  }
}

export async function resetPassword(email: string) {
  try {
    await authentication.sendPasswordResetEmail(email);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to send password reset email');
  }
}

export async function signInWithGoogle() {
  try {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider(); // Use 'new' to instantiate
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      // Add the required scopes for Google Calendar
      provider.addScope('https://www.googleapis.com/auth/calendar');
      const credential = GoogleAuthProvider.credential();
      return await authentication.signInWithCredential(credential as unknown as any);
    } else if (Platform.OS === 'android') {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Get the user's ID token
      const signInResponse = await GoogleSignin.signIn();
      const idToken = await (await GoogleSignin.getTokens()).idToken; // Retrieve idToken using getTokens method
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await authentication.signInWithCredential(googleCredential);
    } else if (Platform.OS === 'ios') {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // Get the user's ID token
      const signInResponse = await GoogleSignin.signIn();
      const idToken = await (await GoogleSignin.getTokens()).idToken; // Retrieve idToken using getTokens method
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await authentication.signInWithCredential(googleCredential);
    } else {
      // Get the user's ID token
      await GoogleSignin.hasPlayServices();
      const signInResponse = await GoogleSignin.signIn();
      const idToken = await (await GoogleSignin.getTokens()).idToken; // Retrieve idToken using getTokens method
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await authentication.signInWithCredential(googleCredential);
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}
