// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { AuthProvider } from './hooks/useAuth.jsx'
import { Toaster } from 'sonner'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/react-query-client'

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>

    <AuthProvider>
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
    </AuthProvider>

    {/* Devtools ativado apenas no ambiente dev */}
    {(import.meta.env.DEV || import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === "true") && (
  <ReactQueryDevtools initialIsOpen={false} />
  )}


  </QueryClientProvider>
)
