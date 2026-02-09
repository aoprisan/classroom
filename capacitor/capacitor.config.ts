import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.classroom.shuffle',
  appName: 'Classroom Shuffle',
  webDir: '../dist',
  server: {
    // In production, the app loads from the embedded web assets.
    // For development with a live API backend, uncomment and set:
    // url: 'https://your-api-server.com/classroom/',
    // cleartext: true,
  },
};

export default config;
