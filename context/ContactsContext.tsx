import { createContext, useContext, useState, useEffect } from 'react';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Contact = {
  id: string;
  name: string;
  email?: string;
  phoneNumbers?: Array<{
    number: string;
    label: string;
  }>;
  shared?: boolean;
  imageAvailable?: boolean;
  image?: {
    uri: string;
  };
};

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

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Geoff Brousseau',
    email: 'imaweinerdog@gmail.com',
    phoneNumbers: [{ number: '818-481-0612', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumbers: [{ number: '555-123-4567', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phoneNumbers: [{ number: '555-987-6543', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '4',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phoneNumbers: [{ number: '555-456-7890', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '5',
    name: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    phoneNumbers: [{ number: '555-789-0123', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '6',
    name: 'David Brown',
    email: 'david.brown@example.com',
    phoneNumbers: [{ number: '555-234-5678', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '7',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phoneNumbers: [{ number: '555-678-9012', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '8',
    name: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    phoneNumbers: [{ number: '555-345-6789', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '9',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    phoneNumbers: [{ number: '555-890-1234', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  },
  {
    id: '10',
    name: 'James Taylor',
    email: 'james.taylor@example.com',
    phoneNumbers: [{ number: '555-567-8901', label: 'mobile' }],
    shared: false,
    imageAvailable: false
  }
];

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
            Contacts.Fields.Image
          ],
        });

        const formattedContacts: Contact[] = data
          .filter(contact => contact.id) // Ensure id exists
          .map(contact => ({
            id: contact.id!,
            name: contact.name || '',
            email: contact.emails?.[0]?.email,
            phoneNumbers: contact.phoneNumbers?.map(phone => ({
              number: phone.number || '',
              label: phone.label || 'mobile'
            })),
            shared: false,
            imageAvailable: !!contact.image,
            image: contact.image?.uri ? { uri: contact.image.uri } : undefined
          }));

        setContacts(formattedContacts);
      } else {
        // Use mock data if permissions not granted
        setContacts(mockContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      // Use mock data if there's an error
      setContacts(mockContacts);
    } finally {
      setLoading(false);
    }
  };

  const getContact = (id: string) => {
    return contacts.find(contact => contact.id === id);
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
    <ContactsContext.Provider value={{
      contacts,
      loading,
      error,
      getContact,
      refreshContacts,
      clearError,
    }}>
      {children}
    </ContactsContext.Provider>
  );
}

export const useContacts = () => useContext(ContactsContext);