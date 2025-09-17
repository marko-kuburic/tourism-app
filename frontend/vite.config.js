import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,                
    proxy: {
      '/api': {
        target: 'http://backend:8081',  
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, '')
      },
      '/api-tours': {
        target: 'http://tour:8084',      
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api-tours/, '')
      },
      '/api-blog': {
        target: 'http://blog:8080', 
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api-blog/, '')
      },
      '/api-following': {
        target: 'http://following:8083',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api-following/, '')
      },
    }
  }
})
