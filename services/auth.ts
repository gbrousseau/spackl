import { auth } from '@/config/firebase';
import { FirebaseError } from '@firebase/util';
import { Platform } from 'react-native';
import { GoogleSignin } from '@/config/firebase';

export async function signInWithEmail(email: string, password: string) {
  try {
    await auth().signInWithEmailAndPassword(email, password);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to sign in');
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    await auth().createUserWithEmailAndPassword(email, password);
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to sign up');
  }
}

export async function signOut() {
  try {
    await auth().signOut();
  } catch (err) {
    if (err instanceof FirebaseError) {
      throw new Error(err.message);
    }
    throw new Error('Failed to sign out');
  }
}

export async function resetPassword(email: string) {
  try {
    await auth().sendPasswordResetEmail(email);
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
      const provider = auth.GoogleAuthProvider;
      provider.addScope('https://www.googleapis.com/auth/calendar');
      return await auth().signInWithPopup(provider);
    } else {
      // Get the users ID token
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      return await auth().signInWithCredential(googleCredential);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}
