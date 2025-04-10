import { useState, useCallback } from 'react';
import { GroupService, Group, GroupEvent } from '@/services/GroupService';
import { Contact } from '@/context/ContactsContext';
import { useAuth } from '@/context/AuthContext';

export function useGroups() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const groupService = user ? new GroupService(user.uid) : null;

  const createGroup = useCallback(async (
    name: string,
    description?: string
  ): Promise<Group | null> => {
    if (!groupService) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const group = await groupService.createGroup(name, description);
      return group;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [groupService]);

  const addContactsToGroup = useCallback(async (
    groupId: string,
    contacts: Contact[]
  ): Promise<boolean> => {
    if (!groupService) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await groupService.addContactsToGroup(groupId, contacts);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contacts to group';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [groupService]);

  const removeContactsFromGroup = useCallback(async (
    groupId: string,
    contactIds: string[]
  ): Promise<boolean> => {
    if (!groupService) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await groupService.removeContactsFromGroup(groupId, contactIds);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove contacts from group';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [groupService]);

  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!groupService) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await groupService.deleteGroup(groupId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [groupService]);

  const createEvent = useCallback(async (
    event: Omit<GroupEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<GroupEvent | null> => {
    if (!groupService) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newEvent = await groupService.createEvent(event);
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [groupService]);

  return {
    createGroup,
    addContactsToGroup,
    removeContactsFromGroup,
    deleteGroup,
    createEvent,
    loading,
    error,
  };
}