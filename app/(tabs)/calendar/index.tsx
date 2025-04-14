import { Redirect } from 'expo-router';

export default function CalendarIndex() {
  // Redirect to the main calendar view
  return <Redirect href="/(tabs)" />;
} 