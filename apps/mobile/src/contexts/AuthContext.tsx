import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  phone: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const guestMode = await AsyncStorage.getItem('guest_mode');
      const userId = await AsyncStorage.getItem('user_id');

      if (guestMode === 'true') {
        setIsGuest(true);
        setIsAuthenticated(false);
        setUser(null);
      } else if (token && userId) {
        setIsAuthenticated(true);
        setIsGuest(false);
        setUser({ id: userId, phone: '' }); // Phone can be loaded if needed
      } else {
        setIsAuthenticated(false);
        setIsGuest(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      await AsyncStorage.setItem('user_token', token);
      await AsyncStorage.setItem('user_id', userData.id);
      await AsyncStorage.removeItem('guest_mode');
      
      setIsAuthenticated(true);
      setIsGuest(false);
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('guest_mode');
      
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const enterGuestMode = async () => {
    try {
      await AsyncStorage.setItem('guest_mode', 'true');
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_id');
      
      setIsGuest(true);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error entering guest mode:', error);
      throw error;
    }
  };

  const exitGuestMode = async () => {
    try {
      await AsyncStorage.removeItem('guest_mode');
      
      setIsGuest(false);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error exiting guest mode:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        user,
        login,
        logout,
        enterGuestMode,
        exitGuestMode,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
