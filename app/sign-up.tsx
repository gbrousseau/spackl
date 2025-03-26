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

export default function SignUpScreen() {
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

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await auth().createUserWithEmailAndPassword(email, password);
      router.replace('/');
    } catch (err) {
      console.error('Sign-up Error:', err);
      setError('Failed to sign up. Please try again.');
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
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
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
          Create Account
        </Text>
        <Text style={[styles.subtitle, theme === 'dark' && styles.textMuted]}>
          Sign up to get started
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
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={handleGoogleSignIn}>
            <Text
              style={[styles.linkText, theme === 'dark' && styles.textMuted]}
            >
              Sign Up with Google
            </Text>
          </Pressable>

          <Pressable
            style={styles.linkButton}
            onPress={() => router.push('/sign-in')}
          >
            <Text
              style={[styles.linkText, theme === 'dark' && styles.textMuted]}
            >
              Already have an account? Sign in
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
