// ============================================================
// AuthPage - Exemplo de implementação do botão Google
// ============================================================

import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = () => {
    console.log('🔘 [AuthPage] Botão Google clicado');
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Promply</h1>
          <p className="text-slate-600 mt-2">Bem-vindo de volta!</p>
        </div>

        {/* Formulário de Login (email/senha) */}
        <form className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
            <span className="px-4 bg-white text-slate-500">ou continue com</span>
          </div>
        </div>

        {/* 🔥 BOTÃO DO GOOGLE - CRÍTICO */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
        >
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
          Continuar com Google
        </button>

        {/* Links auxiliares */}
        <div className="mt-6 text-center text-sm">
          <a href="/register" className="text-blue-600 hover:underline">
            Criar uma conta
          </a>
          <span className="mx-2 text-slate-400">•</span>
          <a href="/reset-password" className="text-blue-600 hover:underline">
            Esqueci minha senha
          </a>
        </div>

        {/* Debug info (remover em produção) */}
        {import.meta.env.MODE === 'development' && (
          <div className="mt-4 p-3 bg-slate-100 rounded text-xs text-slate-600">
            <strong>Debug:</strong>
            <br />
            Env: {import.meta.env.VITE_ENV || 'development'}
            <br />
            API: {import.meta.env.VITE_API_BASE_URL}
          </div>
        )}
      </div>
    </div>
  );
}