import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tts-proxy': {
        target: 'https://translate.google.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/tts-proxy/, '/translate_tts'),
        headers: {
          'Referer': 'https://translate.google.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }
    }
  }
})
