import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CreateEventScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the event creation screen with forceNew=true
    router.push({
      pathname: '/calendar/event',
      params: { forceNew: 'true' }
    });
  }, []);

  return null; // This screen doesn't render anything as it immediately redirects
}