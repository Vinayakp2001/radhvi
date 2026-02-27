'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, authService } from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      try {
        authService.initializeAuth();
        const user = authService.getUser();
        if (user && authService.isAuthenticated()) {
          try {
            const currentUser = await authService.me();
            dispatch({ type: 'SET_USER', payload: currentUser });
          } catch (error) {
            authService.clearAuth();
            dispatch({ type: 'SET_USER', payload: null });
          }
        } else {
          dispatch({ type: 'SET_USER', payload: null });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_USER', payload: null });
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const authData = await authService.login(username, password);
      dispatch({ type: 'SET_USER', payload: authData.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const authData = await authService.register(userData);
      dispatch({ type: 'SET_USER', payload: authData.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
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
