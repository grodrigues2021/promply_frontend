import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    console.log('🔘 [AuthPage] Botão Google clicado');
    console.log('🔘 [AuthPage] Chamando loginWithGoogle()...');
    
    setLoading(true);
    
    try {
      loginWithGoogle();
    } catch (error) {
      console.error('❌ [AuthPage] Erro ao iniciar login:', error);
      setLoading(false);
    }
  };

  // Debug: mostrar configuração
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://promply-backend-staging.onrender.com/api';
  const backendUrl = apiBaseUrl.replace(/\/api$/, '');
  const googleLoginUrl = `${backendUrl}/api/auth/login/google`;

  console.log('🔍 [AuthPage] API Base URL:', apiBaseUrl);
  console.log('🔍 [AuthPage] Google Login URL:', googleLoginUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Promply.app</h1>
          <p className="text-slate-600 mt-2">Organize e gerencie seus prompts de IA</p>
        </div>

        {/* Formulário de Login (email/senha) */}
        <form className="space-y-4 mb-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            Entrar
          </button>
        </form>

        {/* Divisor */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">OU CONTINUE COM</span>
          </div>
        </div>

        {/* 🔥 BOTÃO DO GOOGLE - CORRIGIDO */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-700"></div>
              <span>Redirecionando...</span>
            </>
          ) : (
            <>
              {/* Logo do Google */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Entrar com Google</span>
            </>
          )}
        </button>

        {/* Links auxiliares */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <a href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
            Criar uma conta
          </a>
          <span className="mx-2 text-slate-400">•</span>
          <a href="/reset-password" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
            Esqueci minha senha
          </a>
        </div>

        {/* Debug info (só em desenvolvimento) */}
        {(import.meta.env.MODE === 'development' || import.meta.env.VITE_ENV === 'development') && (
          <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
            <div className="text-xs font-mono space-y-1 text-slate-700">
              <div className="font-bold text-slate-900 mb-2">🔧 Debug Info:</div>
              <div><strong>Env:</strong> {import.meta.env.VITE_ENV || import.meta.env.MODE || 'development'}</div>
              <div><strong>API Base:</strong> {apiBaseUrl}</div>
              <div className="pt-2 border-t border-slate-300 mt-2">
                <strong>Google OAuth URL:</strong>
                <div className="text-blue-600 break-all mt-1">{googleLoginUrl}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}