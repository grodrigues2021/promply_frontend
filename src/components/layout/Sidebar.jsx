// src/components/layout/Sidebar.jsx
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BookOpen, Tag, Heart, FolderPlus, Edit3, Trash2 } from "lucide-react";

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
}) {
  return (
    <aside
      className={`promply-sidebar relative ${
        isMobileSidebarOpen ? "mobile-open" : ""
      } z-40 h-[calc(100dvh-4rem)] overflow-y-auto`}
    >
      <div className="space-y-6">
        {/* 🧩 Estatísticas Desktop */}
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
        <Card className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] flex flex-col h-full border-0">
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">
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

          <CardContent className="flex-1 overflow-y-auto space-y-2 pr-1 pb-20">
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

            {myCategories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center justify-between rounded-md transition group ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-50 text-slate-700"
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
                        : "text-slate-800"
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
                        : "text-slate-500 hover:text-blue-600"
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
                        : "text-slate-500 hover:text-red-600"
                    }`}
                    onClick={() => deleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
