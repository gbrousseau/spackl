import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import {
  Bell,
  CircleHelp as HelpCircle,
  LogOut,
  Moon,
  Shield,
  Sun,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useContext, useState } from 'react';
import { NotificationContext } from '@/context/NotificationContext';
import { testFirebaseConnection } from '@/utils/firebaseTest';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const runFirebaseTest = async () => {
    try {
      const result = await testFirebaseConnection();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(
        `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  const { notificationPermission } = useContext(NotificationContext);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.textLight]}>Settings</Text>
        <Text style={[styles.subtitle, isDark && styles.textMuted]}>
          Customize your experience
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Appearance
            </Text>
          </View>

          <Pressable
            style={[styles.settingItem, isDark && styles.settingItemDark]}
          >
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={24} color="#94a3b8" />
              ) : (
                <Sun size={24} color="#64748b" />
              )}
              <Text style={[styles.settingText, isDark && styles.textLight]}>
                Dark Mode
              </Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </Pressable>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Notifications
            </Text>
          </View>

          <Pressable
            style={[styles.settingItem, isDark && styles.settingItemDark]}
          >
            <View style={styles.settingLeft}>
              <Bell size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.settingText, isDark && styles.textLight]}>
                Push Notifications
              </Text>
            </View>
            <Switch value={true} />
          </Pressable>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Security
            </Text>
          </View>

          <Pressable
            style={[styles.settingItem, isDark && styles.settingItemDark]}
          >
            <View style={styles.settingLeft}>
              <Shield size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.settingText, isDark && styles.textLight]}>
                Privacy Settings
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Help & Support
            </Text>
          </View>

          <Pressable
            style={[styles.settingItem, isDark && styles.settingItemDark]}
          >
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.settingText, isDark && styles.textLight]}>
                FAQ & Support
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          style={[styles.signOutButton, isDark && styles.signOutButtonDark]}
          onPress={handleSignOut}
        >
          <LogOut size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
          <Text style={[styles.signOutText, isDark && styles.textLight]}>
            Sign Out
          </Text>
        </Pressable>
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionDark: {
    backgroundColor: '#1e293b',
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  settingItemDark: {
    backgroundColor: '#1e293b',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  signOutButtonDark: {
    backgroundColor: '#1e293b',
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
  notSupportedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    marginLeft: 20,
    fontStyle: 'italic',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  logoutButtonDark: {
    backgroundColor: '#450a0a',
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 8,
  },
  testResult: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#0f172a',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
});
