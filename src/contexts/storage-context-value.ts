import { createContext } from 'react';
import type { StorageAdapter } from '../lib/storage-adapter';

export interface StorageContextValue {
  adapter: StorageAdapter;
  classroomId: string | null;
  setClassroomId: (id: string | null) => void;
}

export const StorageContext = createContext<StorageContextValue | null>(null);
