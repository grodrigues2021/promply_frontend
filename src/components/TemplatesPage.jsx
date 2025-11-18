
// src/components/TemplatesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { BookOpenText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ===== CONSTANTES =====
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

const INITIAL_TEMPLATE_FORM = {
  title: "",
  description: "",
  content: "",
  category_id: "none",
  tags: "",
  image_url: "",
  video_url: "",
  imageFile: null,
  videoFile: null
};

const INITIAL_CATEGORY_FORM = {
  name: "",
  description: "",
  color: "#6366f1",
};

const INITIAL_USE_TEMPLATE_FORM = {
  category_id: "none",
  title: "",
  is_favorite: false,
};

// ===== HELPER FUNCTIONS =====
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function validateFile(file, allowedTypes, maxSize, typeName) {
  if (!file) return null;

  if (!allowedTypes.some(type => file.type === type)) {
    return `Selecione um ${typeName} válido`;
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return `${typeName} muito grande! Máx. ${maxSizeMB}MB`;
  }

  return null;
}

async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function captureVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const videoURL = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(videoURL);
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const thumbnailFile = new File([blob], 'video-thumbnail.jpg', { type: 'image/jpeg' });
        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        canvas.remove();
        cleanup();
        resolve({ thumbnailFile, thumbnailBase64 });
      }, 'image/jpeg', 0.8);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Erro ao processar vídeo'));
    };

    video.src = videoURL;
  });
}

// ===== COMPONENTE PRINCIPAL =====
export default function TemplatesPage({ onBack }) {
  const { user } = useAuth();

  // Estados principais
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myCategories, setMyCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Modais
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(INITIAL_TEMPLATE_FORM);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);

  const [isUseTemplateDialogOpen, setIsUseTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [useTemplateForm, setUseTemplateForm] = useState(INITIAL_USE_TEMPLATE_FORM);

  const [imagePreview, setImagePreview] = useState({ open: false, url: "", title: "" });
  const [videoPreview, setVideoPreview] = useState({ open: false, url: "" });

  // ===== EFFECTS =====
  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadMyCategories();
  }, []);

  // ===== DATA LOADING =====
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/templates");
      setTemplates(res.data?.data || []);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      const list = res.data?.data || [];
      setCategories(list.filter((c) => c.is_template));
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    }
  }, []);

  const loadMyCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      const list = res.data?.data || [];
      setMyCategories(list.filter((c) => !c.is_template));
    } catch (error) {
      console.error("Erro ao carregar categorias pessoais:", error);
    }
  }, []);

  // ===== CATEGORY MANAGEMENT =====
  const saveCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    try {
      const url = editingCategory ? `/categories/${editingCategory.id}` : "/categories";
      const method = editingCategory ? api.put : api.post;
      
      const res = await method(url, {
        ...categoryForm,
        is_template: true,
      });

      if (res.data.success) {
        toast.success(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
        setIsCategoryDialogOpen(false);
        setEditingCategory(null);
        setCategoryForm(INITIAL_CATEGORY_FORM);
        loadCategories();
      } else {
        toast.error(res.data.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error("Erro ao salvar categoria");
    }
  }, [categoryForm, editingCategory, loadCategories]);

  const deleteCategory = useCallback(async (cat) => {
    if (!window.confirm(`Deseja excluir a categoria "${cat.name}"?`)) return;

    try {
      const res = await api.delete(`/categories/${cat.id}`);
      if (res.data.success) {
        toast.success("Categoria excluída!");
        loadCategories();
      } else {
        toast.error(res.data.error || "Erro ao excluir categoria");
      }
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria");
    }
  }, [loadCategories]);

  // ===== MEDIA UPLOAD HANDLERS =====
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, 'imagem');
    if (error) {
      toast.error(error);
      return;
    }

    setUploadingMedia(true);

    try {
      const dataURL = await readFileAsDataURL(file);
      setTemplateForm(prev => ({
        ...prev,
        imageFile: file,
        image_url: dataURL
      }));
      toast.success('Imagem carregada!');
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingMedia(false);
    }
  }, []);

  const handleVideoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE, 'vídeo');
    if (error) {
      toast.error(error);
      return;
    }

    setUploadingMedia(true);

    try {
      const [videoDataURL, { thumbnailFile, thumbnailBase64 }] = await Promise.all([
        readFileAsDataURL(file),
        captureVideoThumbnail(file)
      ]);

      setTemplateForm(prev => ({
        ...prev,
        videoFile: file,
        video_url: videoDataURL,
        image_url: prev.image_url || thumbnailBase64,
        imageFile: prev.imageFile || thumbnailFile
      }));

      toast.success('Vídeo e thumbnail capturados!');
    } catch (error) {
      console.error("Erro ao processar vídeo:", error);
      toast.error('Erro ao processar vídeo');
    } finally {
      setUploadingMedia(false);
    }
  }, []);

  const removeImage = useCallback(() => {
    setTemplateForm(prev => ({ 
      ...prev, 
      image_url: '', 
      imageFile: null 
    }));
    toast.success('Imagem removida');
  }, []);

  const removeVideo = useCallback(() => {
    setTemplateForm(prev => ({ 
      ...prev, 
      video_url: '', 
      videoFile: null 
    }));
    toast.success('Vídeo removido');
  }, []);

  // ===== TEMPLATE MANAGEMENT =====
  const openTemplateDialog = useCallback(() => {
    setEditingTemplate(null);
    setTemplateForm(INITIAL_TEMPLATE_FORM);
    setIsTemplateDialogOpen(true);
  }, []);

  const editTemplate = useCallback((template) => {
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
      imageFile: null,
      videoFile: null
    });
    setIsTemplateDialogOpen(true);
  }, []);

  const saveTemplate = useCallback(async () => {
    if (!templateForm.title.trim()) {
      toast.error("Informe o título do template");
      return;
    }

    try {
      const url = editingTemplate ? `/templates/${editingTemplate.id}` : "/templates";
      const method = editingTemplate ? "PUT" : "POST";

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      let body;
      const headers = { 'Authorization': `Bearer ${token}` };

      // FormData se houver arquivos
      if (templateForm.videoFile || templateForm.imageFile) {
        body = new FormData();
        body.append("title", templateForm.title);
        body.append("content", templateForm.content);
        body.append("description", templateForm.description);
        body.append(
          "tags",
          Array.isArray(templateForm.tags) ? templateForm.tags.join(",") : templateForm.tags
        );
        body.append(
          "category_id",
          templateForm.category_id === "none" ? "" : templateForm.category_id
        );

        if (templateForm.video_url && !templateForm.videoFile) {
          body.append("video_url", templateForm.video_url);
        }

        if (templateForm.imageFile) body.append("file", templateForm.imageFile);
        if (templateForm.videoFile) body.append("video", templateForm.videoFile);
      } else {
        // JSON se não houver arquivos
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          title: templateForm.title,
          content: templateForm.content,
          description: templateForm.description,
          tags: typeof templateForm.tags === "string"
            ? templateForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : templateForm.tags,
          category_id: templateForm.category_id === "none" ? null : templateForm.category_id,
          image_url: templateForm.image_url || "",
          video_url: templateForm.video_url || "",
        });
      }

      const response = method === "PUT" 
        ? await api.put(url, body, { headers })
        : await api.post(url, body, { headers });

      if (response.data.success) {
        toast.success(editingTemplate ? "Template atualizado!" : "Template criado!");
        setIsTemplateDialogOpen(false);
        setEditingTemplate(null);
        setTemplateForm(INITIAL_TEMPLATE_FORM);
        loadTemplates();
      } else {
        toast.error(response.data.error || "Erro ao salvar template");
      }
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar template");
    }
  }, [templateForm, editingTemplate, loadTemplates]);

  const deleteTemplate = useCallback(async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const res = await api.delete(`/templates/${id}`);
      if (res.data.success) {
        toast.success("Template excluído!");
        loadTemplates();
      } else {
        toast.error(res.data.error || "Erro ao excluir template");
      }
    } catch (error) {
      console.error("Erro ao excluir template:", error);
      toast.error("Erro ao excluir template");
    }
  }, [loadTemplates]);

  // ===== USE TEMPLATE =====
  const openUseTemplateDialog = useCallback((template) => {
    if (!template) return;
    setSelectedTemplate(template);
    setUseTemplateForm({
      ...INITIAL_USE_TEMPLATE_FORM,
      title: template.title || "",
    });
    setIsUseTemplateDialogOpen(true);
  }, []);

  const useTemplate = useCallback(async () => {
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
        setSelectedTemplate(null);
        setUseTemplateForm(INITIAL_USE_TEMPLATE_FORM);
      } else {
        toast.error(res.data.error || "Erro ao usar template");
      }
    } catch (error) {
      console.error("Erro ao usar template:", error);
      toast.error("Erro ao usar template");
    }
  }, [selectedTemplate, useTemplateForm]);

  // ===== PREVIEW HANDLERS =====
  const handleOpenImage = useCallback((url, title = "") => {
    setImagePreview({ open: true, url, title });
  }, []);

  const handleOpenVideo = useCallback((url) => {
    setVideoPreview({ open: true, url });
  }, []);

  const handleCopyTemplate = useCallback(async (template) => {
    try {
      const text = template.content || template.description || "";
      await navigator.clipboard.writeText(text);
      toast.success("Conteúdo copiado!");
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast.error("Erro ao copiar conteúdo");
    }
  }, []);

  // ===== FILTERED TEMPLATES =====
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === "Todos" || t.category_name === selectedCategory;
      const matchSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchTerm]);

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (onBack ? onBack() : window.history.back())}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <BookOpenText className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-gray-900 tracking-tight">
                Biblioteca de Templates
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.is_admin && (
              <Button
                onClick={openTemplateDialog}
                className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 hover:shadow-lg transition px-4 py-2 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Novo Template
              </Button>
            )}

            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition active:scale-95"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay mobile */}
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
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                Categorias
              </h4>
              {user?.is_admin && (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm(INITIAL_CATEGORY_FORM);
                    setIsCategoryDialogOpen(true);
                  }}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
                  title="Nova categoria"
                  aria-label="Nova categoria"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[80vh]">
              <button
                onClick={() => {
                  setSelectedCategory("Todos");
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-2 rounded-lg text-left transition ${
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
                  className={`group flex items-center justify-between p-2 rounded-lg transition ${
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
                        aria-label={`Editar categoria ${cat.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="Excluir categoria"
                        aria-label={`Excluir categoria ${cat.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex flex-col gap-6">
            <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <Search className="text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-none focus:ring-0 outline-none text-sm"
                aria-label="Buscar templates"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <PromptGrid
              prompts={filteredTemplates}
              isLoading={loading}
              CardComponent={(props) => <TemplateCard {...props} user={user} />}
              onEdit={editTemplate}
              onDelete={deleteTemplate}
              onShare={openUseTemplateDialog}
              onCopy={handleCopyTemplate}
              onOpenImage={handleOpenImage}
              onOpenVideo={handleOpenVideo}
            />
          </main>
        </div>
      </div>

      {/* Modal Categoria */}
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
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Ex: Redes Sociais"
              />
            </div>

            <div>
              <Label htmlFor="cat-desc">Descrição</Label>
              <Textarea
                id="cat-desc"
                rows={2}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Breve descrição da categoria"
              />
            </div>

            <div>
              <Label htmlFor="cat-color">Cor da Categoria</Label>
              <div className="flex items-center gap-3">
                <input
                  id="cat-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-10 h-10 rounded-md border shadow-sm cursor-pointer"
                />
                <span className="text-sm text-gray-600">{categoryForm.color.toUpperCase()}</span>
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

      {/* Modal Template */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg p-6">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
            <DialogDescription>Configure os detalhes do template.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tpl-title">Título</Label>
              <Input
                id="tpl-title"
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                placeholder="Título do template"
              />
            </div>

            <div>
              <Label htmlFor="tpl-desc">Descrição</Label>
              <Textarea
                id="tpl-desc"
                rows={2}
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Descrição breve"
              />
            </div>

            <div>
              <Label htmlFor="tpl-content">Conteúdo</Label>
              <Textarea
                id="tpl-content"
                rows={6}
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder="Conteúdo do template"
              />
            </div>

            {/* Upload de Imagem */}
            <div>
              <Label>Imagem do Template (opcional)</Label>
              <div className="space-y-3">
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
                      aria-label="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <label
                  htmlFor="template-image-upload"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                    uploadingMedia
                      ? 'border-gray-300 bg-gray-50 cursor-wait'
                      : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {uploadingMedia ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      <span className="text-sm text-gray-600">Carregando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {templateForm.image_url ? 'Trocar imagem' : 'Selecionar imagem'}
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="template-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  onChange={handleImageUpload}
                  disabled={uploadingMedia}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">Formatos: JPG, PNG, SVG (máx. 5MB)</p>
              </div>
            </div>

            {/* Upload de Vídeo */}
            <div className="space-y-3">
              <Label>Vídeo do Template (opcional)</Label>

              {templateForm.video_url && templateForm.video_url.startsWith("data:video") && (
                <div className="relative w-full h-56 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <video src={templateForm.video_url} controls className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    aria-label="Remover vídeo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <label
                htmlFor="template-video-upload"
                className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                  uploadingMedia
                    ? 'border-gray-300 bg-gray-50 cursor-wait'
                    : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                }`}
              >
                {uploadingMedia ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                    <span className="text-sm text-gray-600">Carregando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 01-2.828 0L3 11.828m6-6L21 3m0 0v6m0-6h-6" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {templateForm.video_url ? 'Trocar vídeo' : 'Selecionar vídeo'}
                    </span>
                  </>
                )}
              </label>
              <input
                id="template-video-upload"
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={handleVideoUpload}
                disabled={uploadingMedia}
                className="hidden"
              />
              <p className="text-xs text-gray-500">🎞️ Formatos: MP4, WebM, OGG, MOV (máx. 50MB)</p>

              <div>
                <Label htmlFor="tpl-video-url">ou cole o link do YouTube</Label>
                <Input
                  id="tpl-video-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={templateForm.video_url?.startsWith("data:video") ? "" : templateForm.video_url || ""}
                  onChange={(e) => setTemplateForm({ ...templateForm, video_url: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tpl-tags">Tags</Label>
              <Input
                id="tpl-tags"
                placeholder="Ex: marketing, redes sociais"
                value={templateForm.tags}
                onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tpl-category">Categoria</Label>
              <Select
                value={templateForm.category_id}
                onValueChange={(v) => setTemplateForm({ ...templateForm, category_id: v })}
              >
                <SelectTrigger id="tpl-category">
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
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              onClick={saveTemplate}
            >
              {editingTemplate ? "Salvar Alterações" : "Criar Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Usar Template */}
      <Dialog open={isUseTemplateDialogOpen} onOpenChange={setIsUseTemplateDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-xl p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Usar Template</DialogTitle>
            <DialogDescription>
              Escolha uma categoria pessoal para adicionar este template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="use-title">Título</Label>
              <Input
                id="use-title"
                value={useTemplateForm.title}
                onChange={(e) => setUseTemplateForm({ ...useTemplateForm, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="use-category">Categoria</Label>
              <Select
                value={useTemplateForm.category_id}
                onValueChange={(v) => setUseTemplateForm({ ...useTemplateForm, category_id: v })}
              >
                <SelectTrigger id="use-category">
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
                id="use-favorite"
                type="checkbox"
                checked={useTemplateForm.is_favorite}
                onChange={(e) =>
                  setUseTemplateForm({ ...useTemplateForm, is_favorite: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="use-favorite">Marcar como favorito</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsUseTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              onClick={useTemplate}
            >
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Preview Imagem */}
      <Dialog open={imagePreview.open} onOpenChange={(open) => setImagePreview({ ...imagePreview, open })}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-3 border-b bg-white">
            <DialogTitle className="text-lg text-gray-900">
              {imagePreview.title || "Imagem do Template"}
            </DialogTitle>
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

      {/* Modal Preview Vídeo */}
      <Dialog open={videoPreview.open} onOpenChange={(open) => setVideoPreview({ ...videoPreview, open })}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black">
          <DialogHeader className="sr-only">
            <DialogTitle>Reproduzir Vídeo</DialogTitle>
            <DialogDescription>Player de vídeo do template</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <button
              onClick={() => setVideoPreview({ open: false, url: "" })}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
              aria-label="Fechar vídeo"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {videoPreview.url && (
              <>
                {(videoPreview.url.includes("youtube.com") || videoPreview.url.includes("youtu.be")) ? (
                  <div className="relative pt-[56.25%]">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(videoPreview.url)}?autoplay=1`}
                      title="YouTube player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative pt-[56.25%]">
                    <video
                      src={videoPreview.url}
                      controls
                      autoPlay
                      className="absolute inset-0 w-full h-full object-contain"
                      preload="metadata"
                    >
                      Seu navegador não suporta vídeos.
                    </video>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}