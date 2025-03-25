import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, Platform, ActivityIndicator, TextInput, Animated, Modal } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { Share2, User, Search, X, Plus, Users as UsersIcon, CreditCard as Edit2, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const generateUniqueId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

type Contact = {
  id: string;
  name: string;
  email?: string;
  phoneNumbers?: Contacts.PhoneNumber[];
  imageAvailable?: boolean;
  image?: Contacts.Image;
  shared?: boolean;
};

type Group = {
  id: string;
  name: string;
  contacts: Contact[];
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

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      if (Platform.OS === 'web') {
        // Mock data for web platform
        setContacts([
          {
            id: '1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phoneNumbers: [{ number: '+1 234 567 8900', label: 'mobile' }],
            shared: false,
          },
          {
            id: '2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            phoneNumbers: [{ number: '+1 234 567 8901', label: 'mobile' }],
            shared: false,
          },
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

      // Only include contacts with phone numbers
      const contactsWithPhones = data.filter(contact => 
        contact.phoneNumbers && contact.phoneNumbers.length > 0
      ).map(contact => ({
        id: contact.id || generateUniqueId(),
        name: contact.name || 'No Name',
        email: contact.emails?.[0]?.email,
        phoneNumbers: contact.phoneNumbers,
        imageAvailable: contact.imageAvailable,
        image: contact.image,
        shared: false,
      }));

      setContacts(contactsWithPhones);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendSharingInvite = async (contact: Contact) => {
    if (Platform.OS === 'web') {
      console.log('SMS not available on web');
      return;
    }

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        setError('SMS is not available on this device');
        return;
      }

      const phoneNumber = contact.phoneNumbers?.[0]?.number;
      if (!phoneNumber) return;

      const message = `Hey ${contact.name}! I'd like to share my Spackl calendar with you. Click here to accept: [App Link]`;
      
      const { result } = await SMS.sendSMSAsync(
        [phoneNumber],
        message
      );

      if (result === 'sent') {
        setContacts(prev => 
          prev.map(c => 
            c.id === contact.id ? { ...c, shared: true } : c
          )
        );
        setSharedCount(prev => prev + 1);
        
        // Animate the FAB
        Animated.sequence([
          Animated.timing(fabAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fabAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (err) {
      setError('Failed to send SMS invitation');
      console.error('Error sending SMS:', err);
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
  }, [contacts, searchQuery]);

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
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.textLight]}>Contacts</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Share calendars with your contacts</Text>
      </View>

      <View style={[styles.searchContainer, isDark && styles.headerDark]}>
        <View style={[styles.searchInputContainer, isDark && styles.searchInputContainerDark]}>
          <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDark && styles.textLight]}
            placeholder="Search contacts..."
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}>
              <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
            </View>
            <Pressable
              style={[
                styles.shareButton,
                item.shared && styles.shareButtonActive,
                isDark && !item.shared && styles.shareButtonDark
              ]}
              onPress={() => !item.shared && sendSharingInvite(item)}>
              <Share2
                size={20}
                color={item.shared ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
              />
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.listContent}
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
    backgroundColor: '#0891b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
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
});