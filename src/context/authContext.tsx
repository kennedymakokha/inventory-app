import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('auth_token');
      if (savedToken) setToken(savedToken);
    };
    loadToken();
  }, []);

  const login = async (newToken: string) => {
    await AsyncStorage.setItem('auth_token', newToken);
    setToken(newToken);
   
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
  };

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
