import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function TermsOfService() {
  const { isDark } = useTheme();

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.textLight]}>Terms of Service</Text>
        <Text style={[styles.lastUpdated, isDark && styles.textMuted]}>Last Updated: February 15, 2024</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>1. Agreement to Terms</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you do not have permission to access the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>2. User Accounts</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            2.1. You must be at least 13 years old to use this service.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            2.2. You are responsible for maintaining the security of your account and password. We cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            2.3. You are responsible for all content posted and activity that occurs under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>3. Acceptable Use</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            3.1. You may not use the service for any illegal purpose or to violate any laws in your jurisdiction.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            3.2. You may not use the service to transmit any malware, spyware, or other malicious code.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            3.3. You may not attempt to gain unauthorized access to any portion of the service or any other systems or networks connected to the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>4. Intellectual Property</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            4.1. The service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            4.2. You retain ownership of any content you submit, post, or display on or through the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>5. Limitation of Liability</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Your access to or use of or inability to access or use the service
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Any conduct or content of any third party on the service
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Any content obtained from the service
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Unauthorized access, use, or alteration of your transmissions or content
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>6. Termination</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            6.1. We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            6.2. Upon termination, your right to use the service will immediately cease.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>7. Changes to Terms</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>8. Contact Us</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            If you have any questions about these Terms, please contact us at legal@example.com.
          </Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    color: '#0f172a',
    marginBottom: 8,
  },
  lastUpdated: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 16,
  },
  paragraph: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
});