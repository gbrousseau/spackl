import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const router = useRouter();
  const { signIn } = useAuth();
  const { isDark } = useTheme();

  const [_, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const handleEmailLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate email format
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }

      // Validate password
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      await signIn(email, password);
      setLoginAttempts(0); // Reset attempts on successful login
    } catch (err: any) {
      setLoginAttempts(prev => prev + 1);
      
      // Handle specific Firebase Auth errors
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email. Please check your email or sign up.');
          break;
        case 'auth/wrong-password':
          setError(`Incorrect password. ${loginAttempts >= 2 ? 'Consider resetting your password.' : ''}`);
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later or reset your password.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success' && result.authentication) {
        await signIn('google-token', result.authentication.accessToken);
      }
    } catch (err) {
      setError('Google sign in failed. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleContactSupport = () => {
    // You can customize this URL to your support page
    const supportEmail = 'support@example.com';
    const subject = 'Login Support Request';
    const body = `I'm having trouble logging in to my account.\n\nEmail: ${email}\nError: ${error}`;
    
    if (Platform.OS === 'web') {
      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      // For mobile, you might want to use Linking.openURL
      router.push(`mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2264&auto=format&fit=crop' }}
          style={styles.headerImage}
        />
        <View style={[styles.overlay, isDark && styles.overlayDark]} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>
      </View>

      <ScrollView 
        style={[styles.scrollView, isDark && styles.scrollViewDark]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.form, isDark && styles.formDark]}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              {loginAttempts >= 3 && (
                <View style={styles.errorActions}>
                  <Pressable onPress={handleForgotPassword} style={styles.errorActionButton}>
                    <Text style={styles.errorActionButtonText}>Reset Password</Text>
                  </Pressable>
                  <Pressable onPress={handleContactSupport} style={styles.errorActionButton}>
                    <Text style={styles.errorActionButtonText}>Contact Support</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.textLight]}>Email</Text>
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Mail size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                style={[styles.input, isDark && styles.textLight]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.textLight]}>Password</Text>
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Lock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                style={[styles.input, isDark && styles.textLight]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                placeholder="Enter your password"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!loading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                ) : (
                  <Eye size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.forgotPassword]}
            onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
            <Text style={[styles.dividerText, isDark && styles.textLight]}>or</Text>
            <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
          </View>

          <Pressable
            style={[styles.googleButton, isDark && styles.googleButtonDark]}
            onPress={handleGoogleLogin}
            disabled={!_}>
            <Image
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
              style={styles.googleIcon}
            />
            <Text style={[styles.googleButtonText, isDark && styles.textLight]}>
              Continue with Google
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, isDark && styles.textLight]}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    height: 240,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  overlayDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#e2e8f0',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewDark: {
    backgroundColor: '#1e293b',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  form: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  formDark: {
    backgroundColor: '#1e293b',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#ef4444',
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  errorActionButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorActionButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#ef4444',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#0891b2',
  },
  button: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerLineDark: {
    backgroundColor: '#334155',
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  googleButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginRight: 4,
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0891b2',
  },
  textLight: {
    color: '#f8fafc',
  },
});