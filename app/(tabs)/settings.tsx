import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Platform, Modal, ActivityIndicator } from 'react-native';
import { Bell, Share, Lock, CircleHelp as HelpCircle, LogOut, Moon, Users, Clock, Calendar, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useContacts } from '@/context/ContactsContext';
import { useAuth } from '@/context/AuthContext';
import { SharedContactsService, SharedContact, SharingPermission, SharingDuration } from '@/services/SharedContactsService';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { isEnabled: notificationsEnabled, toggleNotifications } = useNotifications();
  const { saveSettings, getSettings, loading } = useUserSettings();
  const { contacts } = useContacts();
  const { signOut, user } = useAuth();
  
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [eventReminders, setEventReminders] = useState(false);
  const [calendarSharing, setCalendarSharing] = useState(false);
  const [sharedContacts, setSharedContacts] = useState<SharedContact[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    if (user?.uid) {
      loadSharedContacts();
    }
  }, [user?.uid]);

  const loadSharedContacts = async () => {
    try {
      const sharedContactsService = new SharedContactsService(user!.uid);
      const shared = await sharedContactsService.getSharedContacts();
      setSharedContacts(shared);
    } catch (err) {
      console.error('Error loading shared contacts:', err);
      setError('Failed to load shared contacts');
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      if (settings) {
        setEventReminders(settings.notifications?.eventReminders ?? false);
        setCalendarSharing(settings.privacy?.shareCalendar ?? false);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    }
  };

  const handleEventRemindersToggle = async () => {
    setSavingSettings(true);
    try {
      const newValue = !eventReminders;
      const success = await saveSettings({
        notifications: {
          enabled: notificationsEnabled,
          eventReminders: newValue,
          emailNotifications: false,
          pushNotifications: true,
        },
      });

      if (success) {
        setEventReminders(newValue);
      }
    } catch (err) {
      console.error('Error saving event reminders setting:', err);
      setError('Failed to update event reminders');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCalendarSharingToggle = async () => {
    setSavingSettings(true);
    try {
      const newValue = !calendarSharing;
      const success = await saveSettings({
        privacy: {
          shareCalendar: newValue,
          profileVisibility: 'contacts',
          showEmail: false,
        },
      });

      if (success) {
        setCalendarSharing(newValue);
        if (!newValue) {
          setSharedContacts([]);
        }
      }
    } catch (err) {
      console.error('Error saving calendar sharing setting:', err);
      setError('Failed to update calendar sharing');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleShareWithContact = async (
    contactId: string,
    permission: SharingPermission = 'view',
    duration: SharingDuration = 'permanent'
  ) => {
    if (!user?.uid) return;

    try {
      const sharedContactsService = new SharedContactsService(user.uid);
      const newSharedContact = await sharedContactsService.shareContact(
        contactId,
        permission,
        duration
      );

      setSharedContacts(prev => [...prev, newSharedContact]);
      setShowContactPicker(false);

      // Save to backend
      await saveSettings({
        privacy: {
          shareCalendar: true,
          profileVisibility: 'contacts',
          showEmail: false,
        },
      });
    } catch (err) {
      console.error('Error saving shared contacts:', err);
      setError('Failed to share calendar');
    }
  };

  const handleRemoveSharedContact = async (sharedContactId: string) => {
    if (!user?.uid) return;

    try {
      const sharedContactsService = new SharedContactsService(user.uid);
      await sharedContactsService.removeSharedContact(sharedContactId);
      setSharedContacts(prev => prev.filter(sc => sc.id !== sharedContactId));
    } catch (err) {
      console.error('Error removing shared contact:', err);
      setError('Failed to remove shared contact');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, isDark && styles.textLight]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, isDark && styles.textMuted]}>
                Enable or disable all notifications
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#e2e8f0', true: '#0891b2' }}
            thumbColor="#ffffff"
            disabled={Platform.OS === 'web' || savingSettings}
          />
        </View>

        <View style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Clock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, isDark && styles.textLight]}>Event Reminders</Text>
              <Text style={[styles.settingDescription, isDark && styles.textMuted]}>
                Get notified before events start
              </Text>
            </View>
          </View>
          <Switch
            value={eventReminders}
            onValueChange={handleEventRemindersToggle}
            trackColor={{ false: '#e2e8f0', true: '#0891b2' }}
            thumbColor="#ffffff"
            disabled={!notificationsEnabled || Platform.OS === 'web' || savingSettings}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Calendar Sharing</Text>
        <View style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Calendar size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, isDark && styles.textLight]}>Share Calendar</Text>
              <Text style={[styles.settingDescription, isDark && styles.textMuted]}>
                Allow contacts to view your calendar
              </Text>
            </View>
          </View>
          <Switch
            value={calendarSharing}
            onValueChange={handleCalendarSharingToggle}
            trackColor={{ false: '#e2e8f0', true: '#0891b2' }}
            thumbColor="#ffffff"
            disabled={savingSettings}
          />
        </View>

        {calendarSharing && (
          <>
            <Pressable
              style={[styles.settingItem, isDark && styles.settingItemDark]}
              onPress={() => setShowContactPicker(true)}>
              <View style={styles.settingContent}>
                <Users size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.settingText, isDark && styles.textLight]}>
                  Manage Shared Contacts
                </Text>
              </View>
              <ChevronRight size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>

            {sharedContacts.map(shared => {
              const contact = contacts.find(c => c.id === shared.contactId);
              if (!contact) return null;

              return (
                <View
                  key={shared.id}
                  style={[styles.sharedContact, isDark && styles.sharedContactDark]}>
                  <View style={styles.sharedContactInfo}>
                    <Text style={[styles.sharedContactName, isDark && styles.textLight]}>
                      {contact.name}
                    </Text>
                    <Text style={[styles.sharedContactDetails, isDark && styles.textMuted]}>
                      {shared.permission} access • {shared.duration === 'permanent' ? 'Permanent' : `${shared.duration} remaining`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveSharedContact(shared.id)}>
                    <X size={20} color="#ef4444" />
                  </Pressable>
                </View>
              );
            })}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Security</Text>
        <Pressable style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <Lock size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Privacy Settings</Text>
          </View>
          <ChevronRight size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Support</Text>
        <Pressable style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingContent}>
            <HelpCircle size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text style={[styles.settingText, isDark && styles.textLight]}>Help & FAQ</Text>
          </View>
          <ChevronRight size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
      </View>

      <Pressable
        style={[styles.logoutButton, isDark && styles.logoutButtonDark]}
        onPress={signOut}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

      <Modal
        visible={showContactPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>Share Calendar</Text>
              <Pressable onPress={() => setShowContactPicker(false)}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView style={styles.contactsList}>
              {contacts
                .filter(contact => !sharedContacts.some(sc => sc.contactId === contact.id))
                .map(contact => (
                  <Pressable
                    key={contact.id}
                    style={[styles.contactItem, isDark && styles.contactItemDark]}
                    onPress={() => handleShareWithContact(contact.id, 'view', 'permanent')}>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, isDark && styles.textLight]}>
                        {contact.name}
                      </Text>
                      {contact.email && (
                        <Text style={[styles.contactEmail, isDark && styles.textMuted]}>
                          {contact.email}
                        </Text>
                      )}
                    </View>
                    <Share size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#ef4444',
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
    flex: 1,
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  settingDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  sharedContact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  sharedContactDark: {
    backgroundColor: '#0f172a',
  },
  sharedContactInfo: {
    flex: 1,
    marginRight: 16,
  },
  sharedContactName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 2,
  },
  sharedContactDetails: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
  },
  contactsList: {
    maxHeight: 400,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  contactItemDark: {
    backgroundColor: '#0f172a',
  },
  contactInfo: {
    flex: 1,
    marginRight: 16,
  },
  contactName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  contactEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
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
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
});