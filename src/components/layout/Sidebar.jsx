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
  Plus,
  BookText,           // ← NECESSÁRIO PARA O BOTÃO 'Templates'
  MessageSquare,

  openNewPromptModal,   // ✔ ADICIONAR
  openTemplates,        // ✔ ADICIONAR
  openChat              // ✔ ADICIONAR
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
  className={`fixed top-0 left-0 h-[100dvh] lg:h-auto w-[80%] max-w-sm lg:w-[260px] lg:relative z-[9999] lg:z-[30] flex flex-col bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out lg:transform-none ${
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
{/* --- BOTÕES PRINCIPAIS DO MOBILE --- */}
<<div className="flex lg:hidden flex-col px-3 gap-2 mb-3">

  {/* Novo Prompt */}
  <Button
    onClick={() => {
      openNewPromptModal();
      setIsMobileSidebarOpen(false);
    }}
    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
  >
    <Plus className="w-4 h-4" />
    Novo Prompt
  </Button>

  {/* Templates */}
  <Button
    onClick={() => {
      openTemplates();
      setIsMobileSidebarOpen(false);
    }}
    className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
  >
    <BookText className="w-4 h-4" />
    Templates
  </Button>

  {/* Chat da Comunidade */}
  <Button
    onClick={() => {
      openChat();
      setIsMobileSidebarOpen(false);
    }}
    className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
  >
    <MessageSquare className="w-4 h-4" />
    Chat da Comunidade
  </Button>
</div>




            {/* Stats mobile (chips compactos) */}
<div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 px-2 lg:hidden">
  <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 
      text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
    <BookOpen className="w-3 h-3" />
    <span>{stats.total_prompts || 0}</span>
  </div>

  <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 
      text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full">
    <Tag className="w-3 h-3" />
    <span>{stats.total_categories || 0}</span>
  </div>

  <div className="flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30
      text-pink-700 dark:text-pink-300 text-xs px-2 py-1 rounded-full">
    <Heart className="w-3 h-3" />
    <span>{stats.favorite_prompts || 0}</span>
  </div>
</div>

  {/* Header minimalista */}
<div className="flex items-center justify-between mb-3">
  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
    Categorias 
  </h2>

  <Button
    size="sm"
    variant="ghost"
    onClick={() => {
      resetCategoryForm();
      setIsCategoryDialogOpen(true);
      setIsMobileSidebarOpen(false);
    }}
    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-md text-xs flex items-center gap-1"
  >
    <FolderPlus className="w-4 h-4" />
    Adicionar
  </Button>
</div>

{/* Lista minimalista + color bullets */}
<ul className="space-y-2 pl-2">
  {filteredAndSortedCategories.map((category) => (
    <li
      key={category.id}
      className={`
        group flex items-center justify-between gap-2 cursor-pointer 
        transition-colors
        ${
          selectedCategory === category.id
            ? "text-blue-600 dark:text-blue-400 font-medium"
            : "text-slate-700 dark:text-slate-300 hover:text-blue-600"
        }
      `}
    >
      {/* Clique para selecionar categoria */}
      <div
        className="flex items-center gap-2 flex-1 min-w-0"
        onClick={() => {
          setSelectedCategory(category.id);
          setIsMobileSidebarOpen(false);
        }}
      >
        {/* bolinha colorida */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: category.color || "#3B82F6",
          }}
        ></span>

        {/* nome + contador */}
        <span className="truncate text-sm">
          {category.name} ({category.prompt_count})
        </span>
      </div>

      {/* Ações (EDITAR / APAGAR) — apenas no hover */}
      <div className="flex items-center gap-1 
  opacity-100 lg:opacity-0 lg:group-hover:opacity-100 
  transition-opacity">

        <button
          onClick={(e) => {
            e.stopPropagation();
            editCategory(category);
            setIsMobileSidebarOpen(false);
          }}
          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Editar categoria"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCategory(category.id);
          }}
          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Apagar categoria"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  ))}
</ul>



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