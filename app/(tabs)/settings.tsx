import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Platform } from 'react-native';
import { Bell, Share, Lock, CircleHelp as HelpCircle, LogOut, Moon, Database } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useContext, useState } from 'react';
import { NotificationContext } from '@/context/NotificationContext';
import { testFirebaseConnection } from '@/utils/firebaseTest';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { isEnabled, toggleNotifications } = useContext(NotificationContext);
  const { signOut } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const runFirebaseTest = async () => {
    try {
      const result = await testFirebaseConnection();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Appearance</Text>
        <View style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Moon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e2e8f0', true: '#0891b2' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Notifications</Text>
        <View style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Bell size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Event Reminders</Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#e2e8f0', true: '#0891b2' }}
            thumbColor="#ffffff"
            disabled={Platform.OS === 'web'}
          />
        </View>
        {Platform.OS === 'web' && (
          <Text style={[styles.notSupportedText, isDark && styles.textMuted]}>
            Notifications are not supported in web browsers
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Calendar Settings</Text>
        <Pressable style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Share size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Default Sharing Preferences</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Lock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Privacy Settings</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Support</Text>
        <Pressable style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <HelpCircle size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Help & FAQ</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Developer</Text>
        <Pressable 
          style={[styles.settingItem, isDark && styles.settingItemDark]}
          onPress={runFirebaseTest}
        >
          <View style={styles.settingContent}>
            <Database size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Test Firebase Connection</Text>
          </View>
        </Pressable>
        {testResult && (
          <Text style={[styles.testResult, isDark && styles.textLight]}>
            {testResult}
          </Text>
        )}
      </View>

      <Pressable 
        style={[styles.logoutButton, isDark && styles.logoutButtonDark]}
        onPress={signOut}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 20,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingItemDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
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