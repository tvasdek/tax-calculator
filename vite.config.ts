import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 1. IMPORT THE PWA PLUGIN HERE
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // 2. ADD THE PWA CONFIGURATION HERE
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'My Finance Tracker',
          short_name: 'Finance',
          description: 'Track expenses and income',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone', // Removes the browser bar
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    // Your existing env var logic remains exactly the same
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
    server: {
      port: 3000,
    }
  };
});