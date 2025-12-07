// ============================================================
// Hook: useAuth - Gerenciamento de autenticação
// Suporta JWT (dev/staging) e Session Cookies (production)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import api, { clearAuth, hasValidAuth, currentEnv } from '../api/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // 🔍 Verificar autenticação atual
  // ============================================================
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 [useAuth] Verificando autenticação...');
      console.log('🔍 [useAuth] Ambiente:', currentEnv);
      
      // Verificar se tem token (dev/staging) ou cookies (production)
      const hasAuth = hasValidAuth();
      console.log('🔍 [useAuth] hasValidAuth:', hasAuth);
      
      if (!hasAuth && currentEnv !== 'production') {
        console.log('⚠️ [useAuth] Sem token JWT no localStorage');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Chamar /api/auth/me para verificar autenticação
      console.log('🔄 [useAuth] Chamando /api/auth/me...');
      
      const response = await api.get('/auth/me');
      
      console.log('✅ [useAuth] Resposta de /auth/me:', response.data);

      if (response.data?.id) {
        setUser(response.data);
        setIsAuthenticated(true);
        console.log('✅ [useAuth] Usuário autenticado:', response.data.email);
      } else {
        console.warn('⚠️ [useAuth] Resposta sem ID de usuário');
        setUser(null);
        setIsAuthenticated(false);
      }

    } catch (error) {
      console.error('❌ [useAuth] Erro ao verificar autenticação:', error);
      console.error('❌ [useAuth] Status:', error.response?.status);
      console.error('❌ [useAuth] Data:', error.response?.data);
      
      // Se for 401, limpar autenticação
      if (error.response?.status === 401) {
        console.log('🗑️ [useAuth] 401 - Limpando autenticação');
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // 🚀 Verificar autenticação ao carregar
  // ============================================================
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ============================================================
  // 🔐 Login com Google
  // ============================================================
  const loginWithGoogle = useCallback(() => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://promply-backend-staging.onrender.com/api';
    
    // Remove /api do final se existir, pois a rota já inclui /api/auth
    const baseUrl = backendUrl.replace(/\/api$/, '');
    
    console.log('🔑 [useAuth] Iniciando login Google...');
    console.log('🔑 [useAuth] URL:', `${baseUrl}/api/auth/login/google`);
    
    window.location.href = `${baseUrl}/api/auth/login/google`;
  }, []);

  // ============================================================
  // 🚪 Logout
  // ============================================================
  const logout = useCallback(async () => {
    try {
      console.log('👋 [useAuth] Fazendo logout...');
      
      // Chamar endpoint de logout
      await api.post('/auth/logout');
      
    } catch (error) {
      console.error('❌ [useAuth] Erro no logout:', error);
    } finally {
      // Sempre limpar estado local
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ [useAuth] Logout concluído');
      
      // Redirecionar para login
      window.location.href = '/login';
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    loginWithGoogle,
    logout,
  };
}