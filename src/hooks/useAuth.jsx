// src/hooks/useAuth.jsx
// Sistema Híbrido: JWT (dev/staging) + Session Cookies (production)

import React, { useState, useCallback, createContext, useContext, useEffect, useRef } from "react";
import api, { currentEnv, isProduction, clearAuth, saveAuthToken, getAuthToken } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  // 🔍 Verifica autenticação no servidor
  const checkAuth = useCallback(async (forceCheck = false) => {
    // Evita chamadas duplicadas (exceto quando forçado)
    if (hasCheckedAuth.current && !forceCheck) {
      return;
    }

    // Em dev/staging, verifica se tem token ANTES de chamar API
    if (!isProduction) {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        hasCheckedAuth.current = true;
        return;
      }
    }

    try {
      const resp = await api.get("/auth/me");

      if (resp.data?.success && resp.data?.data) {
        setUser(resp.data.data);
        setIsAuthenticated(true);
      } else {
        console.warn("⚠️ Resposta inesperada de /auth/me:", resp.data);
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      const status = err.response?.status;
      console.error("💥 Erro ao verificar autenticação:", status, err.response?.data);
      
      // Só limpa auth se for erro 401 (não autenticado)
      if (status === 401) {
        clearAuth();
      }
      
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      hasCheckedAuth.current = true;
    }
  }, []);

  // ✅ Captura retorno do Google OAuth (executa ANTES do checkAuth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // 🔑 DEV/STAGING: Token vem na URL
    const tokenFromUrl = params.get("token");
    
    // 🍪 PRODUCTION: Apenas status vem na URL (cookie já foi setado pelo backend)
    const authStatus = params.get("auth");
    const authError = params.get("error");

    let shouldCheckAuth = true;
    let forceCheck = false;

    if (tokenFromUrl && !isProduction) {
      // ✅ DEV/STAGING: Salva token JWT
      saveAuthToken(tokenFromUrl);
      
      // 🔄 IMPORTANTE: Reseta o flag para permitir nova verificação
      hasCheckedAuth.current = false;
      forceCheck = true;
      
      // 🧹 Limpa a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
    } else if (authStatus === "success" && isProduction) {
      // ✅ PRODUCTION: Sessão criada no servidor, cookie já está no navegador
      
      // 🔄 IMPORTANTE: Reseta o flag para permitir nova verificação
      hasCheckedAuth.current = false;
      forceCheck = true;
      
      // 🧹 Limpa a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
    } else if (authError) {
      console.error("❌ Erro no login Google:", authError);
      shouldCheckAuth = false;
      setIsLoading(false);
      
      // 🧹 Limpa a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // ⚙️ Executa verificação de autenticação
    if (shouldCheckAuth) {
      checkAuth(forceCheck);
    }
  }, [checkAuth]);

  // 🔑 Login manual (email/senha)
  const login = useCallback(async (email, password) => {
    try {
      const resp = await api.post("/auth/login", { email, password });

      const { access_token, success, data, error } = resp.data;

      // ✅ DEV/STAGING: Salva token JWT
      if (access_token && !isProduction) {
        saveAuthToken(access_token);
      }

      if (success || access_token || data) {
        setUser(data || null);
        setIsAuthenticated(true);
      } else {
        console.warn("⚠️ Login falhou:", error || resp.data);
        setIsAuthenticated(false);
      }

      return resp.data;
    } catch (err) {
      console.error("❌ Erro no login:", err);
      console.error("📨 Resposta do backend:", err.response?.data);
      throw err;
    }
  }, []);

  // 📝 Registro de novo usuário
  const register = useCallback(async (name, email, password) => {
    try {
      const resp = await api.post("/auth/register", { name, email, password });
      return resp.data;
    } catch (err) {
      console.error("❌ [useAuth] Erro no registro:", err);
      throw err;
    }
  }, []);

  // 🚪 Logout
  const logout = useCallback(async () => {
    try {
      // Limpa estado local
      setUser(null);
      setIsAuthenticated(false);
      hasCheckedAuth.current = false;
      
      // Limpa tokens (dev/staging)
      clearAuth();

      try {
        // ✅ Backend limpa sessão (production) ou invalida token
        await api.post("/auth/logout");
      } catch (apiError) {
        console.warn("⚠️ Erro ao chamar API de logout:", apiError.message);
      }

      window.location.href = "/";
    } catch (err) {
      console.error("❌ Erro geral no logout:", err);
      window.location.href = "/";
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };

  // 🚀 Redireciona automaticamente após autenticação
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const currentPath = window.location.pathname;
      if (["/", "/login", "/register", "/reset-password"].includes(currentPath)) {
        window.history.replaceState({}, "", "/workspace");
      }
    }
  }, [isAuthenticated, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ✅ Hook customizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}