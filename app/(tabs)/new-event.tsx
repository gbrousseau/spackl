import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { auth } from '@/config/firebase';

export default function NewEventScreen() {
  const router = useRouter();

  useEffect(() => {
    if (!auth().currentUser) {
      router.replace('/sign-in');
    }
  }, [router]);

  return null;
}
