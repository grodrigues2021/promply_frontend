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

  const resolveMediaUrl = (url) => {
  if (!url) return "";

  // Base64 ou blob
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  // URLs externas
  if (url.startsWith("http")) {
    return url;
  }

  // Garantir que /api não esteja presente no prefixo
  const backendBase = API_BASE_URL.replace("/api", "");

  // Caminho local vindo do backend (edição)
  if (url.startsWith("/")) {
    return `${backendBase}${url}`;
  }

  // Fallback final
  return `${backendBase}/${url}`;
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

    console.log("🎥 VIDEO FINAL URL:", fullUrl);

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
    
    setEditingPrompt(null);
    setIsEditMode(false);
    setExtraFiles([]);
    setAttachments([]);
    setFormErrors({ title: "", content: "" });
    
    if (extraFilesInputRef.current) {
      extraFilesInputRef.current.value = "";
    }
  }, []);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm({
      name: "",
      description: "",
      color: "#3B82F6",
      is_template: false,
    });
    setEditingCategory(null);
  }, []);

  const editPrompt = useCallback((prompt) => {
    console.log("✏️ Editando prompt:", prompt);
    
    // Limpar arquivos extras ao editar
    setExtraFiles([]);
    if (extraFilesInputRef.current) {
      extraFilesInputRef.current.value = "";
    }

    const categoryId = prompt.category?.id
      ? String(prompt.category.id)
      : prompt.category_id
      ? String(prompt.category_id)
      : "none";

    let mediaType = "none";
if (prompt.youtube_url) mediaType = "youtube";
else if (prompt.video_url) mediaType = "video";
else if (prompt.image_url) mediaType = "image";


    const formData = {
      title: prompt.title || "",
      content: prompt.content || "",
      description: prompt.description || "",
      tags: normalizeTags(prompt.tags),
      category_id: categoryId,
      platform: prompt.platform || "chatgpt",
      is_favorite: prompt.is_favorite || false,
      image_url: prompt.image_url || "",
      video_url: prompt.video_url || "",
      youtube_url: prompt.youtube_url || "",
      imageFile: null,
      videoFile: null,
      selectedMedia: mediaType,
    };

    setIsEditMode(true);
    setPromptForm(formData);
    setEditingPrompt(prompt);
    setAttachments(prompt.attachments || []);
    setFormErrors({ title: "", content: "" });
    
    setTimeout(() => {
      setIsPromptDialogOpen(true);
    }, 0);
  }, [normalizeTags]);

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
        console.log("✅ Chat destacado detectado");
      } else if (event.data.type === "chat-closed") {
        setIsChatDetached(false);
        console.log("❌ Chat destacado fechado");
      } else if (event.data.type === "pong") {
        setIsChatDetached(true);
        setShowChatModal(false);
        console.log("✅ Chat destacado já estava aberto");
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
  try {
    console.log("🚀 SALVANDO PROMPT...");

    // Prevenção de duplo clique
    if (isSaving) {
      console.log("⚠️ Já está salvando, ignorando clique duplo");
      return;
    }

    // Validação
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    

    // 🔍 DEBUG CRÍTICO - ADICIONE AQUI
    console.log("🎬 DEBUG ANTES DE ENVIAR:", {
      selectedMedia: promptForm.selectedMedia,
      hasVideoFile: !!promptForm.videoFile,
      videoFileName: promptForm.videoFile?.name,
      videoFileSize: promptForm.videoFile?.size,
      videoFileType: promptForm.videoFile?.type,
      hasImageFile: !!promptForm.imageFile,
      video_url: promptForm.video_url,
      youtube_url: promptForm.youtube_url,
    });

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

    // ✅ TAGS - ADICIONE AQUI:
    formData.append("tags", promptForm.tags || "");

    // 🎥 VÍDEO - ADICIONE LOG AQUI
    if (promptForm.videoFile instanceof File) {
      console.log("🎥 ANEXANDO VÍDEO AO FORMDATA:", {
        name: promptForm.videoFile.name,
        size: promptForm.videoFile.size,
        type: promptForm.videoFile.type,
      });
      formData.append("video", promptForm.videoFile);
    } else {
      console.log("⚠️ VÍDEO NÃO É FILE:", typeof promptForm.videoFile);
    }

    // 📷 Imagem principal
    if (promptForm.imageFile instanceof File) {
      console.log("📷 ANEXANDO IMAGEM AO FORMDATA:", promptForm.imageFile.name);
      formData.append("image", promptForm.imageFile);
    }
// 📎 ARQUIVOS EXTRAS
if (extraFiles.length > 0) {
  console.log("📎 Adicionando arquivos extras:", extraFiles.length);
  extraFiles.forEach((file, index) => {
    console.log("📎 Enviando extra_files:", file.name);
    formData.append("extra_files", file);
  });
} else {
  console.log("📎 Nenhum arquivo extra selecionado.");
}
    // 🔍 LOG FINAL DO FORMDATA
    console.log("📦 CONTEÚDO DO FORMDATA:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [FILE] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // POST ou PUT
    let response;
    if (isEditMode === true && editingPrompt?.id) {
      console.log("📤 ENVIANDO PUT para:", `/prompts/${editingPrompt.id}`);
      response = await api.put(`/prompts/${editingPrompt.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      console.log("📤 ENVIANDO POST para:", `/prompts`);
      response = await api.post("/prompts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

   console.log("📥 RESPOSTA DO BACKEND:", response.data);

    // ✅ ADICIONE ESTAS LINHAS APÓS O CONSOLE.LOG:
    if (response.data?.success) {
      toast.success(
        isEditMode ? "✅ Prompt atualizado!" : "✅ Prompt criado!"
      );
      setPrompts((prev) =>
  prev.map((p) =>
    editingPrompt && p.id === editingPrompt.id
      ? {
          ...p,
          title: promptForm.title,
          content: promptForm.content,
          description: promptForm.description,
          platform: promptForm.platform,
          category_id: promptForm.category_id,
          tags: promptForm.tags,
          youtube_url: promptForm.youtube_url,
          video_url: promptForm.video_url,
          image_url: promptForm.image_url,
          is_favorite: promptForm.is_favorite,
        }
      : p
  )
);

  // 🧹 REMOVER RASCUNHO APÓS SALVAR ✔
  localStorage.removeItem("prompt-draft");

      // Invalida as queries para recarregar a lista
      await queryClient.invalidateQueries(["prompts"]);
      await queryClient.invalidateQueries(["stats"]);
      
      // Fecha o modal e reseta o formulário
      setIsPromptDialogOpen(false);
      resetPromptForm();
    } else {
      toast.error(response.data?.error || "Erro ao salvar prompt");
    }

  } catch (error) {
    console.error("❌ ERRO AO SALVAR PROMPT:", error);
    toast.error("Erro ao salvar prompt");
  } finally {
    setIsSaving(false);
    
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
    const response = await api.post(`/prompts/${prompt.id}/favorite`);

    if (response.data?.success) {
      const newValue = response.data.data.is_favorite;

      // Atualiza estado no frontend
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, is_favorite: newValue } : p
        )
      );

      toast.success(
        newValue
          ? "⭐ Adicionado aos favoritos!"
          : "☆ Removido dos favoritos!"
      );
    } else {
      toast.error("Erro ao atualizar o favorito.");
    }
  } catch (error) {
    console.error("Erro:", error);
    toast.error("Falha ao atualizar o favorito.");
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

  // Só recuperar rascunho ao criar um NOVO prompt
  if (editingPrompt || isEditMode) return;

  const draft = localStorage.getItem("prompt-draft");
  if (!draft) return;

  const parsed = JSON.parse(draft);

  // Só mostrar alerta se o rascunho REALMENTE tiver conteúdo
  const hasContent =
    parsed.title?.trim() ||
    parsed.content?.trim() ||
    parsed.description?.trim() ||
    parsed.tags?.trim();

  // NÃO apagar rascunho ao fechar modal — apenas limpar estado visual
if (!open) {
  setExtraFiles([]);
  if (extraFilesInputRef.current) {
    extraFilesInputRef.current.value = "";
  }
}


  // Mostrar alerta apenas uma vez
  const shouldRestore = confirm("Recuperar rascunho anterior?");
  if (shouldRestore) {
    setPromptForm(parsed);
  }

  localStorage.removeItem("prompt-draft");
}, [isPromptDialogOpen, editingPrompt, isEditMode]);


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

      {createPortal(
  <Dialog
    open={isPromptDialogOpen}
    onOpenChange={(open) => {
      setIsPromptDialogOpen(open);
      if (!open) {
        setExtraFiles([]);
        if (extraFilesInputRef.current) {
          extraFilesInputRef.current.value = "";
        }
      }
    }}
  >
    <DialogOverlay className="fixed inset-0 bg-black/40 z-[10050]" />



    <DialogContent
      className="
        max-w-4xl w-full max-h-[90vh]
        overflow-y-auto rounded-xl
        bg-white dark:bg-slate-900 shadow-2xl
        border border-gray-200 dark:border-slate-700
        p-6 z-[10051]
      "
    >
      {/* Overlay de salvamento */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-center justify-center rounded-xl">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Salvando prompt...</span>
          </div>
        </div>
      )}

      <DialogHeader>
        <DialogTitle>
          {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
        </DialogTitle>
        <DialogDescription>
          {editingPrompt
            ? "Edite os detalhes do seu prompt"
            : "Crie um novo prompt"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Título</Label>
          <Input
            value={promptForm.title}
            onChange={(e) => {
              const value = e.target.value;
              setPromptForm((prev) => ({ ...prev, title: value }));

              if (!value.trim()) {
                setFormErrors((prev) => ({
                  ...prev,
                  title: "Título é obrigatório",
                }));
              } else {
                setFormErrors((prev) => ({ ...prev, title: "" }));
              }
            }}
            placeholder="Título do prompt"
            className={formErrors.title ? "border-red-500" : ""}
          />
          {formErrors.title && (
            <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>
          )}
        </div>

        <div>
          <Label>Conteúdo</Label>
          <Textarea
            value={promptForm.content}
            onChange={(e) => {
              const value = e.target.value;
              setPromptForm((prev) => ({ ...prev, content: value }));

              if (!value.trim()) {
                setFormErrors((prev) => ({
                  ...prev,
                  content: "Conteúdo é obrigatório",
                }));
              } else {
                setFormErrors((prev) => ({ ...prev, content: "" }));
              }
            }}
            rows={10}
            className={`w-full max-h-96 overflow-y-auto resize-y whitespace-pre-wrap break-words ${
              formErrors.content ? "border-red-500" : ""
            }`}
          />
          {formErrors.content && (
            <p className="text-xs text-red-500 mt-1">{formErrors.content}</p>
          )}
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            value={promptForm.description}
            onChange={(e) =>
              setPromptForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <Label>Tags (separadas por vírgula)</Label>
          <Input
            value={promptForm.tags}
            onChange={(e) =>
              setPromptForm((prev) => ({ ...prev, tags: e.target.value }))
            }
            placeholder="ex: IA, automação, produtividade"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Tipo de mídia
          </Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { key: "none", label: "Nenhum", icon: "❌" },
              { key: "image", label: "Imagem", icon: "📷" },
              { key: "video", label: "Vídeo", icon: "🎥" },
              { key: "youtube", label: "YouTube", icon: "🔗" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
  setPromptForm((prev) => {
    const updated = { ...prev, selectedMedia: key };

    // ▶️ Quando o usuário seleciona IMAGEM
    // Não apagar imagem existente!! (correção do bug)
    if (key === "image") {
      updated.video_url = "";
      updated.youtube_url = "";
      updated.videoFile = null;
      // ⭐ NÃO remover:
      // updated.image_url
      // updated.imageFile
    }

    // ▶️ Quando seleciona VÍDEO
    // ▶️ Quando seleciona VÍDEO
if (key === "video") {
  updated.youtube_url = "";
  // ❗ NÃO ZERAR image_url — ela contém a THUMB

}


    // ▶️ Quando seleciona YOUTUBE
    if (key === "youtube") {
      updated.image_url = "";
      updated.video_url = "";
      updated.imageFile = null;
      updated.videoFile = null;
    }

    // ▶️ Quando seleciona NENHUM
    if (key === "none") {
      updated.image_url = "";
      updated.video_url = "";
      updated.youtube_url = "";
      updated.imageFile = null;
      updated.videoFile = null;
    }

    return updated;
  })
}


                className={`px-3 py-1.5 text-sm rounded-md border transition ${
                  promptForm.selectedMedia === key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="mr-1">{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* === UPLOADS === */}
        {promptForm.selectedMedia === "image" && (
          <div className="mt-4 space-y-2">
            <Label>Upload de imagem</Label>
            {promptForm.image_url ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                {console.log("🟦 PREVIEW CHECK:", {
  image_url: promptForm.image_url || p.image_url,
  resolved: resolveMediaUrl(promptForm.image_url),
  hasFile: !!promptForm.imageFile,
})}
                <img
                  src={resolveMediaUrl(promptForm.image_url)}
                  alt="Preview"
                  className="object-contain w-full h-full"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="prompt-image-upload"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Selecione uma imagem
                </span>
                <input
                  id="prompt-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}

      {promptForm.selectedMedia === "video" && (
  <div className="w-full space-y-3">

    {/* INPUT DE UPLOAD DE VÍDEO */}
    <input
  type="file"
  accept="video/mp4,video/webm,video/ogg"
  onChange={handleVideoUpload}
  className="border p-2 rounded-lg w-full bg-white dark:bg-slate-800"
/>

    {/* PREVIEW */}
    <div className="w-full rounded-lg overflow-hidden bg-black flex justify-center items-center h-[260px]">
      
      {/* 1. PREVIEW IMEDIATO (vídeo sendo enviado) */}
      {promptForm.videoFile ? (
        <video
          src={URL.createObjectURL(promptForm.videoFile)}
          controls
          className="max-h-[260px] w-auto rounded-lg"
        />
      ) 
      
     : promptForm.image_url ? (
  <img
    src={resolveMediaUrl(promptForm.image_url)}
    alt="Thumb do vídeo"
    className="max-h-[260px] w-auto object-contain rounded-lg"
  />

      
      /* 3. VÍDEO FINAL (DEPOIS DE SALVO) */
      ) : promptForm.video_url ? (
        <video
          src={resolveMediaUrl(promptForm.video_url)}
          controls
          className="max-h-[260px] w-auto rounded-lg"
        />
      
      /* 4. SEM VÍDEO */
      ) : (
        <div className="text-white text-sm">Nenhum vídeo selecionado</div>
      )}

    </div>

  </div>
)}




 {promptForm.selectedMedia === "youtube" && (
  <div className="mt-4 space-y-3">

    <Label>Link do YouTube</Label>

   <Input
  type="text"           // ← CORREÇÃO CRUCIAL
  inputMode="url"       // ← Mantém teclado de URL no mobile
  placeholder="https://www.youtube.com/watch?v=..."
  value={promptForm.youtube_url || ""}
  onChange={(e) =>
    setPromptForm((prev) => ({
      ...prev,
      youtube_url: e.target.value.trim(),
    }))
  }
/>


    {/* PREVIEW DO YOUTUBE */}
<div className="w-full rounded-lg overflow-hidden bg-black flex justify-center items-center h-[260px]">

  {extractYouTubeId(promptForm.youtube_url) ? (
    <div
      onClick={() => window.open(promptForm.youtube_url, "_blank")}
      className="cursor-pointer"
    >
      <img
  src={getYouTubeThumbnail(promptForm.youtube_url) || ""}
  alt="Preview do YouTube"
  className="max-h-[260px] w-auto object-contain rounded-lg"
  draggable={false}
/>

    </div>
  ) : (
    <div className="text-white text-sm select-none">
      Cole um link válido do YouTube…
    </div>
  )}
</div>


  </div>
)}


        {/* === ANEXOS EXISTENTES === */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-medium">Arquivos anexados</Label>

            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  📎 {file.file_name}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${API_BASE_URL.replace("/api", "")}${file.file_url}`}
                    download={file.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      const link = document.createElement("a");
                      link.href = `${API_BASE_URL.replace("/api", "")}${file.file_url}`;
                      link.download = file.file_name;
                      link.style.display = "none";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Baixar
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAttachment(file.id, editingPrompt?.id);
                    }}
                    className="text-red-600 dark:text-red-400 text-xs hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === ARQUIVOS EXTRAS === */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Arquivos extras (PNG/JPG)</Label>
            {extraFiles.length > 0 && (
              <span className="text-xs text-slate-500">
                {extraFiles.length} arquivo{extraFiles.length > 1 ? "s" : ""}
              </span>
            )}  
          </div>

          <input
            ref={extraFilesInputRef}
            type="file"
            accept="image/png, image/jpeg"
            multiple
            onChange={handleExtraFiles}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            className="text-sm px-3 py-1 w-full"
            onClick={() => extraFilesInputRef.current?.click()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar arquivos
          </Button>

          {extraFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Arquivos selecionados:
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllExtraFiles}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpar todos
                </Button>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-2">
                {extraFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">📎</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({(file.size / 1024).toFixed(1)}KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExtraFile(index)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title={`Remover ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* === CATEGORIA === */}
        <div className="mt-4">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Categoria
          </Label>

          <div className="hidden sm:block">
            <Select
              value={promptForm.category_id}
              onValueChange={(value) =>
                setPromptForm((prev) => ({ ...prev, category_id: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>

              <SelectContent className="max-h-[220px] overflow-y-auto">
                <SelectItem value="none">Sem categoria</SelectItem>
                {myCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="block sm:hidden relative z-10">
  <Select
    value={promptForm.category_id}
    onValueChange={(value) =>
      setPromptForm((prev) => ({ ...prev, category_id: value }))
    }
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Selecione uma categoria" />
    </SelectTrigger>

    <SelectContent className="max-h-[220px] overflow-y-auto">
      <SelectItem value="none">Sem categoria</SelectItem>
      {myCategories.map((cat) => (
        <SelectItem key={cat.id} value={String(cat.id)}>
          {cat.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

        </div>

        {/* === PLATAFORMA === */}
        <div className="mt-4">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Plataforma
          </Label>

          <Select
            value={promptForm.platform}
            onValueChange={(value) =>
              setPromptForm((prev) => ({ ...prev, platform: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma plataforma" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="chatgpt">🤖 ChatGPT</SelectItem>
              <SelectItem value="nanobanana">🍌 Nano Banana</SelectItem>
              <SelectItem value="gemini">✨ Gemini</SelectItem>
              <SelectItem value="veo3">🎥 VEO3</SelectItem>
              <SelectItem value="manus">📝 Manus</SelectItem>
              <SelectItem value="claude">🧠 Claude</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="prompt-favorite"
            checked={promptForm.is_favorite}
            onChange={(e) =>
              setPromptForm((prev) => ({
                ...prev,
                is_favorite: e.target.checked,
              }))
            }
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <Label htmlFor="prompt-favorite">Marcar como favorito</Label>
        </div>

        {/* === BOTÕES === */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsPromptDialogOpen(false);
              resetPromptForm();
            }}
          >
            Cancelar
          </Button>

          <Button
            disabled={isSaving}
            onClick={async () => {
              if (isSaving) return;
              await savePrompt();
            }}
            className={isSaving ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </div>
            ) : editingPrompt ? (
              "Salvar"
            ) : (
              "Criar"
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>,
  document.body
)}
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
    <DialogOverlay className="fixed inset-0 bg-black/40 z-[10050]" />
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