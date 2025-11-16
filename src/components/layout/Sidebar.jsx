// src/components/layout/Sidebar.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BookOpen, Tag, Heart, FolderPlus, Edit3, Trash2, ChevronUp, ChevronDown, Search, X, ArrowUpDown } from "lucide-react";
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
  // Estado para controlar se as categorias estão abertas/fechadas (padrão: ABERTO)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // 'name' ou 'prompts'

  // Filtrar e ordenar categorias
  const filteredAndSortedCategories = useMemo(() => {
    let result = [...myCategories];

    // Filtrar por busca
    if (searchQuery) {
      result = result.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenar
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "prompts") {
        return (b.prompt_count || 0) - (a.prompt_count || 0);
      }
      return 0;
    });

    return result;
  }, [myCategories, searchQuery, sortBy]);

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

  const toggleSort = () => {
    setSortBy(prev => prev === "name" ? "prompts" : "name");
  };

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
className={`fixed top-0 left-0 h-[100dvh] lg:h-auto lg:min-h-screen w-[80%] max-w-sm lg:w-[260px]
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Botão de fechar - só no mobile */}
        <div className="lg:hidden flex justify-end px-4 py-1.5 flex-shrink-0">
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
          <div className="hidden lg:grid grid-cols-1 gap-2 px-3 mb-2 flex-shrink-0">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[10px] font-medium opacity-90">Prompts</p>
                  <p className="text-base font-bold">{stats.total_prompts || 0}</p>
                </div>
                <BookOpen className="w-5 h-5 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[10px] font-medium opacity-90">Categorias</p>
                  <p className="text-base font-bold">{stats.total_categories || 0}</p>
                </div>
                <Tag className="w-5 h-5 opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-2 flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[10px] font-medium opacity-90">Favoritos</p>
                  <p className="text-base font-bold">{stats.favorite_prompts || 0}</p>
                </div>
                <Heart className="w-5 h-5 opacity-80" />
              </CardContent>
            </Card>
          </div>

          {/* Card de Categorias - CRESCIMENTO DINÂMICO */}
          <div className="flex-1 lg:flex-none flex flex-col min-h-0 px-3 pb-1.5">
            <Card className="rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col h-full lg:h-auto">
              
              {/* Header */}
              <CardHeader className="pb-1 pt-2 px-3 flex items-center justify-between flex-shrink-0">
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
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md h-8 w-8 p-0 shadow-sm"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </CardHeader>

              {/* Stats inline (mobile) - COMPACTOS */}
              <div className="mb-1 flex flex-wrap items-center justify-center gap-1.5 px-3 lg:hidden flex-shrink-0">
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

              {/* Conteúdo - MOBILE: flex-1 | DESKTOP: auto */}
              <CardContent className="flex-1 lg:flex-none flex flex-col space-y-1.5 pb-1.5 px-3 min-h-0">
                
                {/* Botão "Todas as categorias" - FIXO */}
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className={`w-full justify-start font-medium h-7 text-sm flex-shrink-0 transition-all ${
                    selectedCategory === null
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsMobileSidebarOpen(false);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Todas as categorias
                  </span>
                </Button>

                {/* Header clicável para expandir/recolher - FIXO */}
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex-shrink-0"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Categorias</span>
                    <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      {myCategories.length}
                    </span>
                  </span>
                  {isCategoriesOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Lista de categorias - CRESCIMENTO DINÂMICO */}
                {isCategoriesOpen && (
                  <div className="flex-1 lg:flex-none min-h-0 overflow-hidden animate-in slide-in-from-top-2 duration-300 flex flex-col space-y-1">
                    
                    {/* Barra de busca e ordenação - só aparece se houver mais de 5 categorias */}
                    {myCategories.length > 5 && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        {/* Campo de busca */}
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-8 pl-8 pr-7 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Botão de ordenação */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleSort}
                          className="h-8 w-8 flex-shrink-0 transition-all"
                          title={sortBy === "name" ? "Ordenar por quantidade de prompts" : "Ordenar alfabeticamente"}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Lista de categorias ou Empty State */}
                    {filteredAndSortedCategories.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center text-slate-400 dark:text-slate-500">
                          {searchQuery ? (
                            <>
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-medium">Nenhuma categoria encontrada</p>
                              <p className="text-xs mt-1 opacity-75">Tente outro termo de busca</p>
                            </>
                          ) : (
                            <>
                              <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-medium">Nenhuma categoria ainda</p>
                              <p className="text-xs mt-1 opacity-75">Clique em + para criar sua primeira</p>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 lg:flex-none min-h-0 lg:max-h-[600px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600 scroll-smooth">
                        {filteredAndSortedCategories.map((category) => (
                          <div
                            key={category.id}
                            className={`flex items-center justify-between rounded-lg transition-all duration-200 group ${
                              selectedCategory === category.id
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md scale-[1.02]"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:scale-[1.01]"
                            }`}
                          >
                            <div
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setIsMobileSidebarOpen(false);
                              }}
                              className="flex items-center gap-2.5 flex-1 text-left cursor-pointer overflow-hidden px-2.5 py-1.5 rounded-lg"
                            >
                              <span
                                className={`w-3 h-3 rounded-full flex-shrink-0 ring-2 transition-all ${
                                  selectedCategory === category.id
                                    ? "ring-white/30 shadow-lg"
                                    : "ring-slate-200 dark:ring-slate-700"
                                }`}
                                style={{
                                  backgroundColor: category.color || "#3B82F6",
                                }}
                              ></span>
                              
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`block truncate text-sm font-medium ${
                                    selectedCategory === category.id
                                      ? "text-white"
                                      : "text-slate-800 dark:text-slate-200"
                                  }`}
                                  title={category.name}
                                >
                                  {category.name}
                                </span>
                                {category.prompt_count !== undefined && (
                                  <span
                                    className={`text-xs ${
                                      selectedCategory === category.id
                                        ? "text-blue-100"
                                        : "text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    {category.prompt_count} {category.prompt_count === 1 ? "prompt" : "prompts"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 flex-shrink-0 pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 rounded-md transition-colors ${
                                  selectedCategory === category.id
                                    ? "text-white hover:bg-blue-800"
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
                                className={`h-7 w-7 rounded-md transition-colors ${
                                  selectedCategory === category.id
                                    ? "text-white hover:bg-blue-800"
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
                    )}

                    {/* Indicador visual de mais conteúdo abaixo */}
                    {filteredAndSortedCategories.length > 15 && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rodapé fixo - APENAS NO MOBILE */}
        <div className="lg:hidden">
          <FooterMobile user={user} handleLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
}