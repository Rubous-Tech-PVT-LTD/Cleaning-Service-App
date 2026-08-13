import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';


export const useAuthGuard = () => {
  const { isAuthenticated, isGuest } = useAuth();
  const navigation = useNavigation();
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
    // @ts-ignore
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
