import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';

export const useAuthGuard = () => {
  const { isAuthenticated, isGuest } = useAuth();
  const navigation = useNavigation<NavigationProp<any>>();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const requireAuth = (callback?: () => void) => {
    if (!isAuthenticated || isGuest) {
      setShowLoginModal(true);
      return false;
    }
    if (callback) {
      callback();
    }
    return true;
  };

  const handleLoginPress = () => {
    setShowLoginModal(false);

    navigation.navigate('Login');
  };

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return {
    requireAuth,
    showLoginModal,
    handleLoginPress,
    handleCloseModal,
    canAccess: isAuthenticated && !isGuest,
  };
};
