import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function NewEventScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/calendar/event');
  }, []);

  return null;
}
