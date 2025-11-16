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

  // 🆕 Estado para controlar se as categorias estão abertas/fechadas (padrão: fechado)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  // 🔒 Bloqueia rolagem do body quando a sidebar móvel estiver aberta
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

        {/* ✅ Conteúdo SEM scroll geral (overflow-hidden) */}
<div
  className="space-y-2 pt-1 pr-1 flex-1 min-h-0 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
>
          <div className="space-y-6">
            {/* 🧩 Estatísticas Desktop - FIXAS */}
            <div className="hidden lg:grid grid-cols-1 gap-4 mb-6">
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

            {/* 🧩 Categorias */}
            <Card className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] border-0 flex flex-col">
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

              <CardContent className="space-y-2 pb-4 px-3 flex-shrink-0">
                {/* Botão "Todas" - FIXO */}
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-start font-medium"
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  Todas as categorias
                </Button>

                {/* Header clicável - FIXO */}
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Lista de Categorias ({myCategories.length})
                  </span>
                  {isCategoriesOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>

                {/* ✅ Lista com scroll INTERNO - max 20 categorias visíveis antes do scroll */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isCategoriesOpen 
                      ? "max-h-none opacity-100" 
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {/* ✅ Container interno com scroll condicional (>20 categorias) */}
<div
  className="space-y-2 pt-1 pr-1 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent"
>


                    {myCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between rounded-md transition group ${
                          selectedCategory === category.id
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className="flex items-center gap-2 flex-1 text-left cursor-pointer overflow-hidden px-3 py-2 rounded-md"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: category.color || "#3B82F6",
                            }}
                          ></span>
                          <span
                            className={`truncate text-sm font-medium leading-snug ${
                              selectedCategory === category.id
                                ? "text-white"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                            title={category.name}
                          >
                            {category.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 pr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 ${
                              selectedCategory === category.id
                                ? "text-white hover:text-blue-100"
                                : "text-slate-500 hover:text-blue-600 dark:text-slate-400"
                            }`}
                            onClick={() => {
                              setIsMobileSidebarOpen(false);
                              editCategory(category);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 ${
                              selectedCategory === category.id
                                ? "text-white hover:text-blue-100"
                                : "text-slate-500 hover:text-red-600 dark:text-slate-400"
                            }`}
                            onClick={() => deleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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