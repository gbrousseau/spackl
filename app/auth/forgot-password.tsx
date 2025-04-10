import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, Send, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isDark } = useTheme();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus('loading');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError('Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setStatus('idle');
    setError(null);
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=3270&auto=format&fit=crop' }}
          style={styles.headerImage}
        />
        <View style={[styles.overlay, isDark && styles.overlayDark]} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
        </View>
      </View>

      <View style={[styles.content, isDark && styles.contentDark]}>
        {status === 'success' ? (
          <View style={styles.successContainer}>
            <CheckCircle2 size={64} color="#10b981" />
            <Text style={[styles.successTitle, isDark && styles.textLight]}>
              Check Your Email
            </Text>
            <Text style={[styles.successMessage, isDark && styles.textMuted]}>
              We've sent password reset instructions to {email}. Please check your inbox and follow the link to reset your password.
            </Text>
            <Pressable
              style={styles.backButton}
              onPress={handleBackToLogin}>
              <ArrowLeft size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </Pressable>
          </View>
        ) : status === 'error' ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={64} color="#ef4444" />
            <Text style={[styles.errorTitle, isDark && styles.textLight]}>
              Something Went Wrong
            </Text>
            <Text style={[styles.errorMessage, isDark && styles.textMuted]}>
              {error || 'Unable to send reset instructions. Please try again.'}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={handleTryAgain}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.textLight]}>Email Address</Text>
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
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!loading}
                  />
                </View>
                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </View>

              <Pressable
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <Text style={styles.submitButtonText}>Sending...</Text>
                ) : (
                  <>
                    <Send size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Send Reset Instructions</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={handleBackToLogin}
                disabled={loading}>
                <ArrowLeft size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.cancelButtonText, isDark && styles.textMuted]}>
                  Back to Login
                </Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, isDark && styles.textMuted]}>
                Remember your password?{' '}
                <Text style={styles.footerLink} onPress={handleBackToLogin}>
                  Sign in
                </Text>
              </Text>
            </View>
          </>
        )}
      </View>
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
    lineHeight: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  contentDark: {
    backgroundColor: '#1e293b',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
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
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cancelButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 12,
  },
  successMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginTop: 24,
    marginBottom: 12,
  },
  errorMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  footer: {
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
    color: '#0891b2',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
});