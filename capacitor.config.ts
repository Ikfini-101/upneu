import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ano.app',
  appName: 'ANO - Libérez votre parole',
  webDir: 'public', // Fallback for SSR
  server: {
    url: 'https://barrier-policies-society-scholars.trycloudflare.com', // Dev Tunnel
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
