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
        <div className="lg:hidden flex justify-end px-4 py-2">
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden px-3 py-4 flex flex-col">
          <div className="space-y-6 flex-1 flex flex-col">
            
            {/* Estatísticas Desktop - FIXAS */}
            <div className="hidden lg:grid grid-cols-1 gap-4 mb-6 flex-shrink-0">
              <Card className="bg-blue-500/90 text-white border border-blue-400/30 rounded-lg shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center lg:items-start lg:justify-between">
                  <div className="hidden lg:flex flex-col w-full justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Prompts</p>
                      <BookOpen className="w-7 h-7 text-blue-100" />
                    </div>
                    <p className="text-xl font-bold mt-1">
                      {stats.total_prompts || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-500/90 text-white border border-purple-400/30 rounded-lg shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center lg:items-start lg:justify-between">
                  <div className="hidden lg:flex flex-col w-full justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Categorias</p>
                      <Tag className="w-7 h-7 text-purple-100" />
                    </div>
                    <p className="text-xl font-bold mt-1">
                      {stats.total_categories || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-pink-500/90 text-white border border-pink-400/30 rounded-lg shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center lg:items-start lg:justify-between">
                  <div className="hidden lg:flex flex-col w-full justify-between">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Favoritos</p>
                      <Heart className="w-7 h-7 text-pink-100" />
                    </div>
                    <p className="text-xl font-bold mt-1">
                      {stats.favorite_prompts || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card de Categorias */}
            <Card className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] border-0 flex flex-col flex-1 min-h-0">
              <CardHeader className="pb-3 flex items-center justify-between flex-shrink-0">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </CardHeader>

              {/* Stats inline (mobile) - FIXOS */}
              <div className="mt-2 mb-3 flex flex-wrap items-center justify-center gap-2 px-3 lg:hidden flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full shadow-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>{stats.total_prompts || 0}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm px-3 py-1.5 rounded-full shadow-sm">
                  <Tag className="w-4 h-4" />
                  <span>{stats.total_categories || 0}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm px-3 py-1.5 rounded-full shadow-sm">
                  <Heart className="w-4 h-4" />
                  <span>{stats.favorite_prompts || 0}</span>
                </div>
              </div>

              <CardContent className="space-y-3 pb-4 px-3 flex-shrink-0">
                {/* Botão "Todas as categorias" - FIXO */}
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-start font-medium h-9"
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
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Categorias</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">
                      {myCategories.length}
                    </span>
                  </span>
                  {isCategoriesOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Lista de categorias com transição suave */}
                {isCategoriesOpen && (
                  <div className="overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Container com scroll - altura adaptativa */}
                    <div className="space-y-1 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-28rem)] pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600 scroll-smooth">
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
                            className="flex items-center gap-2.5 flex-1 text-left cursor-pointer overflow-hidden px-3 py-2 rounded-lg"
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20"
                              style={{
                                backgroundColor: category.color || "#3B82F6",
                              }}
                            ></span>
                            <span
                              className={`truncate text-sm font-medium ${
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
                    {myCategories.length > 10 && (
                      <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-slate-900/90 to-transparent pointer-events-none mt-[-1.5rem]" />
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