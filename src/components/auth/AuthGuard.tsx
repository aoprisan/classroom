import type { ReactNode } from 'react';
import { LoginPage } from './LoginPage';

interface Props {
  isAuthenticated: boolean;
  loading: boolean;
  onLogin: () => void;
  children: ReactNode;
}

export function AuthGuard({ isAuthenticated, loading, onLogin, children }: Props) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={onLogin} />;
  }

  return <>{children}</>;
}
