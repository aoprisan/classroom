import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StorageProvider } from './contexts/storage-context.tsx'
import { AuthProvider } from './AuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <StorageProvider>
        <App />
      </StorageProvider>
    </AuthProvider>
  </StrictMode>,
)
