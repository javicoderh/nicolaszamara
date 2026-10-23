import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        // Keep the browser-facing host so the API can validate Origin against Host.
        changeOrigin: false,
      },
    },
    watch: { ignored: ['**/.preview/**'] },
  },
})
