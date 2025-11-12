// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { AuthProvider } from './hooks/useAuth.jsx'
import { Toaster } from 'sonner'

// 🧠 React Query imports
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Cria o client global do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutos (cache fresco)
      cacheTime: 1000 * 60 * 30,    // Mantém cache por 30 minutos
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a'
          },
          className: 'my-toast',
          duration: 2000,
        }}
      />

      {/* 🧠 Ativa o React Query DevTools:
          - Em localhost (import.meta.env.DEV)
          - Ou se VITE_SHOW_QUERY_DEVTOOLS=true no Render */}
      {(import.meta.env.DEV || import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === 'true') && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  </AuthProvider>
)

console.log('🚀 Aplicação com React Query, AuthProvider e Toaster configurados...')
