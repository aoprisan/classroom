import type { ReactNode } from 'react';
import { useAuth } from './hooks/use-auth';
import { AuthContext } from './contexts/auth-context';
import { AuthGuard } from './components/auth/AuthGuard';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth(apiUrl);

  // In standalone mode (no API URL), skip auth entirely
  if (!apiUrl) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={auth}>
      <AuthGuard
        isAuthenticated={auth.isAuthenticated}
        loading={auth.loading}
        onLogin={auth.login}
      >
        {children}
      </AuthGuard>
    </AuthContext.Provider>
  );
}
