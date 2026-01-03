// ==========================================
// src/components/PromptManager.jsx
// ✅ VERSÃO CORRIGIDA COM PROTEÇÃO ANTI-DOUBLE-CLICK
// ✅ Correção do estado da sidebar resetando
// ✅ Validação de media_type melhorada
// ✅ Função de duplicar prompt com proteção contra duplicatas
// ✅ Feedback de erro melhorado
// ==========================================

import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Label } from "./ui/label";
import {
  Search,
  Copy,
  Edit,
  Edit3,
  Trash2,
  StarOff,
  Database,
  FolderPlus,
  Tag,
  BookOpen,
  Heart,
  Share2,
  X,
  Menu,
  BookText,
  MessageSquare,
  Star,
  Plus,
  Download,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import PromplyLogo from "../assets/promply-logo.svg";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import TemplatesPage from "./TemplatesPage.jsx";
import PromptCard from "./PromptCard";
import PromptGrid from "./PromptGrid";
import api from "../lib/api";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import FooterMobile from "./layout/FooterMobile";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

import { createPortal } from "react-dom";

import { 
  usePromptsQuery,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useToggleFavoriteMutation,
  startMediaUpload,
  endMediaUpload   
} from "../hooks/usePromptsQuery";

import { useCategoriesQuery } from "../hooks/useCategoriesQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useStats } from "../hooks/useStats";
import { debounce } from "lodash";
import { resolveMediaUrl } from "../lib/media";
import PromptModal from "./PromptModal";

// ✅ CORREÇÃO: Breakpoint consistente com Tailwind
const MOBILE_BREAKPOINT = 1024; // lg: em Tailwind
const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

const SharePromptModal = React.lazy(() =>
  import(
    /* webpackChunkName: "SharePromptModal", webpackMode: "lazy" */
    "./SharePromptModal"
  )
);

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const safeCreateObjectURL = (file) => {
  try {
    if (file instanceof File || file instanceof Blob) {
      return URL.createObjectURL(file);
    }
    return "";
  } catch (error) {
    console.error("❌ Erro ao criar objectURL:", error);
    return "";
  }
};

export default function PromptManager({
  setIsAuthenticated,
  setUser,
  defaultView = "prompts",
  isPopupMode = false,
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ChatComponent, setChatComponent] = useState(null);

  const { 
    data: promptsData = [], 
    isLoading: loadingPrompts,
    isFetching: fetchingPrompts
  } = usePromptsQuery();

  const { 
    data: categoriesData, 
    isLoading: loadingCategories,
    isFetching: fetchingCategories
  } = useCategoriesQuery();

  const { data: stats = {} } = useStats();

  const createPromptMutation = useCreatePromptMutation();
  const updatePromptMutation = useUpdatePromptMutation();
  const deletePromptMutation = useDeletePromptMutation();
  const toggleFavoriteMutation = useToggleFavoriteMutation();

  const [activeView, setActiveView] = useState(defaultView);
  const [myCategories, setMyCategories] = useState([]);
  const [templateCategories, setTemplateCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [dbConnected, setDbConnected] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [promptToShare, setPromptToShare] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // ✅ CORREÇÃO: Estado da sidebar com ref para evitar loops
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarStateRef = useRef(false);
  
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [isChatDetached, setIsChatDetached] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  const [extraFiles, setExtraFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const extraFilesInputRef = useRef(null);
  const isRestoringDraft = useRef(false);

  // 🔴 NOVO: Estado para proteção contra double-click na duplicação
  const [duplicatingIds, setDuplicatingIds] = useState(new Set());

  const [formErrors, setFormErrors] = useState({
    title: "",
    content: ""
  });

  const [promptForm, setPromptForm] = useState({
    title: "",
    content: "",
    description: "",
    tags: "",
    category_id: "none",
    platform: "chatgpt",
    is_favorite: false,
    image_url: "",
    video_url: "",
    youtube_url: "",
    videoFile: null,
    imageFile: null,
    selectedMedia: "none",
    media_type: "none",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    is_template: false,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // ✅ CORREÇÃO: Monitorar mudanças de estado da sidebar
  useEffect(() => {
    console.log('🔄 SIDEBAR STATE MUDOU:', {
      isMobileSidebarOpen,
      timestamp: new Date().toLocaleTimeString(),
      width: window.innerWidth,
      isMobile: window.innerWidth < MOBILE_BREAKPOINT
    });
    
    sidebarStateRef.current = isMobileSidebarOpen;
  }, [isMobileSidebarOpen]);

  // ✅ CORREÇÃO: Detectar resets não intencionais
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (sidebarStateRef.current === true && isMobileSidebarOpen === false) {
        console.error('❌ ESTADO RESETADO DETECTADO!');
        console.trace('Stack trace do reset:');
      }
    }, 100);
    
    return () => clearInterval(checkInterval);
  }, [isMobileSidebarOpen]);

  // ✅ CORREÇÃO: useEffect de resize SEM dependência circular
  useEffect(() => {
    const handleResize = () => {
      const isMobileNow = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Usar ref ao invés do estado para evitar loop
      if (!isMobileNow && sidebarStateRef.current) {
        console.log('📱 Mudou para desktop - fechando sidebar');
        setIsMobileSidebarOpen(false);
      }
    };

    // Debounce para evitar múltiplas chamadas
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []); // ✅ Array vazio - sem dependências!

  // ✅ Handlers
  const handleExtraFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(
      (f) => f.type === "image/png" || f.type === "image/jpeg"
    );

    if (valid.length !== files.length) {
      toast.error("Apenas PNG e JPG são permitidos no momento.");
    }

    setExtraFiles((prev) => [...prev, ...valid]);
  };

  const removeExtraFile = (indexToRemove) => {
    setExtraFiles((prev) => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove);
      return newFiles;
    });
    toast.success("Arquivo removido");
  };

  const clearAllExtraFiles = () => {
    setExtraFiles([]);
    if (extraFilesInputRef.current) {
      extraFilesInputRef.current.value = "";
    }
    toast.success("Todos os arquivos removidos");
  };

  const removeAttachment = async (attachmentId, promptId) => {
    if (!promptId || promptId === undefined || promptId === null) {
      toast.error("Erro: ID do prompt não encontrado. Feche e reabra o modal de edição.");
      return;
    }

    if (!attachmentId || attachmentId === undefined || attachmentId === null) {
      toast.error("Erro: ID do anexo não encontrado.");
      return;
    }

    if (!confirm("Tem certeza que deseja remover este anexo?")) return;

    try {
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      toast.success("📎 Anexo removido!");

      const response = await api.delete(`/prompts/${promptId}/files/${attachmentId}`);
      
      if (response.data?.success) {
        queryClient.invalidateQueries(["prompts"]);
      } else {
        toast.error("Erro ao remover anexo no servidor");
        queryClient.invalidateQueries(["prompts"]);
      }
    } catch (error) {
      console.error("❌ Erro ao remover anexo:", error);
      toast.error("Falha ao remover anexo");
      queryClient.invalidateQueries(["prompts"]);
    }
  };

  const validateForm = () => {
    let errors = { title: "", content: "" };
    let isValid = true;

    if (!promptForm.title?.trim()) {
      errors.title = "Título é obrigatório";
      isValid = false;
    }

    if (!promptForm.content?.trim()) {
      errors.content = "Conteúdo é obrigatório";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const hasUnsavedContent = useCallback(() => {
    return (
      promptForm.title?.trim() ||
      promptForm.content?.trim() ||
      promptForm.description?.trim() ||
      promptForm.tags?.trim() ||
      promptForm.image_url ||
      promptForm.video_url ||
      promptForm.youtube_url ||
      extraFiles.length > 0
    );
  }, [promptForm, extraFiles]);

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        toast.warning("Selecione um arquivo antes de enviar.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Selecione uma imagem válida (JPG, PNG, SVG).");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande! Máx. 5MB.");
        return;
      }

      setUploadingImage(true);
      const loadingToast = toast.loading("Enviando imagem...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload", formData);
      
      const uploadedUrl = res.data?.image_url || res.data?.url || "";
      if (uploadedUrl) {
        setPromptForm((prev) => ({
          ...prev,
          imageFile: file,
          image_url: uploadedUrl,
        }));
        toast.dismiss(loadingToast);
        toast.success("✅ Upload concluído!");
      } else {
        toast.error("Erro: servidor não retornou URL da imagem.");
      }
    } catch (err) {
      console.error("❌ Erro no upload:", err);
      toast.dismiss();
      toast.error("Falha ao enviar imagem.");
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeImage = useCallback(() => {
    setPromptForm((prev) => ({ ...prev, image_url: "" }));
    toast.success("Imagem removida");
  }, []);

  const handleVideoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um vídeo válido");
      return;
    }

    const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Vídeo muito grande. Máximo permitido: 20MB.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    toast.info("🎬 Gerando thumbnail do vídeo...");

    const videoURL = safeCreateObjectURL(file);
    if (!videoURL) {
      toast.error("Erro ao processar vídeo");
      setUploadingImage(false);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const thumbnailTimeout = setTimeout(() => {
      setPromptForm((prev) => ({
        ...prev,
        videoFile: file,
        imageFile: null,
        image_url: "",
        youtube_url: "",
      }));
      cleanup();
    }, 4000);

    const cleanup = () => {
      clearTimeout(thumbnailTimeout);
      video.remove();
      setUploadingImage(false);
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(1, video.duration / 2);
      } catch (err) {
        // Ignorar erro de seek
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setPromptForm((prev) => ({
                ...prev,
                videoFile: file,
                imageFile: null,
                image_url: "",
                youtube_url: "",
              }));
              cleanup();
              return;
            }

            const thumbnailFile = new File([blob], "video-thumbnail.jpg", {
              type: "image/jpeg",
            });

            setPromptForm((prev) => ({
              ...prev,
              videoFile: file,
              imageFile: thumbnailFile,
              image_url: safeCreateObjectURL(thumbnailFile),
              youtube_url: "",
            }));

            canvas.remove();
            cleanup();
          },
          "image/jpeg",
          0.8
        );
      } catch (err) {
        console.error("❌ Erro ao gerar thumbnail:", err);
        setPromptForm((prev) => ({
          ...prev,
          videoFile: file,
          imageFile: null,
          image_url: "",
          youtube_url: "",
        }));
        cleanup();
      }
    };

    video.onerror = () => {
      console.error("❌ Erro ao carregar vídeo");
      toast.error("Erro ao processar vídeo. O prompt ainda pode ser salvo.");
      setPromptForm((prev) => ({
        ...prev,
        videoFile: file,
        imageFile: null,
        image_url: "",
        youtube_url: "",
      }));
      cleanup();
    };

    video.src = videoURL;
  }, []);

  const extractYouTubeId = useCallback((url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  }, []);

  const getYouTubeThumbnail = useCallback((url) => {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }, [extractYouTubeId]);

  const normalizeTags = useCallback((tags) => {
    if (!tags) return "";
    if (Array.isArray(tags)) return tags.join(", ");
    return tags;
  }, []);

  const resetPromptForm = useCallback(() => {
    setPromptForm({
      title: "",
      content: "",
      description: "",
      tags: "",
      category_id: "none",
      platform: "chatgpt",
      is_favorite: false,
      image_url: "",
      video_url: "",
      youtube_url: "",
      videoFile: null,
      imageFile: null,
      selectedMedia: "none",
      media_type: "none",
    });
    
    if (!isEditMode) {
      setEditingPrompt(null);
    }
    setIsEditMode(false);

    setExtraFiles([]);
    setAttachments([]);
    setFormErrors({ title: "", content: "" });
    
    if (extraFilesInputRef.current) {
      extraFilesInputRef.current.value = "";
    }
  }, [isEditMode]);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({
      name: "",
      description: "",
      color: "#3B82F6",
      is_template: false,
    });
    setEditingCategory(null);
  }, []);

  const editPrompt = useCallback(async (prompt) => {
    setIsEditMode(true);
    setEditingPrompt(prompt);

    const normalizedImage =
      prompt.imageUrl ||
      prompt.image_url ||
      prompt.thumb_url ||
      "";

    const mediaType = prompt.media_type || (
      prompt.youtube_url ? "youtube" :
      prompt.video_url ? "video" :
      normalizedImage ? "image" : "none"
    );

    const formData = {
      id: prompt.id || null,
      title: prompt.title || "",
      content: prompt.content || "",
      description: prompt.description || "",
      tags: prompt.tags || "",
      category_id: String(prompt.category_id || "none"),
      image_url: normalizedImage,
      thumb_url: prompt.thumb_url || "",
      videoFile: null,
      video_url: prompt.video_url || "",
      youtube_url: prompt.youtube_url || "",
      youtube_id: extractYouTubeId(prompt.youtube_url) || "",
      is_favorite: prompt.is_favorite || false,
      platform: prompt.platform || "chatgpt",
      selectedMedia: mediaType,
      media_type: mediaType,
    };

    setPromptForm(formData);

    try {
      const response = await api.get(`/prompts/${prompt.id}/files`);
      
      if (response.data?.success && response.data?.data) {
        const extraFilesOnly = response.data.data.filter(file => 
  !['video', 'thumbnail', 'image'].includes(file.file_type)
);
setAttachments(extraFilesOnly);
      } else {
        setAttachments([]);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setAttachments([]);
      } else {
        console.error("❌ Erro ao carregar anexos:", error);
        setAttachments([]);
      }
    }

    setIsPromptDialogOpen(true);
  }, [extractYouTubeId]);

  const editCategory = useCallback((category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      color: category.color,
      is_template: category.is_template || false,
    });
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const response = await api.get("/stats");
      const data = response.data;

      if (data.success) {
        setDbConnected(true);
        toast.success("Conexão com o banco estabelecida!");

        await Promise.all([
          queryClient.invalidateQueries(["prompts"]),
          queryClient.invalidateQueries(["categories"]),
          queryClient.invalidateQueries(["stats"]),
        ]);
      } else {
        setDbConnected(false);
        toast.error("Falha ao conectar com o banco de dados!");
      }
    } catch (error) {
      setDbConnected(false);
      toast.error("Erro ao verificar conexão com o banco!");
    }
  }, [queryClient]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      window.location.href = "/";
    }
  }, [logout]);

  const handlePromptSaved = useCallback(() => {
    queryClient.invalidateQueries(["prompts"]);
    queryClient.invalidateQueries(["categories"]);
    queryClient.invalidateQueries(["stats"]);
    toast.success("✅ Prompt adicionado com sucesso!");
  }, [queryClient]);

  const openChatFromTopButton = () => {
    if (window.innerWidth < 768) {
      setShowChatModal(true);
    } else {
      openChatIntelligently();
    }
  };

  const openChatIntelligently = useCallback(() => {
    if (isChatDetached) {
      const channel = new BroadcastChannel("promply-chat-status");
      channel.postMessage({ type: "focus-chat" });
      channel.close();
      toast.success("💬 Chat destacado atualizado!");
    } else {
      setShowChatModal(true);
    }
  }, [isChatDetached]);

  useEffect(() => {
    if (categoriesData) {
      setMyCategories(categoriesData.my);
      setTemplateCategories(categoriesData.templates);
    }
  }, [categoriesData]);

  useEffect(() => {
    const channel = new BroadcastChannel("promply-chat-status");

    channel.onmessage = (event) => {
      if (event.data.type === "chat-detached") {
        setIsChatDetached(true);
        setShowChatModal(false);
      } else if (event.data.type === "chat-closed") {
        setIsChatDetached(false);
      } else if (event.data.type === "pong") {
        setIsChatDetached(true);
        setShowChatModal(false);
      }
    };

    channel.postMessage({ type: "ping" });
    return () => channel.close();
  }, []);

  useEffect(() => {
    if (showChatModal && !ChatComponent) {
      import("./ChatContainer.jsx").then((module) => {
        setChatComponent(() => module.default);
      });
    }
  }, [showChatModal]);

  useEffect(() => {
    if (!isPromptDialogOpen) {
      setIsSaving(false);
      
      const orphanOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      orphanOverlays.forEach(overlay => {
        if (overlay.getAttribute('data-state') === 'closed') {
          overlay.remove();
        }
      });
    }
  }, [isPromptDialogOpen]);

  useEffect(() => {
    if (!isPromptDialogOpen) return;
    if (isEditMode || editingPrompt) return;
    if (isRestoringDraft.current) return;

    const isFormEmpty =
      !promptForm.title?.trim() &&
      !promptForm.content?.trim() &&
      !promptForm.description?.trim() &&
      !promptForm.tags?.trim() &&
      !promptForm.image_url &&
      !promptForm.video_url &&
      !promptForm.youtube_url;

    if (!isFormEmpty) return;

    const draft = localStorage.getItem("prompt-draft");
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft);

      const hasContent =
        parsed.title?.trim() ||
        parsed.content?.trim() ||
        parsed.description?.trim() ||
        parsed.tags?.trim();

      if (!hasContent) {
        localStorage.removeItem("prompt-draft");
        return;
      }

      isRestoringDraft.current = true;

      const shouldRestore = confirm(
        "📋 Rascunho detectado!\n\nDeseja recuperar o prompt não salvo?"
      );

      if (shouldRestore) {
        setPromptForm(parsed);
      } else {
        localStorage.removeItem("prompt-draft");
      }

      setTimeout(() => {
        isRestoringDraft.current = false;
      }, 500);
    } catch (error) {
      console.error("❌ Erro ao restaurar rascunho:", error);
      localStorage.removeItem("prompt-draft");
      isRestoringDraft.current = false;
    }
  }, [isPromptDialogOpen, isEditMode, editingPrompt]);

  useEffect(() => {
    if (isPopupMode && defaultView === "chat") {
      setShowChatModal(true);
    }
  }, [isPopupMode, defaultView]);

  const filteredPrompts = Array.isArray(promptsData)
    ? promptsData.filter((prompt) => {
        const matchesSearch =
          prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (prompt.tags &&
            (Array.isArray(prompt.tags)
              ? prompt.tags.some((tag) =>
                  tag.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : prompt.tags.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchesCategory =
          !selectedCategory || prompt.category_id === selectedCategory;
        const matchesFavorites = !showFavoritesOnly || prompt.is_favorite;
        return matchesSearch && matchesCategory && matchesFavorites;
      })
    : [];

  const savePrompt = async (updatedFormFromModal) => {
    if (isSaving) return;

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('Preparando...');

    try {
      const formToSave = updatedFormFromModal || promptForm;
      
      const finalMediaType = formToSave.media_type || (
        formToSave.youtube_url?.trim() ? 'youtube' :
        formToSave.video_url?.trim() || formToSave.videoFile ? 'video' :
        formToSave.image_url?.trim() || formToSave.imageFile ? 'image' : 'none'
      );
      
      if (isEditMode && editingPrompt?.id && editingPrompt?.media_type && editingPrompt.media_type !== 'none') {
        const originalType = editingPrompt.media_type;
        
        if (finalMediaType !== originalType && finalMediaType !== 'none') {
          toast.error(
            `❌ Não é possível mudar o tipo de mídia!\n\n` +
            `Tipo original: ${originalType}\n` +
            `Tipo atual: ${finalMediaType}\n\n` +
            `Remova a capa primeiro para adicionar outro tipo.`
          );
          setIsSaving(false);
          setIsUploading(false);
          return;
        }
      }
      
      if (isEditMode && editingPrompt?.id) {
        const promptId = editingPrompt.id;

        setUploadStage('Atualizando prompt...');
        setUploadProgress(10);

        const payload = {
          title: formToSave.title,
          content: formToSave.content,
          description: formToSave.description || "",
          tags: formToSave.tags || "",
          platform: formToSave.platform || "chatgpt",
          is_favorite: formToSave.is_favorite || false,
          youtube_url: formToSave.youtube_url || "",
          media_type: finalMediaType,
          category_id:
            formToSave.category_id !== "none"
              ? parseInt(formToSave.category_id)
              : null,
        };

        await updatePromptMutation.mutateAsync({
          id: promptId,
          data: payload,
        });

        setUploadProgress(30);

        const mediaForm = new FormData();
        let hasMedia = false;

        if (formToSave.imageFile instanceof File && !formToSave.videoFile) {
          mediaForm.append("image", formToSave.imageFile);
          hasMedia = true;
        }

        if (formToSave.videoFile instanceof File) {
          mediaForm.append("video", formToSave.videoFile);
          hasMedia = true;

          if (formToSave.thumbnailBlob instanceof Blob) {
            mediaForm.append("thumbnail", formToSave.thumbnailBlob, 'thumbnail.jpg');
          } else if (formToSave.imageFile instanceof File) {
            mediaForm.append("thumbnail", formToSave.imageFile);
          }
        }

        if (extraFiles.length > 0) {
          extraFiles.forEach((file) =>
            mediaForm.append("extra_files", file)
          );
          hasMedia = true;
        }

        if (hasMedia) {
          try {
            startMediaUpload();
            setUploadStage('Enviando mídia...');
            setUploadProgress(40);

            const mediaResponse = await api.post(
              `/prompts/${promptId}/media`,
              mediaForm,
              {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 180000,
                onUploadProgress: (progressEvent) => {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 50) / progressEvent.total + 40
                  );
                  setUploadProgress(Math.min(percentCompleted, 90));
                },
              }
            );

            setUploadProgress(95);

            if (mediaResponse.data?.data) {
              queryClient.setQueryData(["prompts"], (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((p) =>
                  p.id === promptId
                    ? { ...p, ...mediaResponse.data.data }
                    : p
                );
              });
            }
          } catch (err) {
            toast.warning(
              "Prompt atualizado, mas houve erro no upload da mídia."
            );
          } finally {
            endMediaUpload();
          }
        }

        setUploadStage('Finalizando...');
        setUploadProgress(100);

        toast.success("✅ Prompt atualizado com sucesso!");
        
        setTimeout(() => {
          resetPromptForm();
          setIsPromptDialogOpen(false);
          setIsUploading(false);
          setUploadProgress(0);
          setUploadStage('');
        }, 500);

        queryClient.invalidateQueries(["stats"]);
        queryClient.invalidateQueries(["categories"]);

        return;
      }

      const tempId = `temp-${Date.now()}`;

      const clientId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const imageBlobUrl = safeCreateObjectURL(formToSave.imageFile);
      const videoBlobUrl = safeCreateObjectURL(formToSave.videoFile);

      let thumbUrl = "";

      if (formToSave.videoFile && formToSave.imageFile) {
        thumbUrl = safeCreateObjectURL(formToSave.imageFile);
      } else if (formToSave.youtube_url) {
        const ytThumb = getYouTubeThumbnail(formToSave.youtube_url);
        if (ytThumb) thumbUrl = ytThumb;
      }

      const optimisticPrompt = {
        id: tempId,
        _tempId: tempId,
        _clientId: clientId,
        _isOptimistic: true,
        _skipAnimation: false,

        title: formToSave.title,
        content: formToSave.content,
        description: formToSave.description || "",
        tags: formToSave.tags || "",
        platform: formToSave.platform || "chatgpt",
        is_favorite: formToSave.is_favorite || false,
        youtube_url: formToSave.youtube_url || "",
        category_id:
          formToSave.category_id !== "none"
            ? parseInt(formToSave.category_id)
            : null,

        media_type: finalMediaType,

        image_url: imageBlobUrl || "",
        video_url: videoBlobUrl || "",
        thumb_url: thumbUrl || "",

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };

      let realPrompt;

      setUploadStage('Criando prompt...');
      setUploadProgress(10);

      const basePayload = {
        title: formToSave.title,
        content: formToSave.content,
        description: formToSave.description || "",
        tags: formToSave.tags || "",
        platform: formToSave.platform || "chatgpt",
        is_favorite: formToSave.is_favorite || false,
        media_type: finalMediaType,
        category_id:
          formToSave.category_id !== "none"
            ? parseInt(formToSave.category_id)
            : null,
      };

      if (formToSave.youtube_url) {
        realPrompt = await createPromptMutation.mutateAsync({
          payload: {
            ...basePayload,
            youtube_url: formToSave.youtube_url,
          },
          optimisticPrompt,
        });
      } else {
        realPrompt = await createPromptMutation.mutateAsync({
          payload: basePayload,
          optimisticPrompt,
        });
      }

      setUploadProgress(30);

      if (!realPrompt?.id) {
        throw new Error("Backend não retornou o prompt criado");
      }

      const promptId = realPrompt.id;

      const hasImage =
        formToSave.imageFile instanceof File &&
        !formToSave.videoFile &&
        !formToSave.youtube_url;

      const hasVideo = 
        formToSave.videoFile instanceof File &&
        !formToSave.youtube_url;

      const needsMediaUpload = 
        hasImage || hasVideo || extraFiles.length > 0;

      const imageFileToUpload = formToSave.imageFile;
      const videoFileToUpload = formToSave.videoFile;
      const thumbnailBlobToUpload = formToSave.thumbnailBlob;
      const extraFilesToUpload = [...extraFiles];

      localStorage.removeItem("prompt-draft");
      
      toast.success("✅ Prompt criado com sucesso!");

      setUploadStage('Finalizando...');
      setUploadProgress(needsMediaUpload ? 35 : 100);

      if (!needsMediaUpload) {
        setTimeout(() => {
          resetPromptForm();
          setIsPromptDialogOpen(false);
          setIsUploading(false);
          setUploadProgress(0);
          setUploadStage('');
        }, 500);
      } else {
        resetPromptForm();
        setIsPromptDialogOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStage('');
      }

      queryClient.invalidateQueries(["stats"]);
      queryClient.invalidateQueries(["categories"]);

      if (promptId && needsMediaUpload) {
        const mediaForm = new FormData();

        if (hasImage && imageFileToUpload) {
          mediaForm.append("image", imageFileToUpload);
        }

        if (hasVideo && videoFileToUpload) {
          mediaForm.append("video", videoFileToUpload);
          
          if (thumbnailBlobToUpload instanceof Blob) {
            mediaForm.append("thumbnail", thumbnailBlobToUpload, 'thumbnail.jpg');
          } else if (imageFileToUpload instanceof File) {
            mediaForm.append("thumbnail", imageFileToUpload);
          }
        }

        if (extraFilesToUpload.length > 0) {
          extraFilesToUpload.forEach((file) => {
            mediaForm.append("extra_files", file);
          });
        }

        startMediaUpload();

        api
          .post(`/prompts/${promptId}/media`, mediaForm, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 180000,
          })
          .then((res) => {
            if (res.data?.data) {
              queryClient.setQueryData(["prompts"], (old) => {
                if (!Array.isArray(old)) return old;

                return old.map((p) => {
                  if (p.id === promptId) {
                    const newPrompt = {
                      ...res.data.data,
                      _uploadingMedia: false,
                      _clientId: p._clientId,
                    };
                    return newPrompt;
                  }
                  return p;
                });
              });

              toast.success("🎬 Mídia enviada com sucesso!");
            }
          })
          .catch((err) => {
            queryClient.setQueryData(["prompts"], (old) => {
              if (!Array.isArray(old)) return old;
              return old.map((p) =>
                p.id === promptId ? { ...p, _uploadingMedia: false } : p
              );
            });

            toast.warning("Prompt criado, mas houve erro no upload da mídia.");
          })
          .finally(() => {
            endMediaUpload();
          });
      }

      queryClient.invalidateQueries(["stats"]);
      queryClient.invalidateQueries(["categories"]);
    } catch (error) {
      console.error("❌ Erro ao salvar prompt:", error);
      toast.error(error.message || "Erro ao salvar prompt");
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCategory = async () => {
    try {
      const response = editingCategory
        ? await api.put(`/categories/${editingCategory.id}`, categoryForm)
        : await api.post("/categories", categoryForm);
      const data = response.data;
      if (data.success) {
        queryClient.invalidateQueries(["categories"]);
        queryClient.invalidateQueries(["stats"]);
        resetCategoryForm();
        setIsCategoryDialogOpen(false);
        toast.success(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
      } else {
        toast.error(data.error || "Erro ao salvar categoria");
      }
    } catch {
      toast.error("Erro ao salvar categoria");
    }
  };

  const deleteCategory = async (id) => {
    if (!id) {
      toast.error("Categoria inválida!");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      setMyCategories((prev) => prev.filter((cat) => cat.id !== id));

      const response = await api.delete(`/categories/${id}`);
      const data = response.data;

      if (data.success) {
        toast.success("🗑️ Categoria removida com sucesso!");
        queryClient.invalidateQueries(["categories"]);
        queryClient.invalidateQueries(["stats"]);
      } else {
        toast.error(data.error || "Erro ao deletar categoria");
      }
    } catch (err) {
      console.error("❌ Erro ao deletar categoria:", err);
      toast.error("Erro ao excluir categoria");
    }
  };

  const deletePrompt = async (id) => {
    if (String(id).startsWith("temp-")) {
      toast.warning("⏳ Aguarde o prompt ser criado antes de deletar!");
      return;
    }

    if (!confirm("Tem certeza que deseja deletar este prompt?")) {
      return;
    }

    try {
      await deletePromptMutation.mutateAsync(id);
      toast.success("🗑️ Prompt deletado!");
    } catch (err) {
      console.error("❌ Erro ao deletar prompt:", err);
      toast.error("Erro ao deletar prompt");
    }
  };

  const handleToggleFavorite = async (prompt) => {
    if (String(prompt.id).startsWith("temp-")) {
      toast.warning("⏳ Aguarde o prompt ser criado!");
      return;
    }

    try {
      await toggleFavoriteMutation.mutateAsync(prompt.id);
      
      const status = !prompt.is_favorite ? "favoritado" : "removido dos favoritos";
      toast.success(`⭐ Prompt ${status}!`);
    } catch (err) {
      console.error("❌ Erro ao alternar favorito:", err);
      toast.error("Erro ao atualizar favorito");
    }
  };

  // 🔴 FUNÇÃO MELHORADA: Duplicar Prompt com Proteção Anti-Double-Click
  const handleDuplicatePrompt = useCallback(async (prompt) => {
    // Validação: Prompt temporário
    if (String(prompt.id).startsWith("temp-")) {
      toast.warning("⏳ Aguarde o prompt ser criado antes de duplicar!");
      return;
    }

    // 🔴 PROTEÇÃO: Verifica se já está duplicando este prompt
    if (duplicatingIds.has(prompt.id)) {
      toast.info("⏳ Duplicação em andamento...");
      return;
    }

    // 🔴 MARCA COMO "DUPLICANDO"
    setDuplicatingIds(prev => new Set(prev).add(prompt.id));

    try {
      toast.info("📋 Duplicando prompt...");

      const finalMediaType = prompt.media_type || (
        prompt.youtube_url ? 'youtube' :
        prompt.video_url ? 'video' :
        prompt.image_url ? 'image' : 'none'
      );

      const basePayload = {
        title: `${prompt.title} (Cópia)`,
        content: prompt.content || "",
        description: prompt.description || "",
        tags: Array.isArray(prompt.tags) ? prompt.tags.join(",") : (prompt.tags || ""),
        platform: prompt.platform || "chatgpt",
        is_favorite: false,
        media_type: finalMediaType,
        category_id: prompt.category_id || null,
      };

      if (finalMediaType === 'youtube' && prompt.youtube_url) {
        basePayload.youtube_url = prompt.youtube_url;
      }

      const tempId = `temp-${Date.now()}`;
      const clientId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const optimisticPrompt = {
        id: tempId,
        _tempId: tempId,
        _clientId: clientId,
        _isOptimistic: true,
        _skipAnimation: false,
        ...basePayload,
        image_url: prompt.image_url || "",
        video_url: prompt.video_url || "",
        thumb_url: prompt.thumb_url || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };

      const newPrompt = await createPromptMutation.mutateAsync({
        payload: basePayload,
        optimisticPrompt,
      });

      if (!newPrompt?.id) {
        throw new Error("Erro ao criar prompt duplicado");
      }

      // Copiar mídia se necessário
      if ((finalMediaType === 'image' || finalMediaType === 'video') && prompt.id) {
        try {
          await api.post(`/prompts/${prompt.id}/duplicate-media`, {
            target_prompt_id: newPrompt.id
          });
          
          toast.success("✅ Prompt duplicado com mídia!");
        } catch (mediaError) {
          console.error("❌ Erro ao duplicar mídia:", mediaError);
          
          // 🔴 MELHORIA: Mensagens de erro específicas
          if (mediaError.response?.status === 404) {
            toast.warning("⚠️ Prompt duplicado, mas mídia original não encontrada!");
          } else {
            toast.warning("⚠️ Prompt duplicado, mas mídia não foi copiada!");
          }
        }
      } else {
        toast.success("✅ Prompt duplicado com sucesso!");
      }

      queryClient.invalidateQueries(["prompts"]);
      queryClient.invalidateQueries(["stats"]);

    } catch (error) {
      console.error("❌ Erro ao duplicar prompt:", error);
      
      // 🔴 MELHORIA: Mensagens de erro específicas
      if (error.response?.status === 404) {
        toast.error("❌ Prompt original não encontrado!");
      } else if (error.response?.status === 403) {
        toast.error("❌ Você não tem permissão para duplicar este prompt!");
      } else {
        toast.error("❌ Erro ao duplicar prompt. Tente novamente.");
      }
    } finally {
      // 🔴 CRÍTICO: Remove o ID da lista de "duplicando"
      setDuplicatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(prompt.id);
        return newSet;
      });
    }
  }, [duplicatingIds, createPromptMutation, queryClient]);

  const copyToClipboard = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      await api.post(`/prompts/${prompt.id}/copy`);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Erro ao copiar prompt");
    }
  };

  if (showTemplates) {
    return (
      <TemplatesPage
        user={user}
        onBack={() => setShowTemplates(false)}
      />
    );
  }

  return (
    <>
      <div
        className={`min-h-screen ${
          isPopupMode ? "bg-white" : "bg-gray-50 dark:bg-slate-900"
        }`}
      >
        <Header
          user={user}
          handleLogout={handleLogout}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        <div className="w-full px-6 lg:px-10 xl:px-14 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 xl:gap-8">
            
            <Sidebar
              stats={stats}
              myCategories={myCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              resetCategoryForm={resetCategoryForm}
              setIsCategoryDialogOpen={setIsCategoryDialogOpen}
              setShowCategoryModal={setShowCategoryModal}
              setIsMobileSidebarOpen={setIsMobileSidebarOpen}
              editCategory={editCategory}
              deleteCategory={deleteCategory}
              isMobileSidebarOpen={isMobileSidebarOpen}
              user={user}
              handleLogout={handleLogout}
              openNewPromptModal={() => {
                resetPromptForm();
                setIsPromptDialogOpen(true);
              }}
              openTemplates={() => setShowTemplates(true)}
              openChat={openChatFromTopButton}
            />

            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-grow min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar prompts..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Favoritos</span>
                </Button>

                <div className="hidden sm:flex items-center gap-3">
                {user?.is_admin && (
                  <Button
                    onClick={() => navigate('/admin/dashboard')}
                    className="!opacity-100 !visible flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
                    size="sm"
                    title="Dashboard Administrativo"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                )}

                  <Button
                    onClick={openChatFromTopButton}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </Button>

                  <Button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    size="sm"
                  >
                    <BookText className="w-4 h-4" />
                    Templates
                  </Button>

                  <Button
                    onClick={() => {
                      resetPromptForm();
                      setIsPromptDialogOpen(true);
                    }}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo
                  </Button>
                </div>
              </div>

              <PromptGrid
                prompts={filteredPrompts}
                isLoading={loadingPrompts || loadingCategories}
                duplicatingIds={duplicatingIds}
                emptyMessage={
                  searchTerm
                    ? `Nenhum resultado para "${searchTerm}"`
                    : selectedCategory
                    ? "Nenhum prompt nesta categoria"
                    : "Nenhum prompt encontrado"
                }
                onEdit={editPrompt}
                onDelete={deletePrompt}
                onCopy={copyToClipboard}
                onDuplicate={handleDuplicatePrompt}
                onToggleFavorite={handleToggleFavorite}
                onShare={(prompt) => {
                  setPromptToShare(prompt);
                  setShowShareModal(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[10002]">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Carregando módulo...
              </p>
            </div>
          </div>
        }
      >
        {showChatModal && (
          <Suspense fallback={<div>Carregando chat...</div>}>
            {ChatComponent ? (
              <ChatComponent
                isOpen={showChatModal}
                onClose={() => setShowChatModal(false)}
                onPromptSaved={handlePromptSaved}
              />
            ) : (
              <div>Carregando chat...</div>
            )}
          </Suspense>
        )}

        {showShareModal && promptToShare && (
          <SharePromptModal
            prompt={promptToShare}
            onClose={() => {
              setShowShareModal(false);
              setPromptToShare(null);
            }}
            onSuccess={() => {
              setShowShareModal(false);
              setPromptToShare(null);
              openChatIntelligently();
              queryClient.invalidateQueries(["prompts"]);
              queryClient.invalidateQueries(["categories"]);
            }}
          />
        )}
      </Suspense>

      <PromptModal
        isOpen={isPromptDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (isEditMode || editingPrompt || isSaving) {
              setIsPromptDialogOpen(open);
              setExtraFiles([]);
              if (extraFilesInputRef.current) {
                extraFilesInputRef.current.value = "";
              }
              return;
            }

            if (hasUnsavedContent()) {
              const shouldSaveDraft = confirm(
                "💾 Você tem alterações não salvas!\n\n" +
                "Deseja salvar como rascunho?\n\n" +
                "• OK = Salvar rascunho e fechar\n" +
                "• CANCELAR = Descartar e fechar"
              );

              if (shouldSaveDraft) {
                localStorage.setItem("prompt-draft", JSON.stringify(promptForm));
                toast.success("💾 Rascunho salvo!");
              } else {
                localStorage.removeItem("prompt-draft");
                toast.info("🗑️ Alterações descartadas");
              }
            }

            setExtraFiles([]);
            if (extraFilesInputRef.current) {
              extraFilesInputRef.current.value = "";
            }
          }

          setIsPromptDialogOpen(open);
        }}
        promptForm={promptForm}
        setPromptForm={setPromptForm}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        editingPrompt={editingPrompt}
        isEditMode={isEditMode}
        myCategories={myCategories}
        handleImageUpload={handleImageUpload}
        removeImage={removeImage}
        handleVideoUpload={handleVideoUpload}
        extractYouTubeId={extractYouTubeId}
        getYouTubeThumbnail={getYouTubeThumbnail}
        attachments={attachments}
        removeAttachment={removeAttachment}
        extraFiles={extraFiles}
        extraFilesInputRef={extraFilesInputRef}
        handleExtraFiles={handleExtraFiles}
        removeExtraFile={removeExtraFile}
        clearAllExtraFiles={clearAllExtraFiles}
        isSaving={isSaving}
        savePrompt={savePrompt}
        resetPromptForm={resetPromptForm}
      />
      
      {createPortal(
        <Dialog
          open={isCategoryDialogOpen || showCategoryModal}
          onOpenChange={(open) => {
            setIsCategoryDialogOpen(open);
            setShowCategoryModal(open);
            if (!open) resetCategoryForm();
          }}
        >
          <DialogContent
            className="
              max-w-md w-full rounded-xl bg-white dark:bg-slate-900
              shadow-xl border border-slate-200 dark:border-slate-800 p-6
              z-[10051]
            "
          >
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Altere os detalhes da categoria"
                  : "Crie uma categoria para organizar seus prompts"}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <Label>Nome</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Ex: Redes Sociais"
              />
            </div>

            <div className="mt-4">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descrição da categoria..."
                rows={3}
              />
            </div>

            <div className="mt-4">
              <Label>Cor</Label>
              <Input
                type="color"
                className="h-10 p-1 cursor-pointer"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    color: e.target.value,
                  }))
                }
              />
              
              <div className="flex gap-2 mt-3">
                {[
                  "#3B82F6",
                  "#8B5CF6",
                  "#EC4899",
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setCategoryForm((prev) => ({ ...prev, color }))
                    }
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      categoryForm.color === color
                        ? "border-slate-900 dark:border-white scale-110"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  resetCategoryForm();
                  setIsCategoryDialogOpen(false);
                  setShowCategoryModal(false);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={async () => {
                  if (!categoryForm.name.trim()) {
                    toast.error("Nome da categoria é obrigatório!");
                    return;
                  }
                  await saveCategory();
                }}
                disabled={!categoryForm.name.trim()}
              >
                {editingCategory ? "Salvar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>,
        document.body
      )}
    </>
  );
}