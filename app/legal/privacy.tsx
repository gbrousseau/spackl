import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicy() {
  const { isDark } = useTheme();

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.textLight]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, isDark && styles.textMuted]}>Last Updated: February 15, 2024</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>1. Introduction</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>2. Information We Collect</Text>
          <Text style={[styles.subheading, isDark && styles.textLight]}>2.1. Personal Data</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We collect information that you provide directly to us:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Account information (name, email address, password)
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Profile information (profile picture, bio)
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Communication data (messages, feedback)
          </Text>

          <Text style={[styles.subheading, isDark && styles.textLight]}>2.2. Usage Data</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We automatically collect certain information when you visit, use, or navigate the service:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Device information (device type, operating system)
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Log data (IP address, browser type, pages visited)
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Usage patterns and preferences
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>3. How We Use Your Information</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We use the information we collect for various purposes:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • To provide and maintain our service
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • To notify you about changes to our service
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • To provide customer support
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • To detect, prevent, and address technical issues
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>4. Data Sharing and Disclosure</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We may share your information with:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Service providers who assist in our operations
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Law enforcement when required by law
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Other users with your consent
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>5. Your Data Protection Rights</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            Under GDPR and CCPA, you have the following rights:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Right to access your personal data
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Right to rectification of inaccurate data
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Right to erasure ("right to be forgotten")
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Right to restrict processing
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • Right to data portability
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>6. Cookie Policy</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.
          </Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>7. Data Security</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We implement appropriate technical and organizational security measures to protect your personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>8. Children's Privacy</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            Our service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>9. Changes to This Privacy Policy</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>10. Contact Us</Text>
          <Text style={[styles.paragraph, isDark && styles.textLight]}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • By email: privacy@example.com
          </Text>
          <Text style={[styles.listItem, isDark && styles.textLight]}>
            • By visiting our contact page: https://example.com/contact
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
  subheading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
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