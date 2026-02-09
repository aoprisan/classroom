import { useState, useEffect, useCallback } from 'react';
import { getAuthToken, setAuthToken, clearAuthToken, ApiClient } from '../lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function extractTokenFromHash(): boolean {
  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    const token = hash.slice('#token='.length);
    setAuthToken(token);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }
  return false;
}

function computeInitialState(apiUrl: string | undefined): AuthState {
  if (!apiUrl) return { user: null, loading: false, error: null };
  // Check hash on initial load
  extractTokenFromHash();
  const hasToken = !!getAuthToken();
  return { user: null, loading: hasToken, error: null };
}

export function useAuth(apiUrl: string | undefined) {
  const [state, setState] = useState<AuthState>(() => computeInitialState(apiUrl));

  // Validate token and fetch user
  useEffect(() => {
    if (!apiUrl) return;

    const token = getAuthToken();
    if (!token) return;

    const client = new ApiClient(apiUrl);
    client.get<User>('/auth/me')
      .then((user) => {
        setState({ user, loading: false, error: null });
      })
      .catch(() => {
        clearAuthToken();
        setState({ user: null, loading: false, error: null });
      });
  }, [apiUrl]);

  const login = useCallback(() => {
    if (!apiUrl) return;
    window.location.href = `${apiUrl}/auth/google`;
  }, [apiUrl]);

  const logout = useCallback(() => {
    if (!apiUrl) return;
    const client = new ApiClient(apiUrl);
    client.post('/auth/logout').catch(() => {});
    clearAuthToken();
    setState({ user: null, loading: false, error: null });
  }, [apiUrl]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    login,
    logout,
  };
}
