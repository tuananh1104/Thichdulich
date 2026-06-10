"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'provider';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string, role?: 'user' | 'provider') => Promise<{ email: string } | null>;
  updateUser: (userData: Partial<User>) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');

      if (!token) {
        localStorage.removeItem('currentUser');
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('currentUser');
        }
      }

      if (token) {
        try {
          const profile = await api.getCurrentUser();
          if (isMounted && profile) {
            const userData: User = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || '',
              role: profile.role,
              avatar: profile.avatar,
            };
            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          }
        } catch {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          if (isMounted) {
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);
      
      if (response) {
        const profile = await api.getCurrentUser().catch(() => null);
        const source = profile || response;
        const userData: User = {
          id: source.id,
          name: source.name,
          email: source.email,
          phone: source.phone || '',
          role: source.role,
          avatar: source.avatar,
        };
        
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        return true;
      }
      
      return false;
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    phone: string,
    role: 'user' | 'provider' = 'user'
  ): Promise<{ email: string } | null> => {
    try {
      const response = await api.register(name, email, password, phone, role);
      
      return response ? { email: response.email } : null;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<User | null> => {
    const updated = await api.updateUser(userData);
    const nextUser: User = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone || '',
      role: updated.role,
      avatar: updated.avatar,
    };

    setUser(nextUser);
    localStorage.setItem('currentUser', JSON.stringify(nextUser));
    return nextUser;
  };

  const logout = () => {
    setUser(null);
    api.logout();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        updateUser,
        logout,
        isAuthenticated: !!user,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
