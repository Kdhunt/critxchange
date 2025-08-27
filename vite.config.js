import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const react = (await import('@vitejs/plugin-react')).default;
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});

