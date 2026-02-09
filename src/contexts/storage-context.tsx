import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { StorageAdapter } from '../lib/storage-adapter';
import { LocalStorageAdapter } from '../lib/storage-local';
import { ApiStorageAdapter } from '../lib/storage-api';
import { ApiClient } from '../lib/api-client';
import { StorageContext } from './storage-context-value';

const localAdapter = new LocalStorageAdapter();

export function StorageProvider({ children }: { children: ReactNode }) {
  const [classroomId, setClassroomId] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  const adapter = useMemo<StorageAdapter>(() => {
    if (!apiUrl || !classroomId) return localAdapter;
    const client = new ApiClient(apiUrl);
    return new ApiStorageAdapter(client, classroomId);
  }, [apiUrl, classroomId]);

  return (
    <StorageContext.Provider value={{ adapter, classroomId, setClassroomId }}>
      {children}
    </StorageContext.Provider>
  );
}
