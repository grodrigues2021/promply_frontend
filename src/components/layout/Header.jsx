// src/components/layout/Header.jsx
// ✅ VERSÃO CORRIGIDA - Z-index e funcionamento do menu

import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import PromplyLogo from "../../assets/promply-logo.svg";

export default function Header({
  user,
  handleLogout,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}) {
  
  const handleMenuClick = () => {
    console.log('🔘 MENU CLICADO');
    console.log('  Estado ANTES:', isMobileSidebarOpen);
    setIsMobileSidebarOpen((prev) => {
      console.log('  Estado DEPOIS:', !prev);
      return !prev;
    });
  };

  return (
    <header className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-slate-900 sticky top-0 z-[9997]">
      {/* ☝️ CORREÇÃO: z-[9997] (menor que overlay z-[9998] e sidebar z-[9999]) */}
      
      <div className="w-full px-8 lg:px-12 xl:px-16 py-4">
        <div className="flex items-center justify-between">
          
          {/* 🧩 Logo e título */}
          <div className="flex items-center space-x-3">
            <img
              src={PromplyLogo}
              alt="Logo Promply"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Promply.app
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Organize e gerencie seus prompts
              </p>
            </div>
          </div>

          {/* 🧩 Botão dinâmico (☰ → ✕) visível apenas no mobile */}
          <button
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-95"
            onClick={handleMenuClick}
            aria-label={isMobileSidebarOpen ? "Fechar menu" : "Abrir menu"}
            type="button"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isMobileSidebarOpen ? (
              <X className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            ) : (
              <Menu className="w-6 h-6 text-slate-800 dark:text-slate-200" />
            )}
          </button>

          {/* 🧩 Área de usuário (lado direito desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Olá, {user.name}
                </span>

                {(user.is_admin || user.role === "admin") && (
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm border border-red-700">
                    Admin
                  </span>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ INDICADOR DE DEBUG - Remover em produção */}
      {process.env.NODE_ENV === 'development' && (
        <div className="lg:hidden bg-yellow-100 dark:bg-yellow-900/50 border-t border-yellow-300 dark:border-yellow-700 px-4 py-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span>
              Sidebar: {isMobileSidebarOpen ? '✅ ABERTA' : '❌ FECHADA'} | 
              Width: {window.innerWidth}px | 
              {window.innerWidth < 1024 ? 'MOBILE' : 'DESKTOP'}
            </span>
            <button
              onClick={handleMenuClick}
              className="px-2 py-1 bg-yellow-500 text-white rounded text-[10px] font-bold"
            >
              TOGGLE
            </button>
          </div>
        </div>
      )}
    </header>
  );
}