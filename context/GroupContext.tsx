import { createContext, useContext, useState, useEffect } from 'react';
import { GroupService, Group as FirestoreGroup } from '@/services/GroupService';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const groupService = user ? new GroupService(user.uid) : null;

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!groupService) return;
    
    try {
      const firestoreGroups = await groupService.getGroups();
      const mappedGroups: Group[] = firestoreGroups.map(group => ({
        id: group.id,
        name: group.name,
        members: [], // We'll load members separately
        createdAt: group.createdAt.toISOString(),
      }));
      setGroups(mappedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const addGroup = async (name: string) => {
    if (!groupService) return;
    
    try {
      const newGroup = await groupService.createGroup(name);
      const mappedGroup: Group = {
        id: newGroup.id,
        name: newGroup.name,
        members: [],
        createdAt: newGroup.createdAt.toISOString(),
      };
      setGroups(prev => [...prev, mappedGroup]);
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const removeGroup = async (id: string) => {
    if (!groupService) return;
    
    try {
      await groupService.deleteGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
    } catch (error) {
      console.error('Error removing group:', error);
    }
  };

  const addMemberToGroup = async (groupId: string, contact: Contact) => {
    if (!groupService) return;
    
    try {
      await groupService.addContactsToGroup(groupId, [contact]);
      setGroups(prev => prev.map(group => {
        if (group.id === groupId && !group.members.find(member => member.id === contact.id)) {
          return {
            ...group,
            members: [...group.members, contact],
          };
        }
        return group;
      }));
    } catch (error) {
      console.error('Error adding member to group:', error);
    }
  };

  const removeMemberFromGroup = async (groupId: string, contactId: string) => {
    if (!groupService) return;
    
    try {
      await groupService.removeContactsFromGroup(groupId, [contactId]);
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            members: group.members.filter(member => member.id !== contactId),
          };
        }
        return group;
      }));
    } catch (error) {
      console.error('Error removing member from group:', error);
    }
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