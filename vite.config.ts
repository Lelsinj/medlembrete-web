import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'firebase-messaging-sw.ts',
      manifest: {
        name: 'MedLembrete',
        short_name: 'MedLembrete',
        description: 'Seu app de lembrete de medicamentos',
        theme_color: '#ffffff',
        icons: [],
        gcm_sender_id: '103953800507',
      } as any,
      devOptions: { enabled: true, type: 'module', },
    }),
  ],
});
