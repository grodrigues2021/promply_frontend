// src/App.jsx – versão corrigida e revisada
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from './components/AuthPage.jsx';
import ResetPasswordPage from './components/ResetPasswordPage.jsx';
import PromptManager from './components/PromptManager.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import ChatWorkspace from './components/ChatWorkspace.jsx';
import { MessageSquare } from "lucide-react";
import ChatContainer from "./components/ChatContainer.jsx";

function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('main');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    console.log('🔐 [APP] Estado:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');
    if (window.location.pathname === '/reset-password' || resetToken) {
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
      {/* ROTAS PRINCIPAIS */}
      <Routes>
        {/* Página inicial: autenticação */}
        <Route
          path="/"
          element={
            !isAuthenticated ? <AuthPage /> : <PromptManager user={user} />
          }
        />

        {/* Rota de workspace (após login do Google) */}
        <Route
          path="/workspace"
          element={
            !isAuthenticated ? <AuthPage /> : <PromptManager user={user} />
          }
        />

        {/* Página de redefinição de senha */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Janela destacada do chat (nova aba) */}
        <Route path="/chat-workspace" element={<ChatWorkspace />} />
      </Routes>

      {/* 🟢 BOTÃO FLUTUANTE DO CHAT */}
      {isAuthenticated && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:block">Chat da Comunidade</span>
        </button>
      )}

      {/* 🟣 CONTAINER DO CHAT (modal desktop / fullscreen mobile) */}
      <ChatContainer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onPromptSaved={() => console.log("✅ Prompt salvo!")}
      />
    </Router>
  );
}

export default App;
