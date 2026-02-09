import { createContext } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
