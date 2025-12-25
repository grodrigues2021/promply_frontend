// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./components/AuthPage.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import PromptManager from "./components/PromptManager.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx"; // ✅ ADICIONAR
import { useAuth } from "./hooks/useAuth.jsx";
import ChatWorkspace from "./components/ChatWorkspace.jsx";
import { MessageSquare } from "lucide-react";
import ChatContainer from "./components/ChatContainer.jsx";

// ✅ ADICIONAR: Componente para proteger rotas administrativas
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // TODO: Adicionar verificação de is_admin quando implementar no backend
  // if (!user?.is_admin) {
  //   return <Navigate to="/" replace />;
  // }

  return children;
};

function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("main");
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    console.log("🔒 [APP] Estado:", { isAuthenticated, isLoading, user });
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    console.log("🌐 DevTools flag:", import.meta.env.VITE_SHOW_QUERY_DEVTOOLS);
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
      {/* ROTAS PRINCIPAIS */}
      <Routes>
        {/* Página inicial: autenticação */}
        <Route
          path="/"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* ✅ NOVA ROTA: /login */}
        <Route
          path="/login"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* ✅ NOVA ROTA: /register */}
        <Route
          path="/register"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* Rota de workspace (após login do Google) */}
        <Route
          path="/workspace"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />

        {/* Página de redefinição de senha */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Janela destacada do chat (nova aba) */}
        <Route path="/chat-workspace" element={<ChatWorkspace />} />

        {/* ✅ NOVA ROTA: Dashboard Administrativo */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* ✅ FALLBACK: Qualquer rota não encontrada vai para AuthPage ou PromptManager */}
        <Route
          path="*"
          element={!isAuthenticated ? <AuthPage /> : <PromptManager user={user} />}
        />
      </Routes>

      {/* 🟣 CONTAINER DO CHAT */}
      <ChatContainer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onPromptSaved={() => console.log("✅ Prompt salvo!")}
      />
    </Router>
  );
}

export default App;