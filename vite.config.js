import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/reports/**'] },
    proxy: {
      '/blog-media': { target: 'http://127.0.0.1:3001', changeOrigin: false },
      '/api': {
        target: 'http://127.0.0.1:3001',
        // Keep the browser-facing host so the API can validate Origin against Host.
        changeOrigin: false,
      },
    },
    watch: { ignored: ['**/.preview/**'] },
  },
})
