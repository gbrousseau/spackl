import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithCredential,
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useTheme } from '@/context/ThemeContext';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react-native';
import { GoogleSignin, type User } from '@react-native-google-signin/google-signin';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID, // from Google Cloud Console
  iosClientId: process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID, // from Google Cloud Console
});

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check if user is already authenticated
  if (auth.currentUser) {
    return <Redirect href="/(tabs)" />;
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // Native platforms
        await GoogleSignin.hasPlayServices();
        const signInResult = await GoogleSignin.signIn();
        const { accessToken } = await GoogleSignin.getTokens();
        const credential = GoogleAuthProvider.credential(null, accessToken);
        await signInWithCredential(auth, credential);
      }
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <View style={[styles.logoPlaceholder, isDark && styles.logoPlaceholderDark]}>
          <Text style={[styles.logoText, isDark && styles.textLight]}>Spackl</Text>
        </View>
        <Text style={[styles.title, isDark && styles.textLight]}>
          Welcome to Spackl
        </Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          {isSignUp ? 'Create an account to get started' : 'Sign in to continue'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Mail size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              placeholder="Email"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Lock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              placeholder="Password"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={handleEmailAuth}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              {isSignUp ? (
                <UserPlus size={20} color="#ffffff" />
              ) : (
                <LogIn size={20} color="#ffffff" />
              )}
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleAuth}
          disabled={isLoading}>
          <View style={styles.googleIconPlaceholder}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>
            Continue with Google
          </Text>
        </Pressable>

        <Pressable
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={[styles.switchButtonText, isDark && styles.textMuted]}>
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPlaceholderDark: {
    backgroundColor: '#0e7490',
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#0f172a',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#0891b2',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  googleIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  switchButton: {
    alignItems: 'center',
    padding: 8,
  },
  switchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#64748b',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    color: '#ef4444',
    fontSize: 14,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
}); 