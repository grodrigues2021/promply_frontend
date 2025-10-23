// src/components/TemplatesPage.jsx
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  ArrowLeft,
  Check,
  Copy,
  Edit,
  Trash2,
  Plus,
  Sparkles,
  Search,
  X,
  Download,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TemplatesPage({ user, onBack }) {
  // ========= STATES PRINCIPAIS =========
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myCategories, setMyCategories] = useState([]); // ✅ ADICIONADO
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // ========= MODAIS =========
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // ========= FORMULÁRIOS =========
  const [templateForm, setTemplateForm] = useState({
    title: "",
    description: "",
    content: "",
    category_id: "none",
    tags: "",
    image_url: "",
  });
  const [editingCategory, setEditingCategory] = useState(null); // ✅ ADICIONE ESTA LINHA
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#6366f1", // indigo padrão
    is_template: true,
  });

  // ========= DIALOGO USAR TEMPLATE =========
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [useForm, setUseForm] = useState({
    title: "",
    category_id: "none",
    is_favorite: false,
  });

  // ========= MODAL DE VISUALIZAÇÃO DE IMAGEM =========
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // ========= UPLOAD DE IMAGEM =========
  const [uploadingImage, setUploadingImage] = useState(false);

  // ========= EFEITOS =========
  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadMyCategories();
  }, []);

  // 🔄 Recarrega categorias pessoais ao abrir o modal "Usar Template"
  useEffect(() => {
    if (isUseDialogOpen) {
      loadMyCategories(); // ✅ Garante que as categorias pessoais estejam atualizadas
    }
  }, [isUseDialogOpen]);

  // ========= CARREGAR TEMPLATES =========
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/templates");
      const data = res.data?.data || [];
      setTemplates(data);
    } catch (err) {
      console.error("Erro ao carregar templates:", err);
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  };

  // ========= CARREGAR CATEGORIAS (TEMPLATES PÚBLICOS) =========
  const loadCategories = async () => {
    try {
      const res = await api.get("/categories");
      const list =
        res.data?.data?.length > 0
          ? res.data.data
          : res.data?.templates || [];
      const onlyTemplates = list.filter((c) => c.is_template);
      setCategories(onlyTemplates);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      toast.error("Erro ao carregar categorias");
    }
  };

  // ========= CARREGAR CATEGORIAS PESSOAIS =========
  const loadMyCategories = async () => {
    try {
      console.log("🔄 Carregando categorias pessoais...");
      const res = await api.get("/categories");
      const list =
        res.data?.data?.length > 0
          ? res.data.data
          : res.data?.categories || [];

      // Filtra apenas as categorias pessoais (não são templates)
      const personalCats = list.filter((c) => !c.is_template);
      console.log(`✅ ${personalCats.length} categorias pessoais encontradas`);
      setMyCategories(personalCats);
      
      if (personalCats.length === 0) {
        console.log("ℹ️ Você não tem categorias pessoais ainda");
      }
    } catch (err) {
      console.error("Erro ao carregar categorias pessoais:", err);
      toast.error("Erro ao carregar suas categorias");
    }
  };
// ========= EDITAR CATEGORIA =========
const editCategory = (category) => {
  setCategoryForm({
    name: category.name,
    description: category.description || "",
    color: category.color || "#6366f1",
    is_template: true,
  });
  setEditingCategory(category);
  setIsCategoryDialogOpen(true);
};

// ========= SALVAR (atualizado para editar também) =========
const saveCategory = async () => {
  try {
    const url = editingCategory
      ? `/categories/${editingCategory.id}`
      : "/categories";
    const method = editingCategory ? api.put : api.post;

    const res = await method(url, categoryForm);
    if (res.data.success) {
      toast.success(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        description: "",
        color: "#6366f1",
        is_template: true,
      });
      loadCategories();
    } else {
      toast.error(res.data.error || "Erro ao salvar categoria");
    }
  } catch (err) {
    console.error("Erro ao salvar categoria:", err);
    toast.error("Erro ao salvar categoria");
  }
};

// ========= EXCLUIR CATEGORIA =========
const deleteCategory = async (id) => {
  if (!confirm("Tem certeza que deseja deletar esta categoria?")) return;
  try {
    const res = await api.delete(`/categories/${id}`);
    if (res.data.success) {
      toast.success("Categoria excluída!");
      loadCategories();
    } else {
      toast.error(res.data.error || "Erro ao excluir categoria");
    }
  } catch (err) {
    console.error("Erro ao excluir categoria:", err);
    toast.error("Erro ao excluir categoria");
  }
};

 
  // ========= SALVAR TEMPLATE =========
  const saveTemplate = async () => {
    if (!user?.is_admin) {
      toast.error("Apenas administradores podem criar templates");
      return;
    }

    try {
      const url = editingTemplate
        ? `/templates/${editingTemplate.id}`
        : "/templates";
      const method = editingTemplate ? api.put : api.post;

      const body = {
        title: templateForm.title,
        description: templateForm.description,
        content: templateForm.content,
        category_id:
          templateForm.category_id !== "none"
            ? Number(templateForm.category_id)
            : null,
        tags: templateForm.tags
          ? templateForm.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        image_url: templateForm.image_url || null,
      };

      const res = await method(url, body);
      if (res.data.success) {
        toast.success("Template salvo com sucesso!");
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        resetTemplateForm();
        loadTemplates();
      } else {
        toast.error(res.data.error || "Erro ao salvar template");
      }
    } catch (err) {
      console.error("Erro ao salvar template:", err);
      toast.error("Erro ao salvar template");
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      title: "",
      description: "",
      content: "",
      category_id: "none",
      tags: "",
      image_url: "",
    });
  };

  // ========= DELETAR TEMPLATE =========
  const deleteTemplate = async (id) => {
    if (!user?.is_admin) {
      toast.error("Apenas administradores podem deletar templates");
      return;
    }
    if (!confirm("Tem certeza que deseja deletar este template?")) return;

    try {
      const res = await api.delete(`/templates/${id}`);
      if (res.data.success) {
        toast.success("Template deletado!");
        loadTemplates();
      } else {
        toast.error(res.data.error || "Erro ao deletar template");
      }
    } catch (err) {
      console.error("Erro ao deletar template:", err);
      toast.error("Erro ao deletar template");
    }
  };

  // ========= EDITAR TEMPLATE =========
  const editTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      description: template.description || "",
      content: template.content || "",
      category_id: template.category_id
        ? String(template.category_id)
        : "none",
      tags: Array.isArray(template.tags)
        ? template.tags.join(", ")
        : template.tags || "",
      image_url: template.image_url || "",
    });
    setIsTemplateDialogOpen(true);
  };

  // ========= USAR TEMPLATE =========
  const openUseDialog = (template) => {
    setSelectedTemplate(template);
    setUseForm({
      title: template.title,
      category_id: "none",
      is_favorite: false,
    });
    setIsUseDialogOpen(true);
  };

  const useTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await api.post(`/templates/${selectedTemplate.id}/use`, {
        title: useForm.title || selectedTemplate.title,
        category_id:
          useForm.category_id !== "none" ? Number(useForm.category_id) : null,
        is_favorite: useForm.is_favorite,
      });

      if (res.data.success) {
        toast.success("Prompt criado a partir do template!");
        setIsUseDialogOpen(false);
        onBack?.();
        window.location.reload();
      } else {
        toast.error(res.data.error || "Erro ao usar template");
      }
    } catch (err) {
      console.error("Erro ao usar template:", err);
      toast.error("Erro ao criar prompt");
    }
  };

  // ========= COPIAR TEMPLATE =========
  const copyToClipboard = async (template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      toast.success("Template copiado!");
    } catch (err) {
      console.error("Erro ao copiar template:", err);
      toast.error("Erro ao copiar conteúdo");
    }
  };

  // ========= VISUALIZAR IMAGEM =========
  const openImageModal = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title: title });
    setIsImageModalOpen(true);
  };

  // ========= UPLOAD DE IMAGEM =========
  const handleImageUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    toast.error('Por favor, selecione uma imagem válida');
    return;
  }

  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Imagem muito grande! Máximo 5MB');
    return;
  }

  try {
    setUploadingImage(true);
    
    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setTemplateForm({ ...templateForm, image_url: base64String });
      toast.success('Imagem carregada!');
      setUploadingImage(false);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler imagem');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error('Erro ao fazer upload:', err);
    toast.error('Erro ao carregar imagem');
    setUploadingImage(false);
  }
};

  const removeImage = () => {
    setTemplateForm({ ...templateForm, image_url: '' });
    toast.success('Imagem removida');
  };

  // ========= FILTRO =========
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      selectedCategory === "Todos" ||
      (t.category_name && t.category_name === selectedCategory);
    const matchesSearch = t.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ========== JSX ==========
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              📚 Biblioteca de Templates
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user?.is_admin && (
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  resetTemplateForm();
                  setIsTemplateDialogOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:-translate-y-0.5 hover:shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                Novo Template
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6 p-6">
        {/* Sidebar */}
        <aside className="lg:w-[240px] flex-shrink-0 bg-white rounded-xl p-5 h-fit sticky top-24 shadow-sm">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 mb-5">
            <div className="text-sm opacity-90">Total de Templates</div>
            <div className="text-3xl font-bold">{templates.length}</div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Categorias</h3>
            {user?.is_admin && (
              <button
                onClick={() => setIsCategoryDialogOpen(true)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600 transition"
                title="Criar nova categoria"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div
              onClick={() => setSelectedCategory("Todos")}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border-2 transition ${
                selectedCategory === "Todos"
                  ? "border-indigo-500 bg-indigo-50/40 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-sm">Todos</span>
            </div>
           {categories.map((cat) => (
  <div
    key={cat.id}
    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border-2 transition ${
      selectedCategory === cat.name
        ? "border-indigo-500 bg-indigo-50/40 text-indigo-600 font-semibold"
        : "border-transparent text-gray-600 hover:bg-gray-100"
    }`}
    onClick={() => setSelectedCategory(cat.name)}
  >
    <span className="flex items-center gap-2 text-sm">
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: cat.color }}
      ></span>
      {cat.name}
    </span>

    {/* Botões visíveis apenas para admin */}
    {user?.is_admin && (
      <div className="flex gap-1 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            editCategory(cat);
          }}
          className="p-1 text-gray-500 hover:text-indigo-600 transition"
          title="Editar categoria"
        >
          <Edit className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteCategory(cat.id);
          }}
          className="p-1 text-gray-500 hover:text-red-600 transition"
          title="Excluir categoria"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
))}

          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col gap-6">
          {/* Search */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou tags..."
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
            <button
              onClick={() => {
                // Força re-render se necessário
                setSearchTerm(searchTerm.trim());
              }}
              className="px-5 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-md transition flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition flex items-center"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {loading
                ? "Carregando templates..."
                : `Mostrando ${filteredTemplates.length} de ${templates.length} templates`}
            </span>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="text-center text-gray-400 py-10">
              ⏳ Carregando templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              Nenhum template encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTemplates.map((t) => {
                const category = categories.find(
                  (c) => c.id === t.category_id
                );
                const color = category?.color || "#6366f1";
                return (
                  <div
                    key={t.id}
                    className="flex bg-white rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-lg transition transform hover:-translate-y-0.5 h-[200px]"
                  >
                    {/* Conteúdo esquerdo */}
                    <div className="flex-1 flex flex-col p-4 min-w-0">
                      {/* Conteúdo superior (categoria, título, descrição) */}
                      <div className="flex flex-col gap-2 flex-1">
                        <span
                          className="text-[11px] font-semibold text-white rounded-md px-2.5 py-0.5 w-fit"
                          style={{
                            backgroundColor: color,
                          }}
                        >
                          {t.category_name || "Sem categoria"}
                        </span>

                        <h3 className="text-sm font-bold leading-snug line-clamp-2">
                          {t.title}
                        </h3>

                        <p className="text-xs text-gray-500 line-clamp-3">
                          {t.description || "Sem descrição"}
                        </p>
                      </div>

                      {/* Botões - sempre no final */}
                      <div className="flex flex-wrap gap-2 items-center pt-3 mt-auto">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md transition"
                          onClick={() => openUseDialog(t)}
                        >
                          Usar Template
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            title="Copiar conteúdo"
                            onClick={() => copyToClipboard(t)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>

                          {user?.is_admin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Editar template"
                                onClick={() => editTemplate(t)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Excluir template"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => deleteTemplate(t.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

         {/* Imagem direita */}
                    <div className="w-[140px] h-full flex-shrink-0 relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600">
                      {t.image_url ? (
                        <button
                          onClick={() => openImageModal(t.image_url, t.title)}
                          className="w-full h-full relative group cursor-pointer"
                        >
                          <img
                            src={t.image_url}
                            alt={t.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                              <Search className="w-5 h-5 text-indigo-600" />
                            </div>
                          </div>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white/70 text-xs">
                          <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Sem imagem
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      {/* ========== MODAL NOVA CATEGORIA ========== */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
  {editingCategory ? "Editar Categoria" : "Criar Nova Categoria"}
</DialogTitle>

            <DialogDescription>
              Categorias ajudam a organizar seus templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  className="w-10 h-10 rounded-md border"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      color: e.target.value,
                    })
                  }
                />
                <span className="text-sm text-gray-500">
                  {categoryForm.color}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
  onClick={saveCategory}
>
  {editingCategory ? "Salvar Alterações" : "Salvar Categoria"}
</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== MODAL TEMPLATE ========== */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do template público.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={templateForm.title}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                rows={8}
                className="font-mono text-sm"
                value={templateForm.content}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, content: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                value={templateForm.tags}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, tags: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={templateForm.category_id}
                onValueChange={(v) =>
                  setTemplateForm({ ...templateForm, category_id: v })
                }
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

            {/* ✅ UPLOAD DE IMAGEM */}
            <div>
              <Label>Imagem do Template</Label>
              <div className="space-y-3">
                {/* Preview da imagem */}
                {templateForm.image_url && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <img
                      src={templateForm.image_url}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                      title="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Botão de upload */}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="image-upload"
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      uploadingImage
                        ? "border-gray-300 bg-gray-50 cursor-wait"
                        : "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50"
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-gray-600">Carregando...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {templateForm.image_url ? "Trocar imagem" : "Selecionar imagem"}
                        </span>
                      </>
                    )}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Formatos suportados: JPG, PNG, SVG (máx. 5MB)
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              onClick={saveTemplate}
            >
              Salvar Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== MODAL USAR TEMPLATE (✅ CORRIGIDO) ========== */}
      <Dialog open={isUseDialogOpen} onOpenChange={setIsUseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Usar Template: {selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              Crie um novo prompt a partir deste template e salve em suas categorias pessoais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título do novo prompt</Label>
              <Input
                value={useForm.title}
                onChange={(e) => setUseForm({ ...useForm, title: e.target.value })}
                placeholder="Título do seu prompt"
              />
            </div>

            {/* ✅ CORRIGIDO: Usa myCategories */}
            <div>
              <Label>Categoria Pessoal</Label>
              <Select
                value={useForm.category_id}
                onValueChange={(v) => setUseForm({ ...useForm, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {myCategories.length > 0 ? (
                    myCategories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          ></span>
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                      Você ainda não tem categorias pessoais.
                      <br />
                      <span className="text-xs text-gray-400">
                        Crie uma categoria na página principal primeiro.
                      </span>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fav"
                checked={useForm.is_favorite}
                onChange={(e) =>
                  setUseForm({ ...useForm, is_favorite: e.target.checked })
                }
              />
              <Label htmlFor="fav">Marcar como favorito</Label>
            </div>

            <div>
              <Label>Conteúdo do Template (preview)</Label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedTemplate?.content || "Nenhum conteúdo disponível"}
                </pre>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <Button variant="outline" onClick={() => setIsUseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              onClick={useTemplate}
            >
              Criar Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== MODAL VISUALIZAR IMAGEM ========== */}
<Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
  <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
    <DialogHeader className="p-6 pb-3 border-b">
      <DialogTitle className="text-lg">{selectedImage?.title}</DialogTitle>
      <DialogDescription>Imagem do template</DialogDescription>
    </DialogHeader>
    
    {/* ✅ Container com scroll e centralização */}
    <div className="relative w-full h-full max-h-[70vh] overflow-auto bg-gray-50 flex items-center justify-center p-6">
      <img
        src={selectedImage?.url}
        alt={selectedImage?.title}
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: 'calc(70vh - 48px)' }}
      />
    </div>
    
    <div className="flex justify-end gap-2 p-6 pt-3 border-t bg-white">
      <Button
        variant="outline"
        onClick={() => setIsImageModalOpen(false)}
      >
        Fechar
      </Button>
      <Button
        onClick={() => {
          const link = document.createElement('a');
          link.href = selectedImage?.url;
          link.download = `${selectedImage?.title || 'template'}.png`;
          link.click();
        }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar Imagem
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}