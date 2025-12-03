// src/hooks/useAuth.jsx
// Sistema Híbrido: JWT (dev/staging) + Session Cookies (production)

import React, { useState, useCallback, createContext, useContext, useEffect } from "react";
import api, { currentEnv, isProduction, clearAuth, saveAuthToken, getAuthToken } from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔐 Verifica autenticação inicial
  const checkAuth = useCallback(async () => {
    console.group("🔐 [useAuth] Verificando autenticação");
    console.log(`📍 Ambiente: ${currentEnv}`);
    console.log(`🔑 Modo: ${isProduction ? "Session Cookies" : "JWT Token"}`);

    // Em dev/staging, verifica se tem token
    if (!isProduction) {
      const token = getAuthToken();
      if (!token) {
        console.log("ℹ️ Nenhum token encontrado — usuário não autenticado");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        console.groupEnd();
        return;
      }
      console.log("🧾 Token encontrado:", token.slice(0, 25) + "...");
    }

    try {
      // ✅ Requisição ao backend (cookie ou token enviado automaticamente)
      const resp = await api.get("/auth/me");
      console.log("📨 Resposta /auth/me:", resp.data);

      if (resp.data?.success && resp.data?.data) {
        console.log("✅ Usuário autenticado:", resp.data.data.email);
        setUser(resp.data.data);
        setIsAuthenticated(true);
      } else {
        console.warn("⚠️ Resposta inesperada de /auth/me:", resp.data);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("💥 Erro ao verificar autenticação:", err.response?.status, err.response?.data);
      clearAuth(); // Limpa tokens se inválidos
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, []);

  // ✅ Captura retorno do Google OAuth
  useEffect(() => {
    console.group("🔍 [useAuth] Verificando retorno do Google OAuth");

    const params = new URLSearchParams(window.location.search);
    
    // 🔑 DEV/STAGING: Token vem na URL
    const tokenFromUrl = params.get("token");
    
    // 🍪 PRODUCTION: Apenas status vem na URL (cookie já foi setado)
    const authStatus = params.get("auth");
    const authError = params.get("error");

    if (tokenFromUrl && !isProduction) {
      // ✅ DEV/STAGING: Salva token JWT
      console.log("✅ [JWT] Token capturado da URL:", tokenFromUrl.slice(0, 25) + "...");
      saveAuthToken(tokenFromUrl);
      
      // 🧹 Limpa a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log("🧹 URL limpa:", cleanUrl);
      
    } else if (authStatus === "success" && isProduction) {
      // ✅ PRODUCTION: Sessão criada no servidor
      console.log("✅ [Session] Login bem-sucedido - cookie de sessão ativo");
      
      // 🧹 Limpa a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.log("🧹 URL limpa:", cleanUrl);
      
    } else if (authError) {
      console.error("❌ Erro no login:", authError);
      
      // 🧹 Limpa a URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      console.log("🚫 Nenhum parâmetro de autenticação na URL");
    }

    console.groupEnd();
  }, []);

  // ⚙️ Executa verificação inicial
  useEffect(() => {
    console.log("🚀 [useAuth] Iniciando verificação automática de autenticação...");
    checkAuth();
  }, [checkAuth]);

  // 🔑 Login manual (email/senha)
  const login = useCallback(async (email, password) => {
    console.group("🔑 [useAuth] Iniciando login");
    console.log("📤 Email:", email);

    try {
      const resp = await api.post("/auth/login", { email, password });
      console.log("📨 Resposta do backend:", resp.data);

      const { access_token, success, data, error } = resp.data;

      // ✅ DEV/STAGING: Salva token JWT
      if (access_token && !isProduction) {
        saveAuthToken(access_token);
        console.log("💾 Token JWT salvo");
      }

      if (success || access_token || data) {
        setUser(data || null);
        setIsAuthenticated(true);
        console.log("✅ Login bem-sucedido");
      } else {
        console.warn("⚠️ Login falhou:", error || resp.data);
        setIsAuthenticated(false);
      }

      console.groupEnd();
      return resp.data;
    } catch (err) {
      console.error("❌ Erro no login:", err);
      console.error("📨 Resposta do backend:", err.response?.data);
      console.groupEnd();
      throw err;
    }
  }, []);

  // 📝 Registro de novo usuário
  const register = useCallback(async (name, email, password) => {
    try {
      console.log("📝 [useAuth] Criando conta...");
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
      console.group("🚪 [useAuth] Iniciando logout...");
      
      // Limpa estado local
      setUser(null);
      setIsAuthenticated(false);
      
      // Limpa tokens (dev/staging)
      clearAuth();

      try {
        // ✅ Backend limpa sessão (production) ou invalida token
        await api.post("/auth/logout");
        console.log("✅ Logout processado no servidor");
      } catch (apiError) {
        console.warn("⚠️ Erro ao chamar API de logout:", apiError.message);
      }

      console.groupEnd();
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
        console.log("🎯 [useAuth] Usuário autenticado — redirecionando para /workspace");
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