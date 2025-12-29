// src/components/TemplatesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
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
import { BookText } from "lucide-react";
import TemplateModal from "@/components/templates/TemplateModal";
import { useNavigate } from 'react-router-dom';
import thumbnailCache from '@/lib/thumbnailCache';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ✅ Expor cache globalmente para acesso no useEffect
if (typeof window !== 'undefined') {
  window.thumbnailCache = thumbnailCache;
  
  // ✅ SISTEMA DE FILA GLOBAL para Intersection Observer
  window.thumbnailProcessingQueue = window.thumbnailProcessingQueue || {
    queue: [],
    processing: false,
    activeCount: 0,
    maxConcurrent: 5,
  };
  
  // ✅ Expor funções globalmente para TemplateCard
  window.queueThumbnailGeneration = queueThumbnailGeneration;
  window.processSingleThumbnail = processSingleThumbnail;
}

// ✅ REACT QUERY HOOKS
import {
  useTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useToggleFavoriteTemplateMutation,
  useTemplateUsageMutation,
} from "@/hooks/useTemplatesQuery";

// ===== CONSTANTES =====
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
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

// ✅ FUNÇÃO GLOBAL: Processar thumbnail individual
async function processSingleThumbnail(videoUrl, templateId) {
  try {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        video.remove();
        reject(new Error('Timeout'));
      }, 5000);

      video.onloadedmetadata = () => {
        const safeTime = Math.min(Math.max(video.duration * 0.1, 0.5), video.duration - 0.1);
        video.currentTime = safeTime;
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const scale = Math.min(1, maxWidth / video.videoWidth);
          canvas.width = video.videoWidth * scale;
          canvas.height = video.videoHeight * scale;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          if (dataUrl && dataUrl !== 'data:,') {
            thumbnailCache.set(templateId, dataUrl);
            console.log(`✅ Thumbnail sob demanda: ${templateId}`);
          }
          
          canvas.remove();
          video.remove();
          resolve(dataUrl);
        } catch (err) {
          clearTimeout(timeout);
          video.remove();
          reject(err);
        }
      };

      video.onerror = () => {
        clearTimeout(timeout);
        video.remove();
        reject(new Error('Erro ao carregar'));
      };
    });
  } catch (error) {
    console.warn(`⚠️ Falha thumbnail ${templateId}:`, error.message);
    throw error;
  }
}

// ✅ PROCESSADOR DE FILA GLOBAL
async function processQueue() {
  const queue = window.thumbnailProcessingQueue;
  
  if (queue.processing || queue.queue.length === 0) return;
  if (queue.activeCount >= queue.maxConcurrent) return;
  
  queue.processing = true;
  
  while (queue.queue.length > 0 && queue.activeCount < queue.maxConcurrent) {
    const item = queue.queue.shift();
    if (!item) continue;
    
    queue.activeCount++;
    
    processSingleThumbnail(item.videoUrl, item.templateId)
      .then(() => {
        if (item.callback) item.callback(true);
      })
      .catch(() => {
        if (item.callback) item.callback(false);
      })
      .finally(() => {
        queue.activeCount--;
        processQueue(); // Processa próximo da fila
      });
  }
  
  queue.processing = false;
}

// ✅ ADICIONAR À FILA
function queueThumbnailGeneration(videoUrl, templateId, callback) {
  const queue = window.thumbnailProcessingQueue;
  
  // Evita duplicatas
  const exists = queue.queue.some(item => item.templateId === templateId);
  if (exists) return;
  
  queue.queue.push({ videoUrl, templateId, callback });
  processQueue();
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
  const queryClient = useQueryClient(); 
  const navigate = useNavigate();

  // ✅ REACT QUERY - Templates
  const {
    data: templates = [],
    isLoading: loading,
    isFetching: fetchingTemplates,
  } = useTemplatesQuery();

  // ✅ REACT QUERY - Mutations
  const createTemplateMutation = useCreateTemplateMutation();
  const updateTemplateMutation = useUpdateTemplateMutation();
  const deleteTemplateMutation = useDeleteTemplateMutation();
  const toggleFavoriteMutation = useToggleFavoriteTemplateMutation();
  const useTemplateMutation = useTemplateUsageMutation();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState(null);

  const openCreateTemplate = () => {
    setSelectedTemplateForModal(null);
    setExtraFiles([]);
    setIsTemplateModalOpen(true);
  };

  const openEditTemplate = (template) => {
    setSelectedTemplateForModal(template);
    setExtraFiles([]);
    setTimeout(() => {
      setIsTemplateModalOpen(true);
    }, 0);
  };

  // ✅ MANTER: Estados de categorias (fetch direto)
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [myCategories, setMyCategories] = useState([]);
  const [processingThumbnails, setProcessingThumbnails] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

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
  const [extraFiles, setExtraFiles] = useState([]);

  // ✅ MANTER: useEffect de categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await api.get("/categories");
        const all = res.data?.data || [];
        
        const templateCategories = all.filter(
          (c) => c.is_template == true || c.is_template === 1
        );
        
        setCategories(templateCategories);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
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

  useEffect(() => {
    loadMyCategories();
  }, [loadMyCategories]);

  // ===== CATEGORY MANAGEMENT =====
  const saveCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }

    try {
      const url = editingCategory ? `/categories/${editingCategory.id}` : "/categories";
      const method = editingCategory ? api.put : api.post;
      
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || "",
        color: categoryForm.color || "#6366f1",
        is_template: true,
      };

      const res = await method(url, payload);

      if (res.data.success) {
        toast.success(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
        setIsCategoryDialogOpen(false);
        setEditingCategory(null);
        setCategoryForm(INITIAL_CATEGORY_FORM);
        
        const res2 = await api.get("/categories");
        const all = res2.data?.data || [];
        setCategories(all.filter(c => c.is_template == true || c.is_template === 1));
      } else {
        toast.error(res.data.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error(error.response?.data?.error || "Erro ao salvar categoria");
    }
  }, [categoryForm, editingCategory]);

  const deleteCategory = useCallback(async (cat) => {
    if (!window.confirm(`Deseja excluir a categoria "${cat.name}"?`)) return;

    try {
      const res = await api.delete(`/categories/${cat.id}`);
      if (res.data.success) {
        toast.success("Categoria excluída!");
        
        const res2 = await api.get("/categories");
        const all = res2.data?.data || [];
        setCategories(all.filter(c => c.is_template == true || c.is_template === 1));
      } else {
        toast.error(res.data.error || "Erro ao excluir categoria");
      }
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria");
    }
  }, []);

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

  const handleExtraFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    const valid = files.filter(
      (f) => f.type === "image/png" || f.type === "image/jpeg"
    );

    if (valid.length !== files.length) {
      toast.error("Apenas PNG e JPG são permitidos no momento.");
    }

    setExtraFiles((prev) => [...prev, ...valid]);
  };

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

  // ✅ ATUALIZADO: saveTemplate com MUTATION
  const saveTemplate = useCallback(async () => {
    if (!templateForm.title.trim()) {
      toast.error("Informe o título do template");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", templateForm.title);
      formData.append("content", templateForm.content);
      formData.append("description", templateForm.description);
      formData.append(
        "tags",
        Array.isArray(templateForm.tags) ? templateForm.tags.join(",") : templateForm.tags
      );
      formData.append(
        "category_id",
        templateForm.category_id === "none" ? "" : templateForm.category_id
      );

      if (templateForm.imageFile) formData.append("file", templateForm.imageFile);
      if (templateForm.videoFile) formData.append("video", templateForm.videoFile);
      if (extraFiles.length > 0) {
        extraFiles.forEach((file) => {
          formData.append("extra_files", file);
        });
      }

      // ✅ USAR MUTATION
      if (editingTemplate?.id) {
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          formData,
        });
        toast.success("Template atualizado!");
      } else {
        await createTemplateMutation.mutateAsync({ formData });
        toast.success("Template criado!");
      }

      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateForm(INITIAL_TEMPLATE_FORM);
      setExtraFiles([]);
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error(error.message || "Erro ao salvar template");
    }
  }, [
    templateForm,
    editingTemplate,
    extraFiles,
    updateTemplateMutation,
    createTemplateMutation,
  ]);

  // ✅ CORRIGIDO: handleSaveTemplate SEM DUPLICAÇÃO
  const handleSaveTemplate = useCallback(
    async (payload, templateId) => {
      try {
        let formData;

        if (payload instanceof FormData) {
          // ✅ Payload já é FormData (vem do TemplateModal com extra_files)
          formData = payload;
        } else {
          // ✅ Cria FormData apenas se payload for objeto JSON
          formData = new FormData();
          formData.append("title", payload.title);
          formData.append("content", payload.content);
          formData.append("description", payload.description);
          formData.append(
            "tags",
            Array.isArray(payload.tags) ? payload.tags.join(",") : payload.tags || ""
          );
          formData.append("category_id", payload.categories?.[0] || "");
          formData.append("platform", payload.platform || "");

          if (payload.image_url) formData.append("image_url", payload.image_url);
          if (payload.video_url) formData.append("video_url", payload.video_url);
          if (payload.youtube_url) formData.append("youtube_url", payload.youtube_url);
        }

        // ✅ REMOVIDO: Bloco de extra_files (TemplateModal já enviou)

        // ✅ USAR MUTATION
        if (templateId) {
          await updateTemplateMutation.mutateAsync({
            id: templateId,
            formData,
          });
          toast.success("Template atualizado!");
        } else {
          await createTemplateMutation.mutateAsync({ formData });
          toast.success("Template criado!");
        }

        setIsTemplateModalOpen(false);
        setSelectedTemplateForModal(null);
        setExtraFiles([]); // ✅ Limpa estado local
      } catch (error) {
        console.error("❌ Erro ao salvar template:", error);
        toast.error(error.message || "Erro ao salvar template");
      }
    },
    [updateTemplateMutation, createTemplateMutation] // ✅ Removido extraFiles da dependência
  );

  // ✅ ATUALIZADO: deleteTemplate com MUTATION
  const deleteTemplate = useCallback(
    async (id) => {
      if (!window.confirm("Tem certeza que deseja excluir este template?")) return;

      try {
        await deleteTemplateMutation.mutateAsync(id);
        toast.success("Template excluído!");
      } catch (error) {
        console.error("Erro ao excluir template:", error);
        toast.error("Erro ao excluir template");
      }
    },
    [deleteTemplateMutation]
  );

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

// âœ… ATUALIZADO: useTemplate com MUTATION + Cache de Thumbnails
  const useTemplate = useCallback(
    async () => {
      if (!selectedTemplate) return;

      try {
        const payload = {
          title: useTemplateForm.title || selectedTemplate.title,
          category_id:
            useTemplateForm.category_id === "none" ? null : useTemplateForm.category_id,
          is_favorite: useTemplateForm.is_favorite,
        };

        // ✅ USAR MUTATION
        const result = await useTemplateMutation.mutateAsync({
          templateId: selectedTemplate.id,
          payload,
        });

        // ============================================================
        // 🆕 CORREÇÃO: Salvar thumb_url no cache após criar prompt
        // ============================================================
        if (result?.prompt?.thumb_url && result?.prompt?.id) {
          console.log(`💾 [UseTemplate] Salvando thumbnail do prompt ${result.prompt.id} no cache`);
          
          // Salva thumbnail do template no cache com ID do novo prompt
          thumbnailCache.set(result.prompt.id, result.prompt.thumb_url);
        }

        toast.success("✅ Prompt criado com sucesso!");

        setIsUseTemplateDialogOpen(false);
        setSelectedTemplate(null);
        setUseTemplateForm(INITIAL_USE_TEMPLATE_FORM);
      } catch (error) {
        console.error("Erro ao usar template:", error);
        toast.error("Erro ao usar template");
      }
    },
    [selectedTemplate, useTemplateForm, useTemplateMutation]
  );

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

  // ✅ ATUALIZADO: handleToggleFavorite com MUTATION
  const handleToggleFavorite = useCallback(
    async (template) => {
      if (!template?.id) return;

      try {
        await toggleFavoriteMutation.mutateAsync(template.id);

        const status = !template.is_favorite ? "favoritado" : "removido dos favoritos";
        toast.success(`⭐ Template ${status}!`);
      } catch (err) {
        console.error("❌ Erro no toggle de favorito:", err);
        toast.error("Erro ao alternar favorito");
      }
    },
    [toggleFavoriteMutation]
  );

  // ===== PRÉ-PROCESSAMENTO DE THUMBNAILS =====
  useEffect(() => {
    // Só processa quando templates acabaram de chegar
    if (templates.length === 0 || loading) return;
    
    // ✅ CRÍTICO: Verifica cache DIRETAMENTE (não usa estado)
    const videoTemplates = templates.filter(t => {
      if (!t.video_url || t.thumb_url) return false;
      if (t.video_url.includes('youtube') || t.video_url.includes('youtu.be')) return false;
      const templateId = t?.id || t?.prompt_id;
      return !thumbnailCache.get(templateId);
    });

    // ✅ Se não há vídeos para processar, NÃO ativa processamento
    if (videoTemplates.length === 0) {
      console.log('✅ Todos os vídeos já têm thumbnail em cache - liberando UI instantaneamente');
      return;
    }

    const processVideoThumbnails = async () => {
      const MAX_INITIAL_VIDEOS = 0;
      const videosToProcess = videoTemplates.slice(0, MAX_INITIAL_VIDEOS);
      
      if (videoTemplates.length > MAX_INITIAL_VIDEOS) {
        console.log(`⚡ Otimização: Processando apenas ${MAX_INITIAL_VIDEOS} de ${videoTemplates.length} vídeos inicialmente`);
      }

      setProcessingThumbnails(true);
      console.log(`🎬 Processando ${videosToProcess.length} thumbnails antes de liberar UI...`);

      const processBatch = async (batch) => {
        return Promise.allSettled(
          batch.map(async (template) => {
            const templateId = template?.id || template?.prompt_id;
            
            try {
              const videoUrl = template.video_url.startsWith('http') 
                ? template.video_url 
                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://api.promply.app'}/storage/${template.video_url}`;

              const video = document.createElement('video');
              video.src = videoUrl;
              video.crossOrigin = 'anonymous';
              video.muted = true;
              video.playsInline = true;
              video.preload = 'metadata';

              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  video.remove();
                  reject(new Error('Timeout ao carregar vídeo'));
                }, 5000);

                video.onloadedmetadata = () => {
                  const safeTime = Math.min(Math.max(video.duration * 0.1, 0.5), video.duration - 0.1);
                  video.currentTime = safeTime;
                };

                video.onseeked = () => {
                  clearTimeout(timeout);
                  try {
                    const canvas = document.createElement('canvas');
                    const maxWidth = 800;
                    const scale = Math.min(1, maxWidth / video.videoWidth);
                    canvas.width = video.videoWidth * scale;
                    canvas.height = video.videoHeight * scale;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    if (dataUrl && dataUrl !== 'data:,') {
                      thumbnailCache.set(templateId, dataUrl);
                      console.log(`✅ Thumbnail gerada (otimizada): ${templateId}`);
                    }
                    
                    canvas.remove();
                    video.remove();
                    resolve();
                  } catch (err) {
                    clearTimeout(timeout);
                    video.remove();
                    reject(err);
                  }
                };

                video.onerror = () => {
                  clearTimeout(timeout);
                  video.remove();
                  reject(new Error('Erro ao carregar vídeo'));
                };
              });
            } catch (error) {
              console.warn(`⚠️ Falha ao processar thumbnail ${templateId}:`, error.message);
            }
          })
        );
      };

      const batchSize = 5;
      for (let i = 0; i < videosToProcess.length; i += batchSize) {
        const batch = videosToProcess.slice(i, i + batchSize);
        await processBatch(batch);
      }

      console.log('✅ Todas as thumbnails processadas! Liberando UI...');
      setProcessingThumbnails(false);
    };

    processVideoThumbnails();
  }, [templates, loading]);

  // ===== FILTERED TEMPLATES =====
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchCat = selectedCategory === "Todos" || 
                       t.category?.name === selectedCategory;
      const matchSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, searchTerm]);

  // ===== LOADING INTELIGENTE =====
  const hasTemplatesData = templates.length > 0;
  const isInitialLoading = !hasTemplatesData && loading;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium">Carregando templates...</p>
          <p className="text-gray-400 text-xs mt-1">Buscando conteúdo do servidor</p>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 lg:hidden">
                <BookText className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-gray-900">Templates</span>
              </div>

              <div className="hidden lg:flex items-center gap-2">
                <BookText className="w-6 h-6 text-green-600" />
                <span className="text-xl font-semibold text-gray-900">
                  Biblioteca de Templates
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.is_admin && (
              <Button
                onClick={openCreateTemplate}
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

      {/* ✅ INDICADOR DE SINCRONIZAÇÃO */}
      {fetchingTemplates && !loading && (
        <div className="fixed top-20 right-6 z-50 bg-blue-500/90 backdrop-blur text-white px-3 py-1.5 rounded-full shadow-lg text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Sincronizando templates
        </div>
      )}

      {/* ✅ CORREÇÃO 1: Overlay mobile com z-30 (era z-40) */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="w-full px-6 lg:px-10 xl:px-14 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 xl:gap-8">
          {/* ✅ CORREÇÃO 2: Sidebar com z-40 (era z-50) */}
          <aside
            className={`fixed lg:static top-0 left-0 h-full lg:h-auto bg-white lg:bg-transparent w-64 lg:w-[240px] shadow-lg lg:shadow-none p-5 rounded-r-xl lg:rounded-xl transform transition-transform duration-300 ease-in-out z-40 ${
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

              {categories.map((cat) => {
  // ✅ Lógica de truncamento
  const categoryName = cat.name;
  const maxLength = 18;
  const shouldTruncate = categoryName.length > maxLength;
  const displayName = shouldTruncate 
    ? `${categoryName.substring(0, maxLength)}...` 
    : categoryName;

  return (
    <div
      key={cat.id}
      className={`group flex items-center justify-between p-2 rounded-lg transition ${
        selectedCategory === cat.name
          ? "bg-indigo-100 text-indigo-600 font-semibold"
          : "hover:bg-gray-100"
      }`}
    >
      {/* ✅ Botão com tooltip condicional */}
      {shouldTruncate ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setIsMobileSidebarOpen(false);
                }}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
              >
                <span
                  className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: cat.color || "#6366f1" }}
                />
                <span className="truncate">{displayName}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
  side="bottom"  // ← Aparece embaixo
  align="start"  // ← Alinha à esquerda
  className="bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-xl z-50"
  sideOffset={8}  // ← Espaçamento de 8px
>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color || "#6366f1" }}
                />
                <span>{categoryName}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          onClick={() => {
            setSelectedCategory(cat.name);
            setIsMobileSidebarOpen(false);
          }}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          <span
            className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: cat.color || "#6366f1" }}
          />
          <span className="truncate">{displayName}</span>
        </button>
      )}

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
  );
})}

            </div>
          </aside>

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
              CardComponent={TemplateCard}
              onShare={openUseTemplateDialog}
              onCopy={handleCopyTemplate}
              onEdit={openEditTemplate}
              onDelete={(id) => deleteTemplate(id)}
              onOpenImage={handleOpenImage}
              onOpenVideo={handleOpenVideo}
              onToggleFavorite={handleToggleFavorite}
              user={user}
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

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setSelectedTemplateForModal(null);
          setExtraFiles([]);
        }}
        onSave={handleSaveTemplate}
        template={selectedTemplateForModal}
        categories={categories}
        extraFiles={extraFiles}
        setExtraFiles={setExtraFiles}
        handleExtraFilesChange={handleExtraFilesChange}
      />

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
      {imagePreview.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
          <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-black/70">
              <h3 className="text-white font-semibold truncate flex-1 mr-4">
                {imagePreview.title || "Imagem do Template"}
              </h3>

              <div className="flex gap-2">
                <Button 
                  onClick={async () => {
                    try {
                      toast.info("⏳ Baixando imagem...");
                      
                      const extension = imagePreview.url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)?.[1] || "jpg";
                      const filename = `${imagePreview.title || 'template'}.${extension}`;
                      
                      const response = await fetch(imagePreview.url);
                      if (!response.ok) throw new Error(`HTTP ${response.status}`);
                      
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      
                      const link = document.createElement("a");
                      link.href = blobUrl;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
                      
                      toast.success("✅ Download concluído!");
                    } catch (error) {
                      console.error("❌ Erro ao baixar imagem:", error);
                      toast.error("Erro ao baixar. Abrindo em nova aba...");
                      window.open(imagePreview.url, "_blank");
                    }
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-1" /> Baixar
                </Button>
                
                <Button 
                  onClick={() => setImagePreview({ open: false, url: "", title: "" })}
                  className="bg-gray-700 text-white hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-black flex items-center justify-center">
              <img
                src={imagePreview.url}
                alt={imagePreview.title}
                className="w-full h-auto max-h-[80vh] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

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