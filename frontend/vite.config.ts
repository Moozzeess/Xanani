import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo (development, production, etc.)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()] as any,
    server: {
      port: Number(env.VITE_PORT) || 5173,
      proxy: {
        '/api': {
          target: (env.VITE_API_BASE_URL).replace('/api', ''),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
