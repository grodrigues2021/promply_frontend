// src/App.jsx - VERSÃO ORIGINAL
import React from 'react'
import { useState, useEffect } from 'react'
import AuthPage from './components/AuthPage.jsx'
import ResetPasswordPage from './components/ResetPasswordPage.jsx'
import PromptManager from './components/PromptManager.jsx'
import { useAuth } from './hooks/useAuth.jsx'

function App() {
  const { 
    user, 
    isAuthenticated,
    isLoading 
  } = useAuth()
  
  const [currentPage, setCurrentPage] = useState('main')

  useEffect(() => {
    console.log('🔐 [APP] Estado:', { isAuthenticated, isLoading, user })
  }, [isAuthenticated, user, isLoading])

  // Verificar página de reset de senha
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (window.location.pathname === '/reset-password' || params.get('token')) {
      setCurrentPage('reset-password')
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (currentPage === 'reset-password') {
    return <ResetPasswordPage />
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <PromptManager user={user} />
}

export default App