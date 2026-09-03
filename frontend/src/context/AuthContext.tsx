import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User, AuthResponse } from '../types';
import * as authApi from '../api/auth';
import { getApiErrorMessage } from '../lib/errors';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

// Read synchronously during the first render: an effect would run only after
// ProtectedRoute already saw a null user and redirected to /login on refresh.
function readStoredUser(): User | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);

  if (!token || !savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response: AuthResponse = await authApi.login({ email, password });
      // Drop anything cached before this login so the new session starts from
      // fresh server data instead of the previous user's transactions.
      queryClient.clear();
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to login. Please try again.'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const response: AuthResponse = await authApi.register({ name, email, password });
      queryClient.clear();
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setUser(response.user);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to register. Please try again.'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setError(null);
    // Wipe every cached query (transactions, categories, dashboard) so the next
    // login refetches instead of briefly rendering the signed-out user's data.
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
