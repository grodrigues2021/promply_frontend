// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { AuthProvider } from './hooks/useAuth.jsx'
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
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
  // </React.StrictMode>
)

console.log('🚀 Aplicação com AuthProvider (modo não-strict para WebSocket)...')
