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
} from "lucide-react";
import PromplyLogo from "../assets/promply-logo.svg";
import { useAuth } from "../hooks/useAuth";
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
import { usePromptsQuery } from "../hooks/usePromptsQuery";
import { useCategoriesQuery } from "../hooks/useCategoriesQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useStats } from "../hooks/useStats";
import { debounce } from "lodash";
import { resolveMediaUrl } from "../lib/media";
import PromptModal from "./PromptModal";
import { favoriteRequest } from "../lib/api";



const isMobile = window.innerWidth < 768;

const SharePromptModal = React.lazy(() =>
  import(
    /* webpackChunkName: "SharePromptModal", webpackMode: "lazy" */
    "./SharePromptModal"
  )
);

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export default function PromptManager({
  setIsAuthenticated,
  setUser,
  defaultView = "prompts",
  isPopupMode = false,
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [ChatComponent, setChatComponent] = useState(null);

  const [activeView, setActiveView] = useState(defaultView);
  const [prompts, setPrompts] = useState([]);
  const [myCategories, setMyCategories] = useState([]);
  const [templateCategories, setTemplateCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const { data: stats = {} } = useStats();
  const [dbConnected, setDbConnected] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [promptToShare, setPromptToShare] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [isChatDetached, setIsChatDetached] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Estados para arquivos extras e anexos
  const [extraFiles, setExtraFiles] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const extraFilesInputRef = useRef(null);
  const isRestoringDraft = useRef(false);


  // Estados para validação de formulário
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
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    is_template: false,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");


  // Funções de gerenciamento de arquivos extras
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
      console.log(`📝 Removendo arquivo index ${indexToRemove}. Restam: ${newFiles.length} arquivos`);
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

  // Função de validação
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

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Vídeo muito grande! Máx. 50MB");
      return;
    }

    setUploadingImage(true);
    toast.info("🎬 Processando vídeo...");

    const videoURL = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailBase64 = canvas.toDataURL("image/jpeg", 0.8);

      canvas.toBlob(
        (blob) => {
          const thumbnailFile = new File([blob], "video-thumbnail.jpg", {
            type: "image/jpeg",
          });

          setPromptForm((prev) => ({
            ...prev,
            videoFile: file,
            video_url: "",
            image_url: prev.image_url || thumbnailBase64,
            imageFile: prev.imageFile || thumbnailFile,
            youtube_url: "",
          }));
          
          setUploadingImage(false);

          URL.revokeObjectURL(videoURL);
          video.remove();
          canvas.remove();
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => {
      toast.error("Erro ao processar vídeo");
      setUploadingImage(false);
      URL.revokeObjectURL(videoURL);
      video.remove();
    };

    video.src = videoURL;
  }, []);

  const openVideoModal = useCallback((url) => {
    const backendBase = API_BASE_URL.replace("/api", ""); 
    const fullUrl = url.startsWith("http") ? url : backendBase + url;


    setCurrentVideoUrl(fullUrl);
    setShowVideoModal(true);
}, []);


  const openImageModal = useCallback((imageBase64, title) => {
    setSelectedImage({ url: imageBase64, title });
    setIsImageModalOpen(true);
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

// Gera a thumbnail oficial do YouTube (alta qualidade)
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
  });
  
  // Só limpar editingPrompt quando NÃO estamos editando
  if (!isEditMode) {
    setEditingPrompt(null);
  }
  setIsEditMode(false);

  setExtraFiles([]);
  setAttachments([]);  // ✅ ADICIONAR ESTA LINHA
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
  console.log("🟦 EDIT PROMPT RAW DATA:", prompt);

  setIsEditMode(true);
  setEditingPrompt(prompt);

  // ✅ NORMALIZAÇÃO DA IMAGEM
  const normalizedImage =
    prompt.imageUrl ||
    prompt.image_url ||
    prompt.thumb_url ||
    "";

  console.log("📸 NORMALIZED IMAGE:", normalizedImage);

  // ✅ DETECÇÃO DO TIPO DE MÍDIA
  const mediaType = prompt.youtube_url
    ? "youtube"
    : prompt.video_url
    ? "video"
    : normalizedImage
    ? "image"
    : "none";

  console.log("📺 MEDIA TYPE DETECTADO:", mediaType);

  const formData = {
    id: prompt.id || null,
    title: prompt.title || "",
    content: prompt.content || "",
    description: prompt.description || "",
    tags: prompt.tags || "",
    category_id: String(prompt.category_id || "none"),

    // ✅ GARANTIR QUE image_url ESTÁ DEFINIDA
    image_url: normalizedImage,
    thumb_url: prompt.thumb_url || "",

    videoFile: null,
    video_url: prompt.video_url || "",
    youtube_url: prompt.youtube_url || "",
    youtube_id: extractYouTubeId(prompt.youtube_url) || "",

    is_favorite: prompt.is_favorite || false,
    platform: prompt.platform || "chatgpt",

    selectedMedia: mediaType,
  };

  console.log("🟩 FORM DATA BEFORE SET:", formData);
  setPromptForm(formData);

  // ============================================================
  // 🔵 CARREGAR ANEXOS DO PROMPT (PromptFile)
  // ============================================================
  try {
    console.log(`📎 Carregando anexos do prompt ${prompt.id}...`);
    
    const response = await api.get(`/prompts/${prompt.id}/files`);
    
    if (response.data?.data) {
      const files = response.data.data;
      console.log(`✅ ${files.length} anexo(s) carregado(s):`, files);
      setAttachments(files);
    } else {
      console.log("⚠️ Nenhum anexo encontrado");
      setAttachments([]);
    }
  } catch (error) {
    console.error("❌ Erro ao carregar anexos:", error);
    setAttachments([]);
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
      console.error("Erro em testConnection:", error);
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

  useEffect(() => {
    if (categoriesData) {
      setMyCategories(categoriesData.my);
      setTemplateCategories(categoriesData.templates);
    }
  }, [categoriesData]);

  useEffect(() => {
    if (Array.isArray(promptsData)) {
      setPrompts(promptsData);
    }
  }, [promptsData]);

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

 // Evita que o overlay mobile apareça no desktop
useEffect(() => {
  if (window.innerWidth >= 768 && isMobileSidebarOpen) {
    setIsMobileSidebarOpen(false);
  }
}, [isMobileSidebarOpen]);

// Força reset do isSaving quando modal fecha
useEffect(() => {
  if (!isPromptDialogOpen) {
    setIsSaving(false);
    
    // Limpeza adicional: remove qualquer overlay órfão
    const orphanOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    orphanOverlays.forEach(overlay => {
      if (overlay.getAttribute('data-state') === 'closed') {
        overlay.remove();
      }
    });
  }
}, [isPromptDialogOpen]);

  const filteredPrompts = Array.isArray(prompts)
    ? prompts.filter((prompt) => {
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

const savePrompt = async () => {
  // Prevenção de duplo clique
  if (isSaving) {
    return;
  }

  // Validação ANTES de setar isSaving
  if (!validateForm()) {
    return;
  }

  try {

    setIsSaving(true);

    // Montagem do FormData
    const formData = new FormData();
    formData.append("title", promptForm.title);
    formData.append("content", promptForm.content);
    formData.append("description", promptForm.description || "");
    formData.append("category_id", promptForm.category_id || "");
    formData.append("platform", promptForm.platform || "chatgpt");
    formData.append("youtube_url", promptForm.youtube_url || "");
    formData.append("video_url", promptForm.video_url || "");
    formData.append("is_favorite", promptForm.is_favorite);
    formData.append("tags", promptForm.tags || "");

    if (promptForm.videoFile instanceof File) {
      formData.append("video", promptForm.videoFile);
    }

    if (promptForm.imageFile instanceof File) {
      formData.append("image", promptForm.imageFile);
    }

    if (extraFiles.length > 0) {
      extraFiles.forEach((file) => {
        formData.append("extra_files", file);
      });
    }

    // POST ou PUT
    let response;
    if (isEditMode === true && editingPrompt?.id) {
      response = await api.put(`/prompts/${editingPrompt.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      response = await api.post("/prompts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }


    if (response.data?.success) {
      toast.success(
        isEditMode ? "✅ Prompt atualizado!" : "✅ Prompt criado!"
      );

      // Atualiza lista local
      setPrompts((prev) =>
        prev.map((p) =>
          editingPrompt && p.id === editingPrompt.id
            ? { ...p, ...promptForm }
            : p
        )
      );

      // Remove rascunho
      localStorage.removeItem("prompt-draft");

      // Invalida queries
      await queryClient.invalidateQueries(["prompts"]);
      await queryClient.invalidateQueries(["stats"]);
    } else {
      toast.error(response.data?.error || "Erro ao salvar prompt");
    }

  } catch (error) {
    toast.error("Erro ao salvar prompt");
  } finally {
    // ✅ SEMPRE reseta isSaving

    setIsSaving(false);
    
    // ✅ FECHA O MODAL SEMPRE (movido para cá)
    setIsPromptDialogOpen(false);

setTimeout(() => {
  resetPromptForm();
}, 150);
    resetPromptForm();
    
    // Garantia extra
    setTimeout(() => {
      setIsSaving(false);
      
    }, 300);
  }
};

const debouncedSavePrompt = useCallback(

    debounce(async () => {
      await savePrompt();
    }, 1000),
    [promptForm, extraFiles, editingPrompt, isEditMode]
  )

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

    if (!confirm("Tem certeza que deseja deletar este prompt?")) return;

    const previousPrompts = [...prompts];
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("🗑️ Prompt deletado!");

    try {
      const { data } = await api.delete(`/prompts/${id}`);

      if (!data.success) {
        setPrompts(previousPrompts);
        toast.error(data.error || "Erro ao deletar prompt");
        return;
      }

      queryClient.invalidateQueries(["prompts"]);
      queryClient.invalidateQueries(["stats"]);

    } catch (err) {
      setPrompts(previousPrompts);
      toast.error("Erro ao deletar prompt");
      console.error(err);
    }
  };

  const handleToggleFavorite = async (prompt) => {
  try {
    const res = await favoriteRequest(prompt.id);

    const updated = res.data?.data;

    if (!updated) {
      console.warn("❌ favoriteRequest não retornou prompt atualizado");
      return;
    }

    // Atualiza a lista
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id ? { ...p, is_favorite: updated.is_favorite } : p
      )
    );

  } catch (err) {
    console.error("❌ Erro ao alternar favorito:", err);
    toast.error("Erro ao atualizar favorito");
  }
};



  const copyToClipboard = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      await api.post(`/prompts/${prompt.id}/copy`);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Erro ao copiar prompt");
    }
  };

  // Auto-save
  // AUTO-SAVE IMEDIATO DO RASCUNHO
useEffect(() => {
  if (!isPromptDialogOpen) return;
  if (isSaving) return;

  const hasContent =
    promptForm.title?.trim() ||
    promptForm.content?.trim() ||
    promptForm.description?.trim() ||
    promptForm.tags?.trim();

  if (hasContent) {
    localStorage.setItem("prompt-draft", JSON.stringify(promptForm));
  }

}, [promptForm, isSaving, isPromptDialogOpen]);


useEffect(() => {
  if (!isPromptDialogOpen) return;

  // ⛔ Se estiver editando, nunca restaurar rascunho
  if (isEditMode || editingPrompt) {
    isRestoringDraft.current = false;
    return;
  }

  // ⛔ Evitar execuções duplas
  if (isRestoringDraft.current) return;

  // Só restaura se form estiver limpo
  const isFormEmpty =
    !promptForm.title &&
    !promptForm.content &&
    !promptForm.image_url &&
    !promptForm.video_url &&
    !promptForm.youtube_url;

  if (!isFormEmpty) return;

  const draft = localStorage.getItem("prompt-draft");
  if (!draft) return;

  const parsed = JSON.parse(draft);

  const hasContent =
    parsed.title?.trim() ||
    parsed.content?.trim() ||
    parsed.description?.trim() ||
    parsed.tags?.trim();

  if (!hasContent) return;

  isRestoringDraft.current = true;

  const shouldRestore = confirm("Recuperar rascunho anterior?");
  if (shouldRestore) {
    setPromptForm(parsed);
  }

  localStorage.removeItem("prompt-draft");

  setTimeout(() => {
    isRestoringDraft.current = false;
  }, 300);
}, [isPromptDialogOpen]);




  useEffect(() => {
    if (isPopupMode && defaultView === "chat") {
      setShowChatModal(true);
    }
  }, [isPopupMode, defaultView]);

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
{isMobileSidebarOpen && window.innerWidth < 768 && (
  <div
    className="fixed inset-0 bg-black/40 z-30"
    onClick={() => setIsMobileSidebarOpen(false)}
  />
)}

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
                onToggleFavorite={handleToggleFavorite}
                onShare={(prompt) => {
                  setPromptToShare(prompt);
                  setShowShareModal(true);
                }}
                onOpenImage={openImageModal}
                onOpenVideo={openVideoModal}
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
    setIsPromptDialogOpen(open);
    if (!open) {
      setExtraFiles([]);
      if (extraFilesInputRef.current) {
        extraFilesInputRef.current.value = "";
      }
    }
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
      
{/* === MODAL DE CATEGORIA === */}
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

      {/* Nome */}
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

      {/* Descrição */}
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

      {/* Cor */}
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
        
        {/* Preview de cores sugeridas */}
        <div className="flex gap-2 mt-3">
          {[
            "#3B82F6", // Azul
            "#8B5CF6", // Roxo
            "#EC4899", // Rosa
            "#10B981", // Verde
            "#F59E0B", // Laranja
            "#EF4444", // Vermelho
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

      {/* Botões */}
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