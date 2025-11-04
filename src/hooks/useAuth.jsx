// src/hooks/useAuth.jsx
import React, { useState, useCallback, createContext, useContext, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
  console.group("🔍 [useAuth] Verificando autenticação");
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("ℹ️ Nenhum token encontrado — usuário não autenticado");
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    console.groupEnd();
    return;
  }

  console.log("🪪 Token encontrado:", token.slice(0, 20) + "...");

  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  console.log("📡 Header Authorization configurado");

  try {
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
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  } finally {
    setIsLoading(false);
    console.groupEnd();
  }
}, []);


    // ✅ Configura o header Authorization globalmente
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    try {
      const resp = await api.get("/auth/me");
      if (resp.data?.success && resp.data?.data) {
        setUser(resp.data.data);
        setIsAuthenticated(true);
        console.log('✅ useAuth: Usuário autenticado:', resp.data.data.email);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('ℹ️ useAuth: Não autenticado');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('ℹ️ useAuth: Token inválido (401)');
      } else {
        console.error('❌ useAuth: Erro ao verificar autenticação:', err);
      }
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  const login = useCallback(async (email, password) => {
  console.group("🔑 [useAuth] Iniciando login");
  console.log("📤 Email:", email);
  console.log("📤 Enviando para endpoint /auth/login");

  try {
    const resp = await api.post("/auth/login", { email, password });
    console.log("📨 Resposta completa do backend:", resp.data);

    const { access_token, success, data, error } = resp.data;

    console.log("🧩 Campos retornados:");
    console.log("   • access_token:", access_token ? access_token.slice(0, 20) + "..." : null);
    console.log("   • success:", success);
    console.log("   • data:", data);
    console.log("   • error:", error);

    if (access_token) {
      localStorage.setItem("token", access_token);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      console.log("💾 Token salvo no localStorage:", localStorage.getItem("token").slice(0, 20) + "...");
    } else {
      console.warn("⚠️ Nenhum access_token retornado pelo backend!");
    }

    if (success || access_token) {
      setUser(data || null);
      setIsAuthenticated(true);
      console.log("✅ Estado atualizado: isAuthenticated = true, user =", data);
    } else {
      console.warn("⚠️ Backend retornou sucesso = false ou sem token:", resp.data);
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

  const register = useCallback(async (name, email, password) => {
    try {
      console.log('📝 useAuth: Criando conta...');
      const resp = await api.post("/auth/register", { name, email, password });
      return resp.data;
    } catch (err) {
      console.error("❌ useAuth: Erro no registro:", err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 useAuth: Iniciando logout...');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");

      try {
        await api.post("/auth/logout");
        console.log('✅ useAuth: API de logout chamada com sucesso');
      } catch (apiError) {
        console.warn("⚠️ useAuth: Erro ao chamar API de logout:", apiError.message);
      }

      window.location.href = '/';
    } catch (err) {
      console.error("❌ useAuth: Erro geral no logout:", err);
      window.location.href = '/';
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
     throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}