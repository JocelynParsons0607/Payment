import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // This forces Vite to bundle the library into one file
    include: ['lucide-react'], 
  },
});