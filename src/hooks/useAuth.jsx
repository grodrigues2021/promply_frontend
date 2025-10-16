// src/hooks/useAuth.jsx
import { useState, useCallback, createContext, useContext, useEffect } from "react";
import api from "../lib/api";

// Criar contexto
const AuthContext = createContext();

// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação inicial
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 useAuth: Verificando autenticação...');
      const resp = await api.get("/auth/me");
      
      if (resp.data.success && resp.data.data) {
        setUser(resp.data.data);
        setIsAuthenticated(true);
        console.log('✅ useAuth: Usuário autenticado:', resp.data.data.email);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('ℹ️ useAuth: Não autenticado');
      }
    } catch (err) {
      // Diferenciar entre "não autenticado" (401) e erros reais
      if (err.response?.status === 401) {
        // 401 é esperado quando o usuário não está logado
        console.log('ℹ️ useAuth: Usuário não autenticado (401)');
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // Outros erros são problemas reais
        console.error('❌ useAuth: Erro ao verificar autenticação:', {
          status: err.response?.status,
          message: err.message,
          data: err.response?.data
        });
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 useAuth: Fazendo login...');
      const resp = await api.post("/auth/login", { email, password });
      
      console.log('✅ useAuth: Login realizado com sucesso', resp.data);
      
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
      
      // 1. Limpa o estado local PRIMEIRO (para UI responsiva)
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ useAuth: Estado local limpo');
      
      // 2. Tenta chamar a API de logout (sem bloquear se falhar)
      try {
        await api.post("/auth/logout");
        console.log('✅ useAuth: API de logout chamada com sucesso');
      } catch (apiError) {
        console.warn("⚠️ useAuth: Erro ao chamar API de logout (continuando):", apiError.message);
      }
      
      // 3. Limpa storage local
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ useAuth: Storage limpo');
      } catch (storageError) {
        console.warn('⚠️ useAuth: Erro ao limpar storage:', storageError);
      }
      
      // 4. Pequeno delay para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 5. Redireciona para a página inicial (que mostrará o login)
      console.log('🔄 useAuth: Redirecionando...');
      window.location.href = '/';
      
    } catch (err) {
      // Se tudo falhar, ainda assim redireciona
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

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}