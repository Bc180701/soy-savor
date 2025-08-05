import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6cd9cf9545dd4dd5a327cf0c3af940cd',
  appName: 'soy-savor',
  webDir: 'dist',
  server: {
    url: 'https://6cd9cf95-45dd-4dd5-a327-cf0c3af940cd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;