import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";

import AuthPage from "./components/AuthPage.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import PromptManager from "./components/PromptManager.jsx";
import { useAuth } from "./hooks/useAuth.jsx";
import ChatWorkspace from "./components/ChatWorkspace.jsx";
import { MessageSquare } from "lucide-react";
import ChatContainer from "./components/ChatContainer.jsx";
import { saveAuthToken } from "./api/api.js";

// ============================================================
// 🔐 Componente para processar callback do Google OAuth
// ============================================================
function WorkspaceCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    processGoogleCallback();
  }, []);

  const processGoogleCallback = async () => {
    try {
      console.log('🔍 [WORKSPACE] Processando callback do Google OAuth...');
      
      // Extrair parâmetros da URL
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');
      const authSuccess = searchParams.get('auth');

      // ============================================================
      // 1️⃣ Erro no Google OAuth
      // ============================================================
      if (errorParam) {
        console.error('❌ [WORKSPACE] Erro no Google OAuth:', errorParam);
        setError(errorParam);
        setStatus('error');
        
        setTimeout(() => {
          navigate('/login?error=' + errorParam);
        }, 3000);
        return;
      }

      // ============================================================
      // 2️⃣ Token JWT recebido (STAGING/DEV)
      // ============================================================
      if (token) {
        console.log('✅ [WORKSPACE] Token JWT recebido');
        console.log('🔑 [WORKSPACE] Token:', token.slice(0, 30) + '...');
        
        // Salvar token
        saveAuthToken(token);
        localStorage.setItem('access_token', token);
        
        console.log('💾 [WORKSPACE] Token salvo no localStorage');
        
        // Limpar URL
        window.history.replaceState({}, '', '/workspace');
        
        // Aguardar um pouco para garantir que o token foi salvo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar autenticação
        console.log('🔄 [WORKSPACE] Verificando autenticação...');
        
        try {
          await checkAuth();
          console.log('✅ [WORKSPACE] Autenticação verificada com sucesso!');
          setStatus('success');
          
          // Aguardar 1 segundo antes de redirecionar
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Redirecionar para o workspace
          navigate('/workspace', { replace: true });
          
        } catch (err) {
          console.error('❌ [WORKSPACE] Erro ao verificar autenticação:', err);
          setError('Falha ao verificar autenticação');
          setStatus('error');
          
          setTimeout(() => {
            navigate('/login?error=auth_failed');
          }, 2000);
        }
        
        return;
      }

      // ============================================================
      // 3️⃣ Auth Success (PRODUCTION - Session Cookies)
      // ============================================================
      if (authSuccess === 'success') {
        console.log('✅ [WORKSPACE] Autenticação via Session Cookies');
        
        window.history.replaceState({}, '', '/workspace');
        
        try {
          await checkAuth();
          setStatus('success');
          navigate('/workspace', { replace: true });
        } catch (err) {
          console.error('❌ [WORKSPACE] Erro ao verificar sessão:', err);
          navigate('/login?error=session_invalid');
        }
        
        return;
      }

      // ============================================================
      // 4️⃣ Sem parâmetros - já deve estar autenticado
      // ============================================================
      console.log('ℹ️ [WORKSPACE] Nenhum callback, verificando autenticação...');
      
      if (isAuthenticated) {
        console.log('✅ [WORKSPACE] Já autenticado');
        setStatus('success');
      } else {
        console.warn('⚠️ [WORKSPACE] Não autenticado, redirecionando...');
        navigate('/login');
      }
      
    } catch (err) {
      console.error('❌ [WORKSPACE] Erro inesperado:', err);
      setError('Erro inesperado');
      setStatus('error');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  // ============================================================
  // 🎨 RENDERIZAÇÃO
  // ============================================================

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-800">
            Autenticando...
          </h2>
          <p className="mt-2 text-slate-600">
            Por favor, aguarde enquanto processamos seu login.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Erro na Autenticação
          </h2>
          <p className="text-slate-600 mb-6">
            {error === 'google_oauth_failed' && 'Falha no login com Google. Tente novamente.'}
            {error === 'google_auth_failed' && 'Não foi possível completar a autenticação.'}
            {error === 'auth_failed' && 'Falha ao verificar autenticação.'}
            {!['google_oauth_failed', 'google_auth_failed', 'auth_failed'].includes(error) && 
              (error || 'Ocorreu um erro desconhecido.')}
          </p>
          <p className="text-sm text-slate-500">
            Redirecionando para login em alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-green-700">
            Autenticado com sucesso!
          </h2>
          <p className="mt-2 text-slate-600">
            Carregando workspace...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// 🎯 COMPONENTE PRINCIPAL
// ============================================================
function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("main");
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    console.log("🔍 [APP] Estado:", { isAuthenticated, isLoading, user });
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    console.log("🌍 [APP] Ambiente:", import.meta.env.VITE_ENV || 'development');
    console.log("🌍 [APP] API Base:", import.meta.env.VITE_API_BASE_URL);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("reset_token");
    if (window.location.pathname === "/reset-password" || resetToken) {
      setCurrentPage("reset-password");
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
        {/* Página inicial */}
        <Route
          path="/"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* Registro */}
        <Route
          path="/register"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* 🔥 WORKSPACE - Processa callback do Google OAuth */}
        <Route
          path="/workspace"
          element={
            !isAuthenticated ? (
              <WorkspaceCallback />
            ) : (
              <PromptManager user={user} />
            )
          }
        />

        {/* Reset de senha */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Chat workspace (nova aba) */}
        <Route path="/chat-workspace" element={<ChatWorkspace />} />

        {/* Fallback */}
        <Route
          path="*"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />
      </Routes>

      {/* Container do chat */}
      <ChatContainer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onPromptSaved={() => console.log("✅ Prompt salvo!")}
      />
    </Router>
  );
}

export default App;