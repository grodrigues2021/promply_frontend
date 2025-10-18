import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // ✅ Configuração para desenvolvimento local
  server: {
    port: 5173,
    host: true,  // Permite acesso externo
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  },
  
  // ✅ Configuração para build de produção
  build: {
    outDir: 'dist',
    sourcemap: false,  // Desabilita sourcemaps em produção
    minify: 'esbuild',  // Minificação otimizada
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa vendors para melhor cache
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,  // Aumenta limite de warnings
  },
  
  // ✅ Otimizações
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
})