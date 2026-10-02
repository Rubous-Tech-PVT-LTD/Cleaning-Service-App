import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';
import api from '../api';

interface User {
  id: string;
  phone: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (accessToken: string, refreshToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const userId = await AsyncStorage.getItem('provider_id');

      if (accessToken && userId) {
        setIsAuthenticated(true);
        setUser({ id: userId, phone: '' });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    try {
      await tokenStorage.setAccessToken(accessToken);
      await tokenStorage.setRefreshToken(refreshToken);
      await AsyncStorage.setItem('provider_id', userData.id);

      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
      }

      await tokenStorage.clearTokens();
      await AsyncStorage.removeItem('provider_id');

      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
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