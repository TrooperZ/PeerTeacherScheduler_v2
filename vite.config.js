import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/howdy-course-sections': {
        target: 'https://howdy.tamu.edu',
        changeOrigin: true,
        rewrite: () => '/api/course-sections',
        configure: (proxy) => proxy.on('proxyReq', (request) => request.removeHeader('origin')),
      },
    },
  },
})
