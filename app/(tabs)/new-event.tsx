import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FIREBASE_AUTH } from '@/firebaseConfig';

const auth = FIREBASE_AUTH;

export default function NewEventScreen() {
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) {
      router.replace('/sign-in');
    }
  }, [router]);

  return null;
}
