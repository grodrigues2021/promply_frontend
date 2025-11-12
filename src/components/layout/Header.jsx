// src/components/layout/Header.jsx
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import PromplyLogo from "../../assets/promply-logo.svg";

export default function Header({
  user,
  handleLogout,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
}) {
  return (
    <header className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-slate-900 sticky top-0 z-50">
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
            onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
            aria-label={isMobileSidebarOpen ? "Fechar menu" : "Abrir menu"}
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
    </header>
  );
}
