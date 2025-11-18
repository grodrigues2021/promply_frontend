// src/components/DebugUser.jsx
// ⚠️ COMPONENTE TEMPORÁRIO - REMOVA EM PRODUÇÃO

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, RefreshCw, Copy, CheckCircle, XCircle } from 'lucide-react';

const DebugUser = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-yellow-600 z-[9999]"
      >
        🐛 Debug
      </button>
    );
  }

  const token = localStorage.getItem('token');
  
  let tokenPayload = null;
  if (token) {
    try {
      tokenPayload = JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      tokenPayload = { error: 'Token inválido' };
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (value) => {
    if (value === true || value === 1 || value === 'true') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-yellow-400 w-96 max-h-[80vh] overflow-auto z-[9999]">
      {/* Header */}
      <div className="bg-yellow-500 text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐛</span>
          <h3 className="font-bold">Debug User</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-yellow-600 p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status de Autenticação */}
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Autenticado:</span>
            {getStatusIcon(isAuthenticated)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {isAuthenticated ? '✅ Usuário autenticado' : '❌ Não autenticado'}
          </div>
        </div>

        {/* User Object */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">User Object:</h4>
            <button
              onClick={() => copyToClipboard(JSON.stringify(user, null, 2))}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {copied ? '✓ Copiado' : <Copy className="w-3 h-3" />}
            </button>
          </div>
          
          {user ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">ID:</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Nome:</span>
                <span className="font-mono">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Email:</span>
                <span className="font-mono">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">is_admin:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">
                    {String(user.is_admin)}
                  </span>
                  {getStatusIcon(user.is_admin)}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">role:</span>
                <span className="font-mono">{user.role || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Tipo is_admin:</span>
                <span className="font-mono">{typeof user.is_admin}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-500">❌ User é null</p>
          )}
        </div>

        {/* Token Payload */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">Token JWT:</h4>
          {tokenPayload ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">ID:</span>
                <span className="font-mono">{tokenPayload.id || tokenPayload.user_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">is_admin no token:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">
                    {String(tokenPayload.is_admin)}
                  </span>
                  {getStatusIcon(tokenPayload.is_admin)}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">role no token:</span>
                <span className="font-mono">{tokenPayload.role || 'N/A'}</span>
              </div>
              {tokenPayload.exp && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Expira em:</span>
                  <span className="font-mono text-xs">
                    {new Date(tokenPayload.exp * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-red-500">❌ Nenhum token encontrado</p>
          )}
        </div>

        {/* Comparação */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
          <h4 className="font-semibold text-sm mb-2">⚠️ Comparação:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              {user?.is_admin === tokenPayload?.is_admin ? '✅' : '❌'}
              <span>User.is_admin === Token.is_admin</span>
            </div>
            <div className="flex items-center gap-2">
              {typeof user?.is_admin === 'boolean' ? '✅' : '⚠️'}
              <span>is_admin é boolean (tipo correto)</span>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              refreshUser();
              window.location.reload();
            }}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm"
          >
            Limpar & Relogar
          </button>
        </div>

        {/* Console Snippet */}
        <div className="bg-slate-900 text-green-400 rounded-lg p-3 text-xs font-mono">
          <div className="text-slate-400 mb-1">// Cole no console:</div>
          <code className="block whitespace-pre">
            {`const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('PAYLOAD:', payload);`}
          </code>
        </div>
      </div>
    </div>
  );
};

export default DebugUser;