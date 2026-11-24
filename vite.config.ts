
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
// sushieats.fr est hébergé hors Lovable (o2switch) : en build, les URLs d'assets CDN
// relatives sont rendues absolues vers l'hébergement Lovable pour rester chargeables.
const ASSET_ORIGIN = "https://sushi-eats.lovable.app";
const absoluteLovableAssets = () => ({
  name: "absolute-lovable-assets",
  apply: "build" as const,
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!/\.(asset\.json|css)$/.test(id.split("?")[0]) || !code.includes("/__l5e/")) return null;
    return { code: code.replace(/(["'(])\/__l5e\//g, `$1${ASSET_ORIGIN}/__l5e/`), map: null };
  },
});

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
    absoluteLovableAssets(),
    react(),
    mode === 'development' && componentTagger(),
    // NOTE: Désactivé pour éviter les conflits avec le service worker custom `public/sw.js`.
    // Si vous souhaitez réactiver le plugin PWA, assurez-vous d'intégrer la logique push dans le SW généré.
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   injectRegister: false,
    //   manifest: {
    //     name: 'Sushieats - Gestion Commandes',
    //     short_name: 'Sushieats Admin',
    //     start_url: '/admin',
    //     display: 'standalone',
    //     background_color: '#ffffff',
    //     theme_color: '#D4AF37',
    //     icons: [
    //       {
    //         src: '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       },
    //       {
    //         src: '/lovable-uploads/13d05a8a-41b7-4bef-adce-6112f0546d2d.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   devOptions: {
    //     enabled: true,
    //     type: 'module'
    //   }
    // }),
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
