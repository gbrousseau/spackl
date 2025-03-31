import { createContext, useContext, useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phoneNumbers?: { number: string }[];
  imageAvailable?: boolean;
  image?: { uri: string };
  shared?: boolean;
}

interface ContactsContextType {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  getContact: (id: string) => Contact | undefined;
  refreshContacts: () => Promise<void>;
  clearError: () => void;
}

const ContactsContext = createContext<ContactsContextType>({
  contacts: [],
  loading: false,
  error: null,
  getContact: () => undefined,
  refreshContacts: async () => {},
  clearError: () => {},
});

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      if (Platform.OS === 'web') {
        const mockContacts: Contact[] = [
          {
            id: '1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phoneNumbers: [{ number: '+1 234 567 8900' }],
            image: {
              uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            },
            shared: false,
          },
          {
            id: '2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            phoneNumbers: [{ number: '+1 234 567 8901' }],
            image: {
              uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            },
            shared: false,
          },
        ];
        setContacts(mockContacts);
        setLoading(false);
        return;
      }

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access contacts was denied');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
        ],
      });

      // Only include contacts with phone numbers
      const contactsWithPhones = data
        .filter(
          (contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0,
        )
        .map((contact) => ({
          id: contact.id || 'unknown-id',
          name: contact.name || 'No Name',
          email: contact.emails?.[0]?.email,
          phoneNumbers: contact.phoneNumbers?.map((phone) => ({
            number: phone.number || '',
          })),
          imageAvailable: contact.imageAvailable,
          image: contact.image?.uri ? { uri: contact.image.uri } : undefined,
          shared: false,
        }))
        .filter((contact) => contact.id !== 'unknown-id');

      // Load shared status from storage
      const sharedStatuses = await AsyncStorage.getItem('shared_contacts');
      const sharedContactIds = sharedStatuses ? JSON.parse(sharedStatuses) : [];

      const contactsWithSharedStatus = contactsWithPhones.map((contact) => ({
        ...contact,
        shared: sharedContactIds.includes(contact.id),
      }));

      setContacts(contactsWithSharedStatus);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const getContact = (id: string) => {
    return contacts.find((contact) => contact.id === id);
  };

  const refreshContacts = async () => {
    setLoading(true);
    setError(null);
    await loadContacts();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        loading,
        error,
        getContact,
        refreshContacts,
        clearError,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}

export const useContacts = () => useContext(ContactsContext);
