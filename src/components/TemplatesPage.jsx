// src/components/TemplatesPage.jsx
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ArrowLeft, Plus, Search, X, Menu, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import TemplateCard from "./TemplateCard";
import PromptGrid from "./PromptGrid";

export default function TemplatesPage({ user, onBack }) {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal de template (criar/editar)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    title: "",
    description: "",
    content: "",
    category_id: "none",
    tags: "",
    image_url: "",
    video_url: "",
  });

  // Modal de categoria (criar/editar)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });

  // Modal Usar Template (escolher categoria pessoal)
  const [isUseTemplateDialogOpen, setIsUseTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [myCategories, setMyCategories] = useState([]);
  const [useTemplateForm, setUseTemplateForm] = useState({
    category_id: "none",
    title: "",
    is_favorite: false,
  });

  // 🆕 Modais de Preview de Mídia
  const [imagePreview, setImagePreview] = useState({ open: false, url: "", title: "" });
  const [videoPreview, setVideoPreview] = useState({ open: false, url: "" });

  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadMyCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/templates");
      setTemplates(res.data?.data || []);
    } catch {
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      const list = res.data?.data || [];
      setCategories(list.filter((c) => c.is_template));
    } catch {
      toast.error("Erro ao carregar categorias");
    }
  };

  const loadMyCategories = async () => {
    try {
      const res = await api.get("/categories");
      const list = res.data?.data || [];
      setMyCategories(list.filter((c) => !c.is_template));
    } catch {
      console.log("Erro ao carregar categorias pessoais");
    }
  };

  // ===== Categoria (criar/editar/excluir)
  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    try {
      const url = editingCategory
        ? `/categories/${editingCategory.id}`
        : "/categories";
      const method = editingCategory ? api.put : api.post;
      const res = await method(url, {
        name: categoryForm.name,
        description: categoryForm.description,
        color: categoryForm.color,
        is_template: true,
      });
      if (res.data.success) {
        toast.success(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
        setIsCategoryDialogOpen(false);
        setEditingCategory(null);
        setCategoryForm({ name: "", description: "", color: "#6366f1" });
        loadCategories();
      } else {
        toast.error(res.data.error || "Erro ao salvar categoria");
      }
    } catch {
      toast.error("Erro ao salvar categoria");
    }
  };

  const deleteCategory = async (cat) => {
    if (!confirm(`Deseja excluir a categoria "${cat.name}"?`)) return;
    try {
      const res = await api.delete(`/categories/${cat.id}`);
      if (res.data.success) {
        toast.success("Categoria excluída!");
        loadCategories();
      } else {
        toast.error(res.data.error || "Erro ao excluir categoria");
      }
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  };

  // ===== Template (upload, abrir modal, salvar, excluir, editar)
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await convertToBase64(file);
    setTemplateForm({ ...templateForm, image_url: base64 });
  };

  const openTemplateDialog = () => {
    setEditingTemplate(null);
    setTemplateForm({
      title: "",
      description: "",
      content: "",
      category_id: "none",
      tags: "",
      image_url: "",
      video_url: "",
    });
    setIsTemplateDialogOpen(true);
  };

  const editTemplate = (template) => {
    if (!template) return;
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title || "",
      description: template.description || "",
      content: template.content || "",
      category_id: template.category_id ? String(template.category_id) : "none",
      tags: Array.isArray(template.tags) ? template.tags.join(", ") : (template.tags || ""),
      image_url: template.image_url || "",
      video_url: template.video_url || "",
    });
    setIsTemplateDialogOpen(true);
  };

  const saveTemplate = async () => {
    try {
      const url = editingTemplate ? `/templates/${editingTemplate.id}` : "/templates";
      const method = editingTemplate ? api.put : api.post;
      const res = await method(url, templateForm);
      if (res.data.success) {
        toast.success(editingTemplate ? "Template atualizado!" : "Template criado!");
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        loadTemplates();
      } else {
        toast.error(res.data.error || "Erro ao salvar template");
      }
    } catch {
      toast.error("Erro ao salvar template");
    }
  };

  const deleteTemplate = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;
    try {
      const res = await api.delete(`/templates/${id}`);
      if (res.data.success) {
        toast.success("Template excluído!");
        loadTemplates();
      }
    } catch {
      toast.error("Erro ao excluir template");
    }
  };

  // ===== Usar Template (abre modal + submit)
  const openUseTemplateDialog = (template) => {
    if (!template) return;
    setSelectedTemplate(template);
    setUseTemplateForm({
      category_id: "none",
      title: template.title || "",
      is_favorite: false,
    });
    setIsUseTemplateDialogOpen(true);
  };

  const useTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await api.post(`/templates/${selectedTemplate.id}/use`, {
        title: useTemplateForm.title || selectedTemplate.title,
        category_id: useTemplateForm.category_id === "none" ? null : useTemplateForm.category_id,
        is_favorite: useTemplateForm.is_favorite,
      });
      if (res.data.success) {
        toast.success("Template adicionado com sucesso!");
        setIsUseTemplateDialogOpen(false);
        resetUseTemplateForm();
      } else {
        toast.error(res.data.error || "Erro ao usar template");
      }
    } catch {
      toast.error("Erro ao usar template");
    }
  };

  const resetUseTemplateForm = () => {
    setSelectedTemplate(null);
    setUseTemplateForm({ category_id: "none", title: "", is_favorite: false });
  };

  // 🆕 Funções de Preview de Mídia
  const handleOpenImage = (url, title = "") => {
    setImagePreview({ open: true, url, title });
  };

  const handleOpenVideo = (url) => {
    setVideoPreview({ open: true, url });
  };

  const filteredTemplates = templates.filter((t) => {
    const matchCat = selectedCategory === "Todos" || t.category_name === selectedCategory;
    const matchSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                  setTimeout(() => {
                    window.location.reload();
                  }, 300);
                } else {
                  window.history.back();
                  setTimeout(() => {
                    window.location.reload();
                  }, 300);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <h1 className="text-2xl font-bold flex items-center gap-2">
              📚 Biblioteca de Templates
            </h1>
          </div>

          {user?.is_admin && (
            <Button
              onClick={openTemplateDialog}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:-translate-y-0.5 hover:shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          )}

          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Overlay para fechar sidebar no mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="w-full px-6 lg:px-10 xl:px-14 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 xl:gap-8">
          {/* Sidebar */}
          <aside
            className={`fixed lg:static top-0 left-0 h-full lg:h-auto bg-white lg:bg-transparent w-64 lg:w-[240px] shadow-lg lg:shadow-none p-5 rounded-r-xl lg:rounded-xl transform transition-transform duration-300 ease-in-out z-50 ${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            {/* Cabeçalho mobile da sidebar */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Título + novo (admin) */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                Categorias
              </h4>
              {user?.is_admin && (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryDialogOpen(true);
                  }}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                  title="Nova categoria"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Lista de categorias */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[80vh]">
              <button
                onClick={() => {
                  setSelectedCategory("Todos");
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-2 rounded-lg text-left ${
                  selectedCategory === "Todos"
                    ? "bg-indigo-100 text-indigo-600 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                Todos
              </button>

              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`group flex items-center justify-between p-2 rounded-lg ${
                    selectedCategory === cat.name
                      ? "bg-indigo-100 text-indigo-600 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setIsMobileSidebarOpen(false);
                    }}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: cat.color || "#6366f1" }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>

                  {user?.is_admin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            name: cat.name,
                            description: cat.description || "",
                            color: cat.color || "#6366f1",
                          });
                          setIsCategoryDialogOpen(true);
                        }}
                        className="p-1 text-gray-500 hover:text-indigo-600"
                        title="Editar categoria"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Excluir categoria"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="flex flex-col gap-6">
            <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <Search className="text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-none focus:ring-0 outline-none text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Grid de cards */}
            <PromptGrid
              prompts={filteredTemplates}
              isLoading={loading}
              CardComponent={(props) => <TemplateCard {...props} user={user} />}
              onEdit={editTemplate}
              onDelete={(id) => deleteTemplate(id)}
              onShare={(template) => openUseTemplateDialog(template)}
              onCopy={async (template) => {
                try {
                  const text = template.content || template.description || "";
                  await navigator.clipboard.writeText(text);
                  toast.success("Conteúdo copiado!");
                } catch {
                  toast.error("Erro ao copiar conteúdo");
                }
              }}
              onOpenImage={handleOpenImage}
              onOpenVideo={handleOpenVideo}
            />
          </main>
        </div>
      </div>

      {/* === Modal Criar/Editar Categoria === */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md bg-white shadow-lg rounded-xl p-6">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria de Template"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Atualize as informações desta categoria pública."
                : "Crie uma nova categoria pública para templates."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Ex: Redes Sociais"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, description: e.target.value })
                }
                placeholder="Breve descrição da categoria"
              />
            </div>

            <div>
              <Label>Cor da Categoria</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, color: e.target.value })
                  }
                  className="w-10 h-10 rounded-md border shadow-sm cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  {categoryForm.color.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              onClick={saveCategory}
            >
              {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Modal Criar/Editar Template === */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg p-6">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
            <DialogDescription>Configure os detalhes do template.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                placeholder="Título do template"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, description: e.target.value })
                }
                placeholder="Descrição breve"
              />
            </div>

            <div>
              <Label>Conteúdo</Label>
              <Textarea
                rows={6}
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder="Conteúdo do template"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Imagem</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {templateForm.image_url && (
                  <img
                    src={templateForm.image_url}
                    alt="preview"
                    className="mt-2 w-full h-40 object-cover rounded-md border"
                  />
                )}
              </div>

              <div>
                <Label>Link do YouTube</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={templateForm.video_url}
                  onChange={(e) => setTemplateForm({ ...templateForm, video_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <Input
                placeholder="Ex: marketing, redes sociais"
                value={templateForm.tags}
                onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })}
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={templateForm.category_id}
                onValueChange={(v) => setTemplateForm({ ...templateForm, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white" onClick={saveTemplate}>
              {editingTemplate ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Modal Usar Template === */}
      <Dialog
        open={isUseTemplateDialogOpen}
        onOpenChange={(open) => {
          setIsUseTemplateDialogOpen(open);
          if (!open) resetUseTemplateForm();
        }}
      >
        <DialogContent className="max-w-md bg-white rounded-xl p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Usar Template</DialogTitle>
            <DialogDescription>
              Escolha uma categoria pessoal para adicionar este template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={useTemplateForm.title}
                onChange={(e) => setUseTemplateForm({ ...useTemplateForm, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select
                value={useTemplateForm.category_id}
                onValueChange={(v) => setUseTemplateForm({ ...useTemplateForm, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {myCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useTemplateForm.is_favorite}
                onChange={(e) =>
                  setUseTemplateForm({ ...useTemplateForm, is_favorite: e.target.checked })
                }
              />
              <Label>Marcar como favorito</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsUseTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white" onClick={useTemplate}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🆕 Modal de Preview de Imagem - COM FUNDO BRANCO FORÇADO */}
      <Dialog open={imagePreview.open} onOpenChange={(open) => setImagePreview({ ...imagePreview, open })}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-3 border-b bg-white">
            <DialogTitle className="text-lg text-gray-900">{imagePreview.title || "Imagem do Template"}</DialogTitle>
            <DialogDescription className="text-gray-600">Visualização da imagem</DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full h-full max-h-[70vh] overflow-auto bg-gray-50 flex items-center justify-center p-6">
            <img
              src={imagePreview.url}
              alt={imagePreview.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          <div className="flex justify-end gap-2 p-6 pt-3 border-t border-gray-200 bg-white">
            <Button 
              variant="outline" 
              onClick={() => setImagePreview({ open: false, url: "", title: "" })}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = imagePreview.url;
                link.download = `${imagePreview.title || 'template'}.png`;
                link.click();
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Imagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🆕 Modal de Preview de Vídeo */}
      <Dialog open={videoPreview.open} onOpenChange={(open) => setVideoPreview({ ...videoPreview, open })}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="relative pt-[56.25%]">
            <button
              onClick={() => setVideoPreview({ open: false, url: "" })}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={videoPreview.url.includes("youtube.com") || videoPreview.url.includes("youtu.be")
                ? `https://www.youtube.com/embed/${extractYouTubeId(videoPreview.url)}?autoplay=1`
                : videoPreview.url
              }
              title="Video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Função auxiliar para extrair ID do YouTube
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}