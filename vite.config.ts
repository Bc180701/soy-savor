
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      usePolling: false,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '**/tmp/**',
        '**/temp/**'
      ]
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectRegister: false, // On enregistre manuellement dans main.tsx
      manifest: {
        name: 'Sushieats - Gestion Commandes',
        short_name: 'Sushieats Admin',
        start_url: '/admin',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#D4AF37',
        icons: [
          {
            src: '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/lovable-uploads/13d05a8a-41b7-4bef-adce-6112f0546d2d.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['fsevents']
  }
}));
