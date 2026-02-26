import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.upcorp.ano',
  appName: 'ANO',
  webDir: 'out',
  server: {
    url: 'https://barrier-policies-society-scholars.trycloudflare.com', // Dev Tunnel
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
