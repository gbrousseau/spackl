import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, Platform, ActivityIndicator, TextInput, Animated, Modal, Alert, RefreshControl, ScrollView } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import * as Device from 'expo-device';
import { Share2, User, Search, X, Plus, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, setDoc, deleteDoc, query, where, getDocs, arrayUnion, updateDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { SharedCalendars } from '@/components/SharedCalendars';
import { FIREBASE_AUTH } from '@/firebaseConfig';

type Contact = {
  id: string;
  name: string;
  email?: string;
  phoneNumbers?: Contacts.PhoneNumber[];
  imageAvailable?: boolean;
  image?: {
    uri: string;
  };
  shared?: boolean;
  sharedStatus?: 'checking' | 'shared' | 'not_shared' | 'error';
  sharedAt?: Date;
  lastUpdated?: Date;
};

type Group = {
  id: string;
  name: string;
  members: string[];
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedCount, setSharedCount] = useState(0);
  const [fabAnim] = useState(new Animated.Value(1));
  const { isDark } = useTheme();
  const router = useRouter();
  const { user, phoneInfo } = useAuth();
  const [sharedCalendars, setSharedCalendars] = useState<Record<string, { status: string; sharedAt?: Date; lastUpdated?: Date }>>({});
  const [checkingSharedStatus, setCheckingSharedStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});
  const [errorDetails, setErrorDetails] = useState<Record<string, string>>({});
  type SharingHistoryEntry = {
    action: 'shared' | 'updated';
    timestamp?: Date;
    status: string;
    eventsCount: number;
  };

  const [sharingHistory, setSharingHistory] = useState<Record<string, SharingHistoryEntry[]>>({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactGroups, setContactGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [sharedWithMe, setSharedWithMe] = useState<Array<{
    sharedBy: string;
    sharedByPhone: string;
    sharedByName: string;
    sharedAt: Date;
    lastUpdated: Date;
    events: Array<{
      id: string;
      title: string;
      startDate: Date;
      endDate?: Date;
      location?: string;
      description?: string;
    }>;
  }>>([]);
  const [loadingSharedWithMe, setLoadingSharedWithMe] = useState(false);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  // 2 seconds
  useEffect(() => {
    loadContacts();
    loadSharedCalendars();
    loadSharedWithMe();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadContacts(),
        loadSharedCalendars()
      ]);
    } catch (err) {
      console.error('Error refreshing:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadContacts = async () => {
    try {
      if (Platform.OS === 'web') {
        // Mock data for web platform
        setContacts([
          {
            id: '1',
            name: 'Geoff Brousseau',
            email: 'imaweinerdog@gmail.com',
            phoneNumbers: [{
              id: '1',
              number: '818-481-0612',
              label: 'mobile'
            }],
            shared: false,
            sharedStatus: 'not_shared',
          },
          {
            id: '2',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phoneNumbers: [{
              id: '1',
              number: '+1 234 567 8900',
              label: 'mobile'
            }],
            shared: false,
            sharedStatus: 'not_shared',
          },
          {
            id: '3',
            name: 'Bob Smith',
            email: 'bob@example.com',
            phoneNumbers: [{
              id: '2',
              number: '+1 234 567 8901',
              label: 'mobile'
            }],
            shared: false,
            sharedStatus: 'not_shared',
          }
        ]);
        setLoading(false);
        return;
      }

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access contacts was denied');
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
      });

      // Add Geoff Brousseau to the contacts list
      const geoffContact = {
        id: 'geoff_brousseau',
        name: 'Geoff Brousseau',
        email: 'imaweinerdog@gmail.com',
        phoneNumbers: [{
          number: '818-481-0612',
          label: 'mobile'
        }],
        shared: false,
        sharedStatus: 'checking' as const,
      };

      const contactsWithPhones = [
        geoffContact,
        ...data.filter(contact =>
        contact.phoneNumbers && contact.phoneNumbers.length > 0
      ).map(contact => ({
        id: contact.id,
        name: contact.name || 'No Name',
        email: contact.emails?.[0]?.email,
        phoneNumbers: contact.phoneNumbers,
        imageAvailable: contact.imageAvailable,
        image: contact.image,
        shared: false,
          sharedStatus: 'checking' as const,
        }))
      ] as (Contact & { sharedStatus: 'checking' | 'shared' | 'not_shared' | 'error' })[];

      setContacts(contactsWithPhones);
      setCheckingSharedStatus(true);

      // Check shared status for each contact with error handling
      const contactsWithSharedStatus = await Promise.all(
        contactsWithPhones.map(async (contact) => {
          try {
            if (!contact.phoneNumbers?.[0]?.number) {
              return { ...contact, sharedStatus: 'not_shared' as const };
            }

            const cleanPhoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
            const sharedCalendarRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);
            const sharedCalendarDoc = await getDoc(sharedCalendarRef);

            const isShared = sharedCalendarDoc.exists() && sharedCalendarDoc.data().status === 'accepted';
            return {
              ...contact,
              shared: isShared,
              sharedStatus: isShared ? 'shared' as const : 'not_shared' as const
            };
          } catch (err) {
            console.error(`Error checking shared status for ${contact.name}:`, err);
            return { ...contact, sharedStatus: 'error' as const };
          }
        })
      );

      setContacts(contactsWithSharedStatus);
      setSharedCount(contactsWithSharedStatus.filter(contact => contact.sharedStatus === 'shared').length);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
      setCheckingSharedStatus(false);
    }
  };

  const loadSharedCalendars = async () => {
    try {
      const sharedCalendarsRef = collection(FIREBASE_FIRESTORE, 'sharedCalendars');
      const q = query(sharedCalendarsRef, where('sharedBy', '==', user?.uid));
      const querySnapshot = await getDocs(q);

      const sharedCalendarsData: Record<string, { status: string; sharedAt?: Date; lastUpdated?: Date }> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sharedCalendarsData[data.contactPhone] = {
          status: data.status,
          sharedAt: data.sharedAt?.toDate(),
          lastUpdated: data.lastUpdated?.toDate(),
        };
      });

      setSharedCalendars(sharedCalendarsData);
    } catch (err) {
      console.error('Error loading shared calendars:', err);
    }
  };

  const loadSharedWithMe = async () => {
    if (!user || !phoneInfo?.phoneNumber) return;

    setLoadingSharedWithMe(true);
    try {
      const cleanPhoneNumber = phoneInfo.phoneNumber.replace(/\D/g, '');
      const sharedCalendarsRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);
      const sharedCalendarsDoc = await getDoc(sharedCalendarsRef);

      if (sharedCalendarsDoc.exists()) {
        const data = sharedCalendarsDoc.data();
        const sharedCalendars = Object.entries(data)
          .filter(([key]) => key !== 'status') // Filter out status field
          .map(([sharedByPhone, calendarData]) => ({
            sharedBy: calendarData.sharedBy,
            sharedByPhone,
            sharedByName: calendarData.contactName,
            sharedAt: calendarData.sharedAt?.toDate(),
            lastUpdated: calendarData.lastUpdated?.toDate(),
            events: calendarData.events || []
          }));

        setSharedWithMe(sharedCalendars);
      } else {
        setSharedWithMe([]);
      }
    } catch (err) {
      console.error('Error loading shared calendars:', err);
      setError('Failed to load shared calendars');
    } finally {
      setLoadingSharedWithMe(false);
    }
  };

  const sendSharingInvite = async (contact: Contact) => {
    try {
      if (!contact.phoneNumbers?.[0]?.number) {
        setError('Contact has no phone number');
      return;
    }
    
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const formattedPhoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');

      // Check if contact exists in users collection
      const usersRef = collection(FIREBASE_FIRESTORE, 'users');
      const userQuery = query(usersRef, where('phoneNumber', '==', formattedPhoneNumber));
      const userSnapshot = await getDocs(userQuery);
      const contactExists = !userSnapshot.empty;

      // Get user's device info
      const deviceInfo = {
        modelName: await Device.modelName || 'unknown',
        deviceName: await Device.deviceName || 'unknown',
        brand: await Device.brand || 'unknown',
        manufacturer: await Device.manufacturer || 'unknown',
        osName: await Device.osName || 'unknown',
        osVersion: await Device.osVersion || 'unknown',
        platformApiLevel: await Device.platformApiLevel || 'unknown'
      };

      // Get events to share
      const eventsRef = collection(FIREBASE_FIRESTORE, 'events');
      const eventsQuery = query(eventsRef, where('userId', '==', user.uid));
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Save shared calendar data organized by recipient's phone number and then by sharing user's ID
      const sharedCalendarRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', formattedPhoneNumber);
      const sharedCalendarData = {
        [user.uid]: { // Store under the sharing user's ID
          sharedBy: user.uid,
          sharedAt: new Date(),
          lastUpdated: new Date(),
          status: 'active',
          contactName: contact.name,
          contactId: contact.id,
          deviceInfo,
          events: events
        }
      };

      // Check if shared calendar already exists
      const sharedCalendarDoc = await getDoc(sharedCalendarRef);
      if (sharedCalendarDoc.exists()) {
        const existingData = sharedCalendarDoc.data();
        // Merge existing data with new data, maintaining the structure
        await updateDoc(sharedCalendarRef, {
          ...existingData,
          [user.uid]: sharedCalendarData[user.uid]
        });
      } else {
        await setDoc(sharedCalendarRef, sharedCalendarData);
      }

      // Save to sharedContacts collection
      const sharedContactsRef = doc(FIREBASE_FIRESTORE, 'sharedContacts', user.uid);
      const sharedContactsDoc = await getDoc(sharedContactsRef);

      if (sharedContactsDoc.exists()) {
        const existingContacts = sharedContactsDoc.data().contacts || [];
        type SharedContact = {
          contactId: string;
          contactName: string;
          phoneNumber: string;
          sharedAt: Date;
        };

        const contactExists = existingContacts.some((c: SharedContact) =>
          c.contactId === contact.id ||
          (c.phoneNumber && c.phoneNumber === formattedPhoneNumber)
        );

        if (!contactExists) {
          await updateDoc(sharedContactsRef, {
            contacts: arrayUnion({
              contactId: contact.id,
              contactName: contact.name,
              phoneNumber: formattedPhoneNumber,
              sharedAt: new Date()
            })
          });
        }
      } else {
        await setDoc(sharedContactsRef, {
          contacts: [{
            contactId: contact.id,
            contactName: contact.name,
            phoneNumber: formattedPhoneNumber,
            sharedAt: new Date()
          }]
        });
      }

      // Update UI
      setContacts(prev =>
        prev.map(c =>
          c.id === contact.id
            ? { ...c, shared: true, sharedStatus: 'shared' as const }
            : c
        )
      );

      // Send SMS only if contact doesn't exist in users collection
      if (Platform.OS !== 'web' && !contactExists) {
        const message = `Hi! I've shared my calendar with you. Download Spackl to view it: https://spackl.app`;
        const { result } = await SMS.sendSMSAsync([formattedPhoneNumber], message);

      if (result === 'sent') {
          console.log('SMS sent successfully');
        }
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const unshareCalendar = async (contact: Contact) => {
    try {
      const recipientPhoneNumber = contact.phoneNumbers?.[0]?.number;
      if (!recipientPhoneNumber) return;

      const cleanPhoneNumber = recipientPhoneNumber.replace(/\D/g, '');
      const sharedCalendarRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);

      await deleteDoc(sharedCalendarRef);

      // Update UI
        setContacts(prev => 
          prev.map(c => 
          c.id === contact.id ? { ...c, shared: false } : c
        )
      );
      setSharedCount(prev => Math.max(0, prev - 1));

      Alert.alert(
        'Success',
        `Calendar unshared with ${contact.name}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error unsharing calendar:', err);
      setError(err instanceof Error ? err.message : 'Failed to unshare calendar');
    }
  };

  const getSharedCalendarStatus = async (contact: Contact) => {
    try {
      const recipientPhoneNumber = contact.phoneNumbers?.[0]?.number;
      if (!recipientPhoneNumber) return null;

      const cleanPhoneNumber = recipientPhoneNumber.replace(/\D/g, '');
      const sharedCalendarRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);
      const sharedCalendarDoc = await getDoc(sharedCalendarRef);

      if (!sharedCalendarDoc.exists()) return null;

      const data = sharedCalendarDoc.data();
      return {
        status: data.status,
        sharedAt: data.sharedAt?.toDate(),
        lastUpdated: data.lastUpdated?.toDate()
      };
    } catch (err) {
      console.error('Error getting shared calendar status:', err);
      return null;
    }
  };

  const handleAvatarPress = (contact: Contact) => {
    router.push(`/contact/${contact.id}`);
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const searchTerms = searchQuery.toLowerCase().trim().split(' ');
    return contacts.filter(contact => {
      const searchString = `${contact.name} ${contact.email || ''} ${contact.phoneNumbers?.[0]?.number || ''}`.toLowerCase();
      return searchTerms.every(term => searchString.includes(term));
    });
  }, [contacts, searchQuery]) as (Contact & { sharedStatus: 'checking' | 'shared' | 'not_shared' | 'error' })[];

  const renderContactCard = ({ item }: { item: Contact & { sharedStatus: 'checking' | 'shared' | 'not_shared' | 'error' } }) => (
    <View style={[styles.contactCard, isDark && styles.contactCardDark]}>
      <Pressable
        onPress={() => handleAvatarPress(item)}
        style={styles.avatarContainer}>
        {item.imageAvailable && item.image ? (
          <Image source={{ uri: item.image.uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
            <User size={24} color={isDark ? '#94a3b8' : '#64748b'} />
          </View>
        )}
      </Pressable>
      <View style={styles.contactInfo}>
        <Text style={[styles.name, isDark && styles.textLight]}>{item.name}</Text>
        {item.phoneNumbers?.[0] && (
          <Text style={[styles.phone, isDark && styles.subtitleDark]}>
            {item.phoneNumbers[0].number}
          </Text>
        )}
        {item.sharedStatus === 'checking' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color="#0891b2" style={styles.statusIndicator} />
            <Text style={[styles.statusText, isDark && styles.textMuted]}>
              Checking status...
            </Text>
          </View>
        )}
        {item.sharedStatus === 'shared' && (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, isDark && styles.textMuted]}>
              Calendar shared
            </Text>
            {item.sharedAt && (
              <Text style={[styles.statusDetail, isDark && styles.textMuted]}>
                Shared on {item.sharedAt.toLocaleDateString()}
              </Text>
            )}
            {item.lastUpdated && (
              <Text style={[styles.statusDetail, isDark && styles.textMuted]}>
                Last updated {item.lastUpdated.toLocaleDateString()}
              </Text>
            )}
            <Pressable
              style={styles.refreshButton}
              onPress={() => refreshContactStatus(item)}>
              <RefreshCw size={14} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>
        )}
        {item.sharedStatus === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorStatus, isDark && styles.textMuted]}>
              Error checking status
            </Text>
            {errorDetails[item.id] && (
              <Text style={[styles.errorDetail, isDark && styles.textMuted]}>
                {errorDetails[item.id]}
              </Text>
            )}
            <Pressable
              style={styles.retryButton}
              onPress={() => retryCheckStatus(item)}>
              <Text style={styles.retryButtonText}>
                Retry ({retryCounts[item.id] || 0}/{MAX_RETRIES})
              </Text>
            </Pressable>
          </View>
        )}
        {contactGroups.length > 0 && (
          <View style={styles.groupsContainer}>
            <Text style={[styles.groupsLabel, isDark && styles.textMuted]}>
              Groups:
            </Text>
            <View style={styles.groupsList}>
              {contactGroups.map(group => (
                <View key={group.id} style={[styles.groupTag, isDark && styles.groupTagDark]}>
                  <Text style={[styles.groupName, isDark && styles.textMuted]}>
                    {group.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      <Pressable
        style={[
          styles.shareButton,
          item.sharedStatus === 'shared' && styles.shareButtonActive,
          isDark && item.sharedStatus !== 'shared' && styles.shareButtonDark,
          item.sharedStatus === 'checking' && styles.shareButtonDisabled
        ]}
        onPress={() => {
          if (item.sharedStatus === 'shared') {
            Alert.alert(
              'Unshare Calendar',
              `Are you sure you want to unshare your calendar with ${item.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Unshare',
                  style: 'destructive',
                  onPress: () => unshareCalendar(item)
                }
              ]
            );
          } else if (item.sharedStatus !== 'checking') {
            sendSharingInvite(item);
          }
        }}
        disabled={item.sharedStatus === 'checking'}>
        {item.sharedStatus === 'checking' ? (
          <ActivityIndicator size="small" color={isDark ? '#94a3b8' : '#64748b'} />
        ) : item.sharedStatus === 'shared' ? (
          <Share2 size={20} color="#ffffff" />
        ) : (
          <Share2 size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        )}
      </Pressable>
    </View>
  );

  const loadContactGroups = async (phoneNumber: string) => {
    if (!phoneNumber) return;

    setLoadingGroups(true);
    setGroupsError(null);

    try {
      const groupsRef = collection(FIREBASE_FIRESTORE, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', phoneNumber));
      const querySnapshot = await getDocs(q);

      const groups: Group[] = [];
      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data(),
        } as Group);
      });

      setContactGroups(groups);
    } catch (error) {
      console.error('Error loading contact groups:', error);
      setGroupsError('Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleContactPress = async (contact: Contact) => {
    setSelectedContact(contact);
    if (contact.phoneNumbers?.[0]?.number) {
      const phoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
      await loadContactGroups(phoneNumber);
    }
  };

  const retryCheckStatus = async (contact: Contact) => {
    const currentRetries = retryCounts[contact.id] || 0;
    if (currentRetries >= MAX_RETRIES) {
      setErrorDetails(prev => ({
        ...prev,
        [contact.id]: 'Maximum retry attempts reached. Please try again later.'
      }));
      return;
    }

    setRetryCounts(prev => ({ ...prev, [contact.id]: currentRetries + 1 }));
    setContacts(prev => prev.map(c =>
      c.id === contact.id ? { ...c, sharedStatus: 'checking' as const } : c
    ));

    try {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      await checkContactSharedStatus(contact);
    } catch (err) {
      console.error(`Retry failed for ${contact.name}:`, err);
      setErrorDetails(prev => ({
        ...prev,
        [contact.id]: `Retry ${currentRetries + 1} failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      }));
    }
  };

  const checkContactSharedStatus = async (contact: Contact) => {
    try {
      if (!contact.phoneNumbers?.[0]?.number) {
        return { ...contact, sharedStatus: 'not_shared' as const };
      }

      const cleanPhoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
      const sharedCalendar = sharedCalendars[cleanPhoneNumber];

      if (sharedCalendar) {
        return {
          ...contact,
          shared: true,
          sharedStatus: 'shared' as const,
          sharedAt: sharedCalendar.sharedAt,
          lastUpdated: sharedCalendar.lastUpdated,
        };
      }

      return { ...contact, sharedStatus: 'not_shared' as const };
    } catch (err) {
      console.error(`Error checking shared status for ${contact.name}:`, err);
      return { ...contact, sharedStatus: 'error' as const };
    }
  };

  const refreshContactStatus = async (contact: Contact) => {
    try {
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? { ...c, sharedStatus: 'checking' as const } : c
      ));
      setErrorDetails(prev => ({ ...prev, [contact.id]: '' }));
      setRetryCounts(prev => ({ ...prev, [contact.id]: 0 }));

      const updatedContact = await checkContactSharedStatus(contact);
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? updatedContact : c
      ));
    } catch (err) {
      console.error(`Error refreshing status for ${contact.name}:`, err);
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? { ...c, sharedStatus: 'error' as const } : c
      ));
      setErrorDetails(prev => ({
        ...prev,
        [contact.id]: err instanceof Error ? err.message : 'Failed to refresh status'
      }));
    }
  };

  const loadSharingHistory = async (contact: Contact) => {
    try {
      if (!contact.phoneNumbers?.[0]?.number) return;

      const cleanPhoneNumber = contact.phoneNumbers[0].number.replace(/\D/g, '');
      const sharedCalendarRef = doc(FIREBASE_FIRESTORE, 'sharedCalendars', cleanPhoneNumber);
      const sharedCalendarDoc = await getDoc(sharedCalendarRef);

      if (sharedCalendarDoc.exists()) {
        const data = sharedCalendarDoc.data();
        setSharingHistory(prev => ({
          ...prev,
          [contact.id]: [
            {
              action: 'shared' as const,
              timestamp: data.sharedAt?.toDate(),
              status: data.status,
              eventsCount: data.events?.length || 0
            },
            ...(data.lastUpdated ? [{
              action: 'updated' as const,
              timestamp: data.lastUpdated.toDate(),
              status: data.status,
              eventsCount: data.events?.length || 0
            }] : [])
          ]
        }));
      }
    } catch (err) {
      console.error('Error loading sharing history:', err);
    }
  };

  const bulkRefreshContacts = async () => {
    setRefreshing(true);
    try {
      const contactsToRefresh = contacts.filter(contact =>
        contact.sharedStatus === 'shared' || contact.sharedStatus === 'error'
      );

      await Promise.all(contactsToRefresh.map(contact => {
        setContacts(prev => prev.map(c =>
          c.id === contact.id ? { ...c, sharedStatus: 'checking' as const } : c
        ));
        return checkContactSharedStatus(contact);
      }));

      // Reload sharing history for all shared contacts
      await Promise.all(contactsToRefresh.map(contact => loadSharingHistory(contact)));
    } catch (err) {
      setError('Failed to refresh all contacts');
      console.error('Error during bulk refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const renderSharingHistoryModal = () => {
    if (!selectedContact) return null;

    const history = sharingHistory[selectedContact.id] || [];

    return (
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}>
        <View style={[styles.modalOverlay, isDark && styles.modalOverlayDark]}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                Sharing History
              </Text>
              <Pressable
                onPress={() => setShowHistoryModal(false)}
                style={styles.closeButton}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>

            <View style={styles.historyList}>
              {history.length > 0 ? (
                history.map((entry, index) => (
                  <View key={index} style={[styles.historyItem, isDark && styles.historyItemDark]}>
                    <Text style={[styles.historyAction, isDark && styles.textLight]}>
                      {entry.action === 'shared' ? 'Shared' : 'Updated'}
                    </Text>
                    <Text style={[styles.historyTime, isDark && styles.textMuted]}>
                      {entry.timestamp?.toLocaleString()}
                    </Text>
                    <Text style={[styles.historyStatus, isDark && styles.textMuted]}>
                      Status: {entry.status}
                    </Text>
                    <Text style={[styles.historyEvents, isDark && styles.textMuted]}>
                      Events: {entry.eventsCount}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noHistory, isDark && styles.textMuted]}>
                  No sharing history available
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSharedWithMe = () => {
    if (loadingSharedWithMe) {
      return (
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <ActivityIndicator size="small" color="#0891b2" />
        </View>
      );
    }

    if (sharedWithMe.length === 0) {
      return (
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
            Calendars Shared With You
          </Text>
          <Text style={[styles.emptyText, isDark && styles.textMuted]}>
            No calendars have been shared with you yet
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
          Calendars Shared With You
        </Text>
        {sharedWithMe.map((calendar, index) => (
          <View key={index} style={[styles.sharedCalendarCard, isDark && styles.sharedCalendarCardDark]}>
            <View style={styles.sharedCalendarHeader}>
              <Text style={[styles.sharedCalendarName, isDark && styles.textLight]}>
                {calendar.sharedByName}
              </Text>
              <Text style={[styles.sharedCalendarPhone, isDark && styles.textMuted]}>
                {calendar.sharedByPhone}
              </Text>
            </View>
            <View style={styles.sharedCalendarInfo}>
              <Text style={[styles.sharedCalendarTime, isDark && styles.textMuted]}>
                Shared on {calendar.sharedAt?.toLocaleDateString()}
              </Text>
              <Text style={[styles.sharedCalendarTime, isDark && styles.textMuted]}>
                Last updated {calendar.lastUpdated?.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.sharedCalendarEvents}>
              <Text style={[styles.sharedCalendarEventsTitle, isDark && styles.textLight]}>
                Upcoming Events
              </Text>
              {calendar.events.slice(0, 3).map((event, eventIndex) => (
                <View key={eventIndex} style={styles.sharedCalendarEvent}>
                  <Text style={[styles.sharedCalendarEventTitle, isDark && styles.textLight]}>
                    {event.title}
                  </Text>
                  <Text style={[styles.sharedCalendarEventTime, isDark && styles.textMuted]}>
                    {event.startDate.toLocaleString()}
                  </Text>
                </View>
              ))}
              {calendar.events.length > 3 && (
                <Text style={[styles.moreEventsText, isDark && styles.textMuted]}>
                  +{calendar.events.length - 3} more events
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>{error}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            loadContacts();
          }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <View style={[styles.searchInputContainer, isDark && styles.searchInputContainerDark]}>
          <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDark && styles.textLight]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search contacts..."
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
        </View>
      </View>

      <SharedCalendars />
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#94a3b8' : '#64748b'}
          />
        }
      />

      {sharedCount > 0 && (
        <Animated.View 
          style={[
            styles.fab,
            {
              transform: [{ scale: fabAnim }]
            }
          ]}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.fabText}>{sharedCount}</Text>
        </Animated.View>
      )}

      {renderSharingHistoryModal()}

      {selectedContact && (
        <Modal
          visible={!!selectedContact}
          animationType="slide"
          onRequestClose={() => setSelectedContact(null)}
        >
          <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                {selectedContact.name}
              </Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedContact(null)}
              >
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
                  Contact Info
                </Text>
                {selectedContact.phoneNumbers?.map((phone, index) => (
                  <Text
                    key={index}
                    style={[styles.contactInfo, isDark && styles.textLight]}
                  >
                    {phone.number}
                  </Text>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
                  Groups
                </Text>
                {loadingGroups ? (
                  <ActivityIndicator size="small" color="#0891b2" />
                ) : groupsError ? (
                  <Text style={styles.errorText}>{groupsError}</Text>
                ) : contactGroups.length > 0 ? (
                  contactGroups.map((group) => (
                    <View
                      key={group.id}
                      style={[styles.groupItem, isDark && styles.groupItemDark]}
                    >
                      <Text style={[styles.groupName, isDark && styles.textLight]}>
                        {group.name}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noGroupsText, isDark && styles.textMuted]}>
                    No groups
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchContainerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInputContainerDark: {
    backgroundColor: '#0f172a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Inter_400Regular',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
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
  subtitleDark: {
    color: '#94a3b8',
  },
  textLight: {
    color: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactCardDark: {
    backgroundColor: '#1e293b',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#0f172a',
  },
  contactInfo: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 2,
  },
  phone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonDark: {
    backgroundColor: '#0f172a',
  },
  shareButtonActive: {
    backgroundColor: '#0891b2',
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    padding: 4,
    backgroundColor: '#0891b2',
    borderRadius: 4,
  },
  retryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0891b2',
    borderRadius: 28,
    width: 56,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 4,
  },
  status: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  textMuted: {
    color: '#94a3b8',
  },
  section: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 12,
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarCardDark: {
    backgroundColor: '#1e293b',
  },
  calendarInfo: {
    flex: 1,
  },
  calendarTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  calendarTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  calendarLocation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  calendarListContent: {
    paddingBottom: 16,
  },
  statusIndicator: {
    marginTop: 4,
  },
  errorStatus: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  errorContainer: {
    marginTop: 4,
  },
  errorDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#ef4444',
    marginTop: 2,
  },
  refreshButton: {
    marginLeft: 8,
    padding: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulkRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  bulkRefreshButtonDark: {
    backgroundColor: '#1e293b',
  },
  bulkRefreshText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  historyButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  modalContentDark: {
    backgroundColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderDark: {
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
  },
  closeButton: {
    padding: 8,
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  historyItemDark: {
    backgroundColor: '#0f172a',
  },
  historyAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  historyTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  historyStatus: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  historyEvents: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  noHistory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalContainerDark: {
    backgroundColor: '#0f172a',
  },
  groupItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  groupItemDark: {
    backgroundColor: '#1e293b',
  },
  groupName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  noGroupsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  groupsContainer: {
    marginTop: 8,
  },
  groupsLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  groupsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  groupTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  groupTagDark: {
    backgroundColor: '#1e293b',
  },
  statusDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  sharedCalendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sharedCalendarCardDark: {
    backgroundColor: '#1e293b',
  },
  sharedCalendarHeader: {
    marginBottom: 8,
  },
  sharedCalendarName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  sharedCalendarPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  sharedCalendarInfo: {
    marginBottom: 12,
  },
  sharedCalendarTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  sharedCalendarEvents: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  sharedCalendarEventsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  sharedCalendarEvent: {
    marginBottom: 8,
  },
  sharedCalendarEventTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 2,
  },
  sharedCalendarEventTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
  },
  moreEventsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
});