// src/hooks/useAuth.jsx
import React, { useState, useCallback, createContext, useContext, useEffect } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    console.log('🔍 useAuth: Verificando autenticação...');
    const token = localStorage.getItem("token");

    // ⚠️ Se não houver token, evita o loop e encerra o carregamento
    if (!token) {
      console.log('ℹ️ useAuth: Nenhum token encontrado — usuário não autenticado');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

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
    try {
      console.log('🔑 useAuth: Fazendo login...');
      const resp = await api.post("/auth/login", { email, password });
      console.log('✅ useAuth: Login realizado com sucesso', resp.data);

      if (resp.data.access_token) {
        localStorage.setItem("token", resp.data.access_token);
        api.defaults.headers.common["Authorization"] = `Bearer ${resp.data.access_token}`;
      }

      if (resp.data.success) {
        setUser(resp.data.data);
        setIsAuthenticated(true);
      }

      return resp.data;
    } catch (err) {
      console.error("❌ useAuth: Erro no login:", err);
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