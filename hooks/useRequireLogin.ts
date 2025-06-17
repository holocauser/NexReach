import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export function useRequireLogin() {
  const { user, setIntendedAction } = useAuth();
  const router = useRouter();

  return (action: () => void) => {
    if (user) {
      action();
    } else {
      setIntendedAction(() => action);
      router.push('/auth'); // Update this path if your AuthScreen is at a different route
    }
  };
} 