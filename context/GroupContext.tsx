import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Group {
  id: string;
  name: string;
  members: Contact[];
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phoneNumbers?: { number: string }[];
  imageAvailable?: boolean;
  image?: { uri: string };
}

interface GroupContextType {
  groups: Group[];
  addGroup: (name: string) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  addMemberToGroup: (groupId: string, contact: Contact) => Promise<void>;
  removeMemberFromGroup: (groupId: string, contactId: string) => Promise<void>;
  getContactGroups: (contactId: string) => Group[];
}

const GroupContext = createContext<GroupContextType>({
  groups: [],
  addGroup: async () => {},
  removeGroup: async () => {},
  addMemberToGroup: async () => {},
  removeMemberFromGroup: async () => {},
  getContactGroups: () => [],
});

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const storedGroups = await AsyncStorage.getItem('contact_groups');
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const saveGroups = async (updatedGroups: Group[]) => {
    try {
      await AsyncStorage.setItem('contact_groups', JSON.stringify(updatedGroups));
      setGroups(updatedGroups);
    } catch (error) {
      console.error('Error saving groups:', error);
    }
  };

  const addGroup = async (name: string) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      members: [],
      createdAt: new Date().toISOString(),
    };
    await saveGroups([...groups, newGroup]);
  };

  const removeGroup = async (id: string) => {
    await saveGroups(groups.filter(group => group.id !== id));
  };

  const addMemberToGroup = async (groupId: string, contact: Contact) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId && !group.members.find(member => member.id === contact.id)) {
        return {
          ...group,
          members: [...group.members, contact],
        };
      }
      return group;
    });
    await saveGroups(updatedGroups);
  };

  const removeMemberFromGroup = async (groupId: string, contactId: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          members: group.members.filter(member => member.id !== contactId),
        };
      }
      return group;
    });
    await saveGroups(updatedGroups);
  };

  const getContactGroups = (contactId: string) => {
    return groups.filter(group => 
      group.members.some(member => member.id === contactId)
    );
  };

  return (
    <GroupContext.Provider value={{
      groups,
      addGroup,
      removeGroup,
      addMemberToGroup,
      removeMemberFromGroup,
      getContactGroups,
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export const useGroups = () => useContext(GroupContext);