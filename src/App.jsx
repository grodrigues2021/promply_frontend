// src/App.jsx – versão ajustada com suporte a /chat-popup
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from './components/AuthPage.jsx';
import ResetPasswordPage from './components/ResetPasswordPage.jsx';
import PromptManager from './components/PromptManager.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import ChatFeed from './components/ChatFeed.jsx';
import ChatInput from './components/ChatInput.jsx';
import ChatWorkspace from './components/ChatWorkspace.jsx';


function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('main');

  useEffect(() => {
    console.log('🔐 [APP] Estado:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, user, isLoading]);

  // Verifica se é página de redefinição de senha
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/reset-password' || params.get('token')) {
      setCurrentPage('reset-password');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rota padrão: autenticação e gerenciador */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <AuthPage />
            ) : currentPage === 'reset-password' ? (
              <ResetPasswordPage />
            ) : (
              <PromptManager user={user} />
            )
          }
        />

        {/* 🔹 Nova rota: janela destacada do chat */}

<Route path="/chat-workspace" element={<ChatWorkspace />} />
      </Routes>
    </Router>
  );
}

export default App;
