import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Log the environment variables to ensure they are loaded
  console.log(env);

  return {
    plugins: [react()],
    define: {
      'process.env': env,
    },
    build: {
      rollupOptions: {
        external: ['emailjs-com']
      }
    }
  };
});
