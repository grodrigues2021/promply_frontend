// =====================================
// Componente: Workspace com Callback do Google OAuth
// =====================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleGoogleCallback, saveAuthToken } from '../api/api';
import { useAuth } from '../contexts/AuthContext'; // Se você tiver

export default function Workspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Se você tiver um AuthContext
  // const { checkAuth } = useAuth();

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      console.log('🔍 Verificando callback do Google OAuth...');
      
      // Extrai parâmetros da URL
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');
      const authSuccess = searchParams.get('auth');

      // ============================================================
      // 1️⃣ Tratamento de ERRO
      // ============================================================
      if (errorParam) {
        console.error('❌ Erro no Google OAuth:', errorParam);
        setError(errorParam);
        setLoading(false);
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login?error=' + errorParam);
        }, 3000);
        return;
      }

      // ============================================================
      // 2️⃣ JWT Token recebido (STAGING/DEV)
      // ============================================================
      if (token) {
        console.log('✅ Token JWT recebido do Google OAuth');
        console.log('🔑 Token:', token.slice(0, 30) + '...');
        
        // Salvar token no localStorage
        saveAuthToken(token);
        
        // Limpar URL (remover ?token=...)
        window.history.replaceState({}, '', '/workspace');
        
        // Opcional: Verificar autenticação chamando /api/auth/me
        try {
          const { default: api } = await import('../api/api');
          const response = await api.get('/auth/me');
          
          console.log('✅ Usuário autenticado:', response.data);
          
          // Se você tiver AuthContext, atualize o estado
          // if (checkAuth) await checkAuth();
          
        } catch (err) {
          console.error('❌ Erro ao verificar autenticação:', err);
          setError('Falha ao verificar autenticação');
          
          // Se falhar, redirecionar para login
          setTimeout(() => {
            navigate('/login?error=auth_failed');
          }, 2000);
          return;
        }
        
        setLoading(false);
        return;
      }

      // ============================================================
      // 3️⃣ Auth Success (PRODUCTION com Session Cookies)
      // ============================================================
      if (authSuccess === 'success') {
        console.log('✅ Autenticação via Google bem-sucedida (Session Cookies)');
        
        // Limpar URL
        window.history.replaceState({}, '', '/workspace');
        
        // Verificar sessão
        try {
          const { default: api } = await import('../api/api');
          const response = await api.get('/auth/me');
          
          console.log('✅ Sessão válida:', response.data);
          
        } catch (err) {
          console.error('❌ Erro ao verificar sessão:', err);
          navigate('/login?error=session_invalid');
          return;
        }
        
        setLoading(false);
        return;
      }

      // ============================================================
      // 4️⃣ Nenhum parâmetro de autenticação
      // ============================================================
      console.log('ℹ️ Nenhum callback detectado, verificando autenticação existente...');
      
      // Verificar se já está autenticado
      try {
        const { default: api } = await import('../api/api');
        const response = await api.get('/auth/me');
        
        if (response.data?.id) {
          console.log('✅ Já autenticado:', response.data.email);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('⚠️ Não autenticado, redirecionando...');
        navigate('/login');
        return;
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Erro no processamento do callback:', err);
      setError('Erro inesperado');
      setLoading(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  // ============================================================
  // 🎨 RENDERIZAÇÃO
  // ============================================================

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <h2 style={{ marginTop: '20px', color: '#333' }}>
          Autenticando...
        </h2>
        <p style={{ color: '#666' }}>
          Por favor, aguarde.
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          ❌
        </div>
        <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>
          Erro na Autenticação
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {error === 'google_oauth_failed' && 'Falha no login com Google'}
          {error === 'google_auth_failed' && 'Não foi possível completar a autenticação'}
          {error === 'auth_failed' && 'Falha ao verificar autenticação'}
          {!['google_oauth_failed', 'google_auth_failed', 'auth_failed'].includes(error) && error}
        </p>
        <p style={{ color: '#999', fontSize: '14px' }}>
          Redirecionando para login...
        </p>
      </div>
    );
  }

  // ============================================================
  // 🎯 WORKSPACE PRINCIPAL (quando autenticado)
  // ============================================================

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Workspace</h1>
      <p>Você está autenticado! 🎉</p>
      
      {/* Aqui vai o conteúdo real do seu workspace */}
      {/* Exemplo: */}
      {/* <PromptList /> */}
      {/* <ChatInterface /> */}
    </div>
  );
}