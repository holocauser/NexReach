import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export const useRequireLogin = () => {
  const { user, requireLogin } = useAuth();
  const router = useRouter();

  const checkAuth = (action: () => void) => {
    if (!user) {
      requireLogin(() => {
        // This will be executed after successful login
        action();
      });
      router.push('/auth');
      return false;
    }
    return true;
  };

  return { checkAuth, isAuthenticated: !!user };
}; 