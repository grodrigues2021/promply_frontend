// src/components/layout/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BookOpen, Tag, Heart, FolderPlus, Edit3, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import FooterMobile from "./FooterMobile";

export default function Sidebar({
  stats,
  myCategories,
  selectedCategory,
  setSelectedCategory,
  resetCategoryForm,
  setIsCategoryDialogOpen,
  setIsMobileSidebarOpen,
  editCategory,
  deleteCategory,
  isMobileSidebarOpen,
  user,
  handleLogout,
}) {
  // Estado para controlar se as categorias estão abertas/fechadas (padrão: fechado)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // Bloqueia rolagem do body quando a sidebar móvel estiver aberta
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  return (
    <>
      {/* Overlay escurecido */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-[100dvh] w-[80%] max-w-sm lg:w-[260px] lg:relative z-[9999] lg:z-[30] flex flex-col bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Botão de fechar - só no mobile */}
        <div className="lg:hidden flex justify-end px-4 py-2 flex-shrink-0">
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo principal - SEM overflow geral, deixa cada seção controlar seu scroll */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          
          {/* Estatísticas Desktop - COMPACTAS */}
          <div className="hidden lg:grid grid-cols-1 gap-3 px-3 mb-4 flex-shrink-0">
            <Card className="bg-blue-500/90 text-white border border-blue-400/30 rounded-lg shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-xs font-medium">Prompts</p>
                  <p className="text-lg font-bold">{stats.total_prompts || 0}</p>
                </div>
                <BookOpen className="w-6 h-6 text-blue-100" />
              </CardContent>
            </Card>

            <Card className="bg-purple-500/90 text-white border border-purple-400/30 rounded-lg shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-xs font-medium">Categorias</p>
                  <p className="text-lg font-bold">{stats.total_categories || 0}</p>
                </div>
                <Tag className="w-6 h-6 text-purple-100" />
              </CardContent>
            </Card>

            <Card className="bg-pink-500/90 text-white border border-pink-400/30 rounded-lg shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-xs font-medium">Favoritos</p>
                  <p className="text-lg font-bold">{stats.favorite_prompts || 0}</p>
                </div>
                <Heart className="w-6 h-6 text-pink-100" />
              </CardContent>
            </Card>
          </div>

          {/* Card de Categorias - OCUPA TODO O ESPAÇO RESTANTE */}
          <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
            <Card className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] border-0 flex flex-col h-full min-h-0">
              
              {/* Header */}
              <CardHeader className="pb-2 pt-3 px-3 flex items-center justify-between flex-shrink-0">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  Minhas Categorias
                </CardTitle>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    resetCategoryForm();
                    setIsCategoryDialogOpen(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-8 w-8 p-0"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </CardHeader>

              {/* Stats inline (mobile) - COMPACTOS */}
              <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 px-3 lg:hidden flex-shrink-0">
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                  <BookOpen className="w-3 h-3" />
                  <span>{stats.total_prompts || 0}</span>
                </div>

                <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  <span>{stats.total_categories || 0}</span>
                </div>

                <div className="flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs px-2 py-1 rounded-full">
                  <Heart className="w-3 h-3" />
                  <span>{stats.favorite_prompts || 0}</span>
                </div>
              </div>

              {/* Conteúdo - FLEX-1 para ocupar todo espaço restante */}
              <CardContent className="flex-1 flex flex-col space-y-2 pb-3 px-3 min-h-0">
                
                {/* Botão "Todas as categorias" - FIXO */}
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-start font-medium h-8 text-sm flex-shrink-0"
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  Todas as categorias
                </Button>

                {/* Header clicável para expandir/recolher - FIXO */}
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex-shrink-0"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Categorias</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full font-medium">
                      {myCategories.length}
                    </span>
                  </span>
                  {isCategoriesOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Lista de categorias - OCUPA TODO ESPAÇO RESTANTE */}
                {isCategoriesOpen && (
                  <div className="flex-1 min-h-0 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Container com scroll - USA TODO O ESPAÇO DISPONÍVEL */}
                    <div className="h-full overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600 scroll-smooth">
                      {myCategories.map((category) => (
                        <div
                          key={category.id}
                          className={`flex items-center justify-between rounded-lg transition-all group ${
                            selectedCategory === category.id
                              ? "bg-blue-600 text-white shadow-sm"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className="flex items-center gap-2.5 flex-1 text-left cursor-pointer overflow-hidden px-3 py-2.5 rounded-lg"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20"
                              style={{
                                backgroundColor: category.color || "#3B82F6",
                              }}
                            ></span>
                            <span
                              className={`truncate text-sm font-medium leading-relaxed ${
                                selectedCategory === category.id
                                  ? "text-white"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                              title={category.name}
                            >
                              {category.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5 flex-shrink-0 pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 rounded-md ${
                                selectedCategory === category.id
                                  ? "text-white hover:bg-blue-700"
                                  : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-900/20"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMobileSidebarOpen(false);
                                editCategory(category);
                              }}
                              title="Editar categoria"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 rounded-md ${
                                selectedCategory === category.id
                                  ? "text-white hover:bg-blue-700"
                                  : "text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-900/20"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCategory(category.id);
                              }}
                              title="Deletar categoria"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Indicador visual de mais conteúdo abaixo */}
                    {myCategories.length > 12 && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900/95 to-transparent pointer-events-none" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rodapé fixo */}
        <FooterMobile user={user} handleLogout={handleLogout} />
      </aside>
    </>
  );
}