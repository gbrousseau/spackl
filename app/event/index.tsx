import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Save, Trash2, Search, X, UserPlus, User, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCalendar } from '@/context/CalendarContext';
import { useNotifications } from '@/context/NotificationContext';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Image as ContactImage } from 'expo-contacts';
// ... existing code ... 