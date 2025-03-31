import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, GoogleSignin } from '@/config/firebase';
import { useTheme } from '@/context/ThemeContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auth().signInWithEmailAndPassword(email, password);
      router.replace('/');
    } catch (err) {
      console.error('Sign-in Error:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signIn();
      // Get the users ID token and access token
      // This is required for Firebase authentication
      // You can also use the ID token if you want to authenticate with Firebase
      // but the access token is recommended
      // because it contains the user's profile information
      // and is used to authenticate with Firebase
      const { accessToken } = await GoogleSignin.getTokens();
      // Check if the access token is valid
      if (!accessToken) {
        setError('Failed to get access token. Please try again.');
        return;
      }
      // Get the user's profile information
      const userInfo = await GoogleSignin.getCurrentUser();
      if (!userInfo) {
        setError('Failed to get user information. Please try again.');
        return;
      }
      // Check if the user is already signed in
      const user = auth().currentUser;
      if (user) {
        // User is already signed in, no need to sign in again
        router.replace('/');
        return;
      }
      // Check if the user is already signed in with Google
      const googleUser = await auth().signInWithCredential(
        auth.GoogleAuthProvider.credential(userInfo.idToken),
      );
      if (googleUser) {
        // User is already signed in with Google, no need to sign in again
        router.replace('/');
        return;
      }
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(accessToken);

      // If the user is not signed in, sign in with the credential
      // This will create a new user in Firebase with the user's profile information
      // and sign in the user
      await auth().signInWithCredential(googleCredential);
      // User is signed in, navigate to the home screen
      router.replace('/');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
      <View style={styles.content}>
        <Text style={[styles.title, theme === 'dark' && styles.textLight]}>
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, theme === 'dark' && styles.textMuted]}>
          Sign in to continue
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, theme === 'dark' && styles.inputDark]}
            placeholder="Email"
            placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#64748b'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, theme === 'dark' && styles.inputDark]}
            placeholder="Password"
            placeholderTextColor={theme === 'dark' ? '#94a3b8' : '#64748b'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={handleGoogleSignIn}>
            <Text
              style={[styles.linkText, theme === 'dark' && styles.textMuted]}
            >
              Sign In with Google
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/sign-up')}
            style={styles.linkButton}
          >
            <Text
              style={[styles.linkText, theme === 'dark' && styles.textMuted]}
            >
              Don&apos;t have an account? Sign up
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  inputDark: {
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
  },
  button: {
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
});
