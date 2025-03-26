import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  User,
  UserPlus,
  X,
  Users as UsersIcon,
  Plus,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useGroups, Group } from '@/context/GroupContext';
import { useContacts } from '@/context/ContactsContext';

export default function ContactProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const {
    groups,
    addGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    getContactGroups,
  } = useGroups();
  const { getContact, loading, error } = useContacts();
  const [showAddToGroup, setShowAddToGroup] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const contact = getContact(id as string);
  const contactGroups = getContactGroups(id as string);

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      await addGroup(newGroupName.trim());
      setNewGroupName('');
      setShowCreateGroup(false);
    }
  };

  const handleAddToGroup = async (group: Group) => {
    if (contact) {
      await addMemberToGroup(group.id, contact);
      setShowAddToGroup(false);
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    await removeMemberFromGroup(groupId, id as string);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error || !contact) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>
          {error || 'Contact not found'}
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </Pressable>
        <Text style={[styles.headerTitle, isDark && styles.textLight]}>
          Contact Profile
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.profileSection, isDark && styles.sectionDark]}>
          {contact.image ? (
            <Image source={contact.image} style={styles.profileImage} />
          ) : (
            <View
              style={[
                styles.profileImagePlaceholder,
                isDark && styles.placeholderDark,
              ]}
            >
              <User size={40} color={isDark ? '#94a3b8' : '#64748b'} />
            </View>
          )}
          <Text style={[styles.name, isDark && styles.textLight]}>
            {contact.name}
          </Text>
          {contact.email && (
            <Text style={[styles.email, isDark && styles.textMuted]}>
              {contact.email}
            </Text>
          )}
          {contact.phoneNumbers?.[0] && (
            <Text style={[styles.phone, isDark && styles.textMuted]}>
              {contact.phoneNumbers[0].number}
            </Text>
          )}
        </View>

        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Groups
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => setShowAddToGroup(true)}
            >
              <UserPlus size={20} color="#0891b2" />
              <Text style={styles.addButtonText}>Add to Group</Text>
            </Pressable>
          </View>

          {contactGroups.length > 0 ? (
            contactGroups.map((group) => (
              <View
                key={group.id}
                style={[styles.groupItem, isDark && styles.groupItemDark]}
              >
                <View style={styles.groupInfo}>
                  <UsersIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                  <View style={styles.groupDetails}>
                    <Text
                      style={[styles.groupName, isDark && styles.textLight]}
                    >
                      {group.name}
                    </Text>
                    <Text
                      style={[styles.groupMembers, isDark && styles.textMuted]}
                    >
                      {group.members.length} member
                      {group.members.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveFromGroup(group.id)}
                >
                  <X size={20} color="#ef4444" />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <UsersIcon size={32} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.emptyStateText, isDark && styles.textMuted]}>
                Not a member of any groups
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showAddToGroup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddToGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDark && styles.modalContentDark]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                Add to Group
              </Text>
              <Pressable onPress={() => setShowAddToGroup(false)}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.createGroupButton,
                isDark && styles.createGroupButtonDark,
              ]}
              onPress={() => {
                setShowAddToGroup(false);
                setShowCreateGroup(true);
              }}
            >
              <Plus size={20} color="#0891b2" />
              <Text style={styles.createGroupButtonText}>Create New Group</Text>
            </Pressable>

            <ScrollView style={styles.groupsList}>
              {groups
                .filter(
                  (group) =>
                    !group.members.some((member) => member.id === contact.id),
                )
                .map((group) => (
                  <Pressable
                    key={group.id}
                    style={[
                      styles.groupOption,
                      isDark && styles.groupOptionDark,
                    ]}
                    onPress={() => handleAddToGroup(group)}
                  >
                    <UsersIcon
                      size={20}
                      color={isDark ? '#94a3b8' : '#64748b'}
                    />
                    <View style={styles.groupOptionInfo}>
                      <Text
                        style={[
                          styles.groupOptionName,
                          isDark && styles.textLight,
                        ]}
                      >
                        {group.name}
                      </Text>
                      <Text
                        style={[
                          styles.groupOptionMembers,
                          isDark && styles.textMuted,
                        ]}
                      >
                        {group.members.length} member
                        {group.members.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCreateGroup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDark && styles.modalContentDark]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                Create New Group
              </Text>
              <Pressable onPress={() => setShowCreateGroup(false)}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>

            <View
              style={[
                styles.inputContainer,
                isDark && styles.inputContainerDark,
              ]}
            >
              <TextInput
                style={[styles.input, isDark && styles.textLight]}
                placeholder="Enter group name"
                placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
            </View>

            <Pressable
              style={[
                styles.createButton,
                !newGroupName.trim() && styles.createButtonDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              <Text style={styles.createButtonText}>Create Group</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#0f172a',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderDark: {
    backgroundColor: '#0f172a',
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 4,
  },
  email: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  phone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#0f172a',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  addButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#0891b2',
    marginLeft: 4,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  groupItemDark: {
    backgroundColor: '#0f172a',
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupDetails: {
    marginLeft: 12,
  },
  groupName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  groupMembers: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
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
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    marginBottom: 16,
  },
  createGroupButtonDark: {
    backgroundColor: '#0c4a6e',
  },
  createGroupButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0891b2',
    marginLeft: 8,
  },
  groupsList: {
    maxHeight: 400,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  groupOptionDark: {
    backgroundColor: '#0f172a',
  },
  groupOptionInfo: {
    marginLeft: 12,
  },
  groupOptionName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#0f172a',
  },
  groupOptionMembers: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748b',
  },
  inputContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  inputContainerDark: {
    backgroundColor: '#0f172a',
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#0f172a',
  },
  createButton: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  createButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  textLight: {
    color: '#f8fafc',
  },
  textMuted: {
    color: '#94a3b8',
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#0891b2',
    fontSize: 16,
  },
});
