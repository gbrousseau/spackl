import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User, Phone, Check } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

type ValidationErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  phone?: string;
  terms?: string;
};

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { isDark } = useTheme();

  const [_, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    if (!formData.password) return 0;
    let strength = 0;
    if (formData.password.length >= 8) strength++;
    if (/[A-Z]/.test(formData.password)) strength++;
    if (/[a-z]/.test(formData.password)) strength++;
    if (/\d/.test(formData.password)) strength++;
    if (/[!@#$%^&*]/.test(formData.password)) strength++;
    return (strength / 5) * 100;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        formData.email,
        formData.password
      );

      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      // Sign in the user
      await signIn('dummy-token');
      router.replace('/(tabs)');
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific Firebase Auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or sign in.';
          setErrors(prev => ({ ...prev, email: errorMessage }));
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          setErrors(prev => ({ ...prev, email: errorMessage }));
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password registration is not enabled. Please contact support.';
          setErrors(prev => ({ ...prev, email: errorMessage }));
          break;
        case 'auth/weak-password':
          errorMessage = 'Please choose a stronger password.';
          setErrors(prev => ({ ...prev, password: errorMessage }));
          break;
        default:
          setErrors(prev => ({ ...prev, email: errorMessage }));
      }
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        await signIn('google-token');
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Google sign up error:', err);
      setErrors({ email: 'Google sign up failed. Please try again.' });
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?q=80&w=3270&auto=format&fit=crop' }}
          style={styles.headerImage}
        />
        <View style={[styles.overlay, isDark && styles.overlayDark]} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us today</Text>
        </View>
      </View>

      <View style={[styles.form, isDark && styles.formDark]}>
        <View style={styles.nameRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, isDark && styles.textLight]}>First Name *</Text>
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <User size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                style={[styles.input, isDark && styles.textLight]}
                value={formData.firstName}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, firstName: text }));
                  if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
                }}
                placeholder="John"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                autoComplete="given-name"
              />
            </View>
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, isDark && styles.textLight]}>Last Name *</Text>
            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <User size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <TextInput
                style={[styles.input, isDark && styles.textLight]}
                value={formData.lastName}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, lastName: text }));
                  if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
                }}
                placeholder="Doe"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                autoComplete="family-name"
              />
            </View>
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Email *</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Mail size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="john.doe@example.com"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Username (optional)</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <User size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={formData.username}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, username: text }));
                if (errors.username) setErrors(prev => ({ ...prev, username: undefined }));
              }}
              placeholder="johndoe"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              autoCapitalize="none"
              autoComplete="username"
            />
          </View>
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Phone Number (optional)</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Phone size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={formData.phone}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, phone: text }));
                if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
              }}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Password *</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Lock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={formData.password}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, password: text }));
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              ) : (
                <Eye size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              )}
            </Pressable>
          </View>
          {formData.password && (
            <View style={styles.passwordStrength}>
              <View style={[styles.strengthBar, { width: `${passwordStrength}%` }]} />
              <Text style={[styles.strengthText, isDark && styles.textMuted]}>
                Password strength: {passwordStrength < 40 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
              </Text>
            </View>
          )}
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.textLight]}>Confirm Password *</Text>
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <Lock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.input, isDark && styles.textLight]}
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, confirmPassword: text }));
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirm your password"
              placeholderTextColor={isDark ?'#94a3b8' : '#64748b'}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              ) : (
                <Eye size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              )}
            </Pressable>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <Pressable
          style={styles.termsContainer}
          onPress={() => setAcceptedTerms(!acceptedTerms)}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && <Check size={16} color="#ffffff" />}
          </View>
          <View style={styles.termsTextContainer}>
            <Text style={[styles.termsText, isDark && styles.textLight]}>
              I accept the{' '}
              <Text style={styles.link} onPress={() => router.push('/legal/terms')}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.link} onPress={() => router.push('/legal/privacy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </Pressable>
        {errors.terms && (
          <Text style={styles.errorText}>{errors.terms}</Text>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
          <Text style={[styles.dividerText, isDark && styles.textLight]}>or</Text>
          <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
        </View>

        <Pressable
          style={[styles.googleButton, isDark && styles.googleButtonDark]}
          onPress={handleGoogleSignUp}
          disabled={!_}>
          <Image
            source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
            style={styles.googleIcon}
          />
          <Text style={[styles.googleButtonText, isDark && styles.textLight]}>
            Sign up with Google
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDark && styles.textLight]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
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
  nameRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
  passwordStrength: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#0891b2',
    borderRadius: 2,
    marginBottom: 4,
  },
  strengthText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  termsTextContainer: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  link: {
    color: '#0891b2',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
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
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0891b2',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
});