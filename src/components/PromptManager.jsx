import { toast } from "sonner";
import React, { useState, useEffect, useCallback } from "react";
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
import ChatModal from "./ChatModal";
import SharePromptModal from "./SharePromptModal";
import PromptCard from "./PromptCard";
import PromptGrid from "./PromptGrid";
import api from "../lib/api";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import FooterMobile from "./layout/FooterMobile";




const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export default function PromptManager({
  setIsAuthenticated,
  setUser,
  defaultView = "prompts",
  isPopupMode = false,
}) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
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
  const [stats, setStats] = useState({});
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChatDetached, setIsChatDetached] = useState(false);
  const [promptForm, setPromptForm] = useState({
    title: "",
    content: "",
    description: "",
    tags: "",
    category_id: "none",
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

// 🔹 Estados do seletor de categoria responsivo
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [categorySearch, setCategorySearch] = useState("");



  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      console.log("📁 Arquivo selecionado:", file);
      console.log("📋 Tipo:", file?.type, "Tamanho:", file?.size);
      if (!file) {
        console.warn("⚠️ Nenhum arquivo selecionado!");
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

      console.log(
        `📤 Iniciando upload: ${file.name} (${file.type}), ${(
          file.size / 1024
        ).toFixed(1)}KB`
      );

      setUploadingImage(true);
      toast.loading("Enviando imagem...");

      const formData = new FormData();
      formData.append("file", file);

      console.log("🧾 FormData antes do envio:", [...formData.entries()]);
      console.log(
        "🔒 Header Authorization:",
        api.defaults.headers?.Authorization
      );

      const res = await api.post("/upload", formData);
      console.log("📩 Resposta do backend:", res.data);

      const uploadedUrl = res.data?.url || "";
      if (uploadedUrl) {
        setPromptForm((prev) => ({
          ...prev,
          imageFile: file,
          image_url: uploadedUrl,
        }));
        toast.dismiss();
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
    toast.info("📹 Processando vídeo...");

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
          //toast.success("✅ Vídeo selecionado!");

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
    setCurrentVideoUrl(url);
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
      is_favorite: false,
      image_url: "",
      video_url: "",
      youtube_url: "",
      videoFile: null,
      imageFile: null,
    });
    setEditingPrompt(null);
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

  const editPrompt = useCallback(
    (prompt) => {
      console.log("✏️ Editando prompt:", prompt);
      const categoryId = prompt.category?.id
        ? String(prompt.category.id)
        : prompt.category_id
        ? String(prompt.category_id)
        : "none";

      setPromptForm({
        title: prompt.title || "",
        content: prompt.content || "",
        description: prompt.description || "",
        tags: normalizeTags(prompt.tags),
        category_id: categoryId,
        is_favorite: prompt.is_favorite || false,
        image_url: prompt.image_url || "",
        video_url: prompt.video_url || "",
        youtube_url: prompt.youtube_url || "",
        imageFile: null,
        videoFile: null,
      });

      setEditingPrompt(prompt);
      setIsPromptDialogOpen(true);
    },
    [normalizeTags]
  );

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

  const loadPrompts = async () => {
    try {
      const response = await api.get("/prompts");
      const data = response.data;
      if (data.success) {
        setPrompts((prev) => {
          const newList = Array.isArray(data.data) ? [...data.data] : [];
          return JSON.stringify(prev) !== JSON.stringify(newList)
            ? newList
            : prev;
        });
      } else {
        setPrompts([]);
      }
    } catch {
      setDbConnected(false);
      setPrompts([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");
      const data = response.data;
      if (data.success) {
        setMyCategories(data.categories || []);
        setTemplateCategories(data.templates || []);
      }
    } catch {
      setMyCategories([]);
      setTemplateCategories([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/stats");
      const data = response.data;
      if (data.success) setStats(data.data || {});
    } catch {
      setStats({});
    }
  };

  const testConnection = useCallback(async () => {
    try {
      const response = await api.get("/stats");
      const data = response.data;

      if (data.success) {
        setDbConnected(true);
        toast.success("Conexão com o banco estabelecida!");
        await Promise.all([loadPrompts(), loadCategories(), loadStats()]);
      } else {
        setDbConnected(false);
        toast.error("Erro ao conectar: " + (data.error || "desconhecido"));
      }
    } catch (error) {
      console.error("Erro no teste de conexão:", error);
      setDbConnected(false);
      toast.error("Erro ao conectar com o banco de dados");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      window.location.href = "/";
    }
  }, [logout]);

  const handlePromptSaved = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    loadPrompts();
    loadStats();
    toast.success("✅ Prompt adicionado com sucesso!");
  }, []);

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
    loadPrompts();
    loadCategories();
    loadStats();
  }, [refreshKey]);

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

 // ========================================
// 🆕 SAVE PROMPT - COM OPTIMISTIC UPDATES E FLAGS DE MÍDIA
// ========================================
// Substitua TODA a função savePrompt no seu PromptManager.jsx

const savePrompt = async () => {
  try {
    if (uploadingImage) {
      toast.warning("Aguarde o envio da imagem antes de salvar.");
      return;
    }

    if (promptForm.imageFile && !promptForm.image_url) {
      toast.warning("Envie a imagem antes de salvar o prompt.");
      return;
    }

    const isEditing = !!editingPrompt;
    const endpoint = isEditing ? `/prompts/${editingPrompt.id}` : `/prompts`;

    // ========================================
    // CRIAR PROMPT - OPTIMISTIC UPDATE COM FLAGS DE MÍDIA
    // ========================================
    if (!isEditing) {
      const tempId = `temp-${Date.now()}`;
      
      const optimisticPrompt = {
        id: tempId,
        _tempId: tempId, // 🎯 Mantém o ID temp como key estável
        _skipAnimation: true, // 🎯 Flag para não animar este item
        _hasLocalVideo: !!promptForm.videoFile, // 🎯 Flag para detectar vídeo MP4
        _hasYouTube: !!promptForm.youtube_url, // 🎯 Flag para detectar YouTube
        title: promptForm.title,
        content: promptForm.content,
        description: promptForm.description,
        tags: promptForm.tags,
        category_id: promptForm.category_id === "none" ? null : Number(promptForm.category_id),
        category: promptForm.category_id !== "none" 
          ? myCategories.find(c => String(c.id) === String(promptForm.category_id))
          : null,
        is_favorite: promptForm.is_favorite,
        image_url: promptForm.image_url || "",
        video_url: promptForm.video_url || "",
        youtube_url: promptForm.youtube_url || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true,
      };

      // ✅ Adiciona IMEDIATAMENTE na UI
      setPrompts([optimisticPrompt, ...prompts]);
      
      // ✅ Fecha dialog e limpa formulário ANTES da requisição
      setIsPromptDialogOpen(false);
      resetPromptForm();
      
      // ✅ Feedback instantâneo
      toast.success('✅ Prompt criado!');

      try {
        let body;
        let headers = {};
        
        const shouldUseFormData =
          (promptForm.videoFile && !promptForm.video_url) ||
          (promptForm.imageFile && !promptForm.image_url);

        if (shouldUseFormData) {
          body = new FormData();
          body.append("title", promptForm.title);
          body.append("content", promptForm.content);
          body.append("description", promptForm.description);
          body.append("tags", Array.isArray(promptForm.tags) ? promptForm.tags.join(",") : promptForm.tags);
          
          const categoryValue = !promptForm.category_id || promptForm.category_id === "none"
            ? ""
            : String(promptForm.category_id);
          body.append("category_id", categoryValue);
          body.append("is_favorite", promptForm.is_favorite ? "true" : "false");
          
          if (promptForm.image_url) body.append("image_url", promptForm.image_url);
          if (promptForm.youtube_url) body.append("youtube_url", promptForm.youtube_url);
          if (promptForm.videoFile) body.append("video", promptForm.videoFile);
          if (promptForm.imageFile) body.append("file", promptForm.imageFile);
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify({
            title: promptForm.title,
            content: promptForm.content,
            description: promptForm.description,
            tags: typeof promptForm.tags === "string"
              ? promptForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : promptForm.tags,
            category_id: !promptForm.category_id || promptForm.category_id === "none"
              ? null
              : Number(promptForm.category_id),
            is_favorite: promptForm.is_favorite,
            image_url: promptForm.image_url || "",
            video_url: promptForm.video_url || "",
            youtube_url: promptForm.youtube_url || "",
          });
        }

        // 🔄 Requisição em background
        const response = await api.post(endpoint, body, { headers });
        const data = response.data;

        if (data.success) {
          const serverPrompt = data.data || data.prompt || data.updated || null;
          
          // ✅ Substitui temporário pelo real MANTENDO _tempId e _skipAnimation
          if (serverPrompt) {
            setPrompts(prev => 
              prev.map(p => p.id === tempId 
                ? { 
                    ...serverPrompt, 
                    _tempId: tempId, // Mantém o ID temp como key estável
                    _skipAnimation: true 
                  }
                : p
              )
            );
          } else {
            setTimeout(() => loadPrompts(), 800);
          }
          
          await loadStats();
        } else {
          // ❌ Remove temporário se falhar
          setPrompts(prev => prev.filter(p => p.id !== tempId));
          toast.error(data.error || "Erro ao criar prompt");
        }
      } catch (err) {
        console.error("❌ ERRO AO CRIAR PROMPT:", err);
        // ❌ Remove temporário se erro
        setPrompts(prev => prev.filter(p => p.id !== tempId));
        toast.error("Erro ao criar prompt. Verifique o console.");
      }
    } 
    // ========================================
    // EDITAR PROMPT - OPTIMISTIC UPDATE
    // ========================================
    else {
      const previousPrompts = [...prompts];
      
      const updatedPrompt = {
        ...editingPrompt,
        title: promptForm.title,
        content: promptForm.content,
        description: promptForm.description,
        tags: promptForm.tags,
        category_id: promptForm.category_id === "none" ? null : Number(promptForm.category_id),
        category: promptForm.category_id !== "none" 
          ? myCategories.find(c => String(c.id) === String(promptForm.category_id))
          : null,
        is_favorite: promptForm.is_favorite,
        image_url: promptForm.image_url || "",
        video_url: promptForm.video_url || "",
        youtube_url: promptForm.youtube_url || "",
        updated_at: new Date().toISOString(),
      };

      // ✅ Atualiza UI IMEDIATAMENTE
      setPrompts(prev => 
        prev.map(p => p.id === editingPrompt.id ? updatedPrompt : p)
      );
      
      // ✅ Fecha dialog e limpa formulário ANTES da requisição
      setIsPromptDialogOpen(false);
      resetPromptForm();
      
      // ✅ Feedback instantâneo
      toast.success('✏️ Prompt atualizado!');

      try {
        let body;
        let headers = {};
        
        const shouldUseFormData =
          (promptForm.videoFile && !promptForm.video_url) ||
          (promptForm.imageFile && !promptForm.image_url);

        if (shouldUseFormData) {
          body = new FormData();
          body.append("title", promptForm.title);
          body.append("content", promptForm.content);
          body.append("description", promptForm.description);
          body.append("tags", Array.isArray(promptForm.tags) ? promptForm.tags.join(",") : promptForm.tags);
          
          const categoryValue = !promptForm.category_id || promptForm.category_id === "none"
            ? ""
            : String(promptForm.category_id);
          body.append("category_id", categoryValue);
          body.append("is_favorite", promptForm.is_favorite ? "true" : "false");
          
          if (promptForm.image_url) body.append("image_url", promptForm.image_url);
          if (promptForm.youtube_url) body.append("youtube_url", promptForm.youtube_url);
          if (promptForm.videoFile) body.append("video", promptForm.videoFile);
          if (promptForm.imageFile) body.append("file", promptForm.imageFile);
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify({
            title: promptForm.title,
            content: promptForm.content,
            description: promptForm.description,
            tags: typeof promptForm.tags === "string"
              ? promptForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : promptForm.tags,
            category_id: !promptForm.category_id || promptForm.category_id === "none"
              ? null
              : Number(promptForm.category_id),
            is_favorite: promptForm.is_favorite,
            image_url: promptForm.image_url || "",
            video_url: promptForm.video_url || "",
            youtube_url: promptForm.youtube_url || "",
          });
        }

        // 🔄 Requisição em background
        const response = await api.put(endpoint, body, { headers });
        const data = response.data;

        if (data.success) {
          const serverPrompt = data.data || data.prompt || data.updated || null;
          
          // ✅ Atualiza com dados do servidor
          if (serverPrompt) {
            setPrompts(prev => 
              prev.map(p => p.id === serverPrompt.id ? serverPrompt : p)
            );
          } else {
            setTimeout(() => loadPrompts(), 800);
          }
          
          await loadStats();
        } else {
          // ❌ Reverte se falhar
          setPrompts(previousPrompts);
          toast.error(data.error || "Erro ao atualizar prompt");
        }
      } catch (err) {
        console.error("❌ ERRO AO EDITAR PROMPT:", err);
        // ❌ Reverte se erro
        setPrompts(previousPrompts);
        toast.error("Erro ao atualizar prompt. Verifique o console.");
      }
    }
  } catch (err) {
    console.error("❌ ERRO GERAL:", err);
    toast.error("Erro ao salvar prompt");
  }
};

  const saveCategory = async () => {
    try {
      const response = editingCategory
        ? await api.put(`/categories/${editingCategory.id}`, categoryForm)
        : await api.post("/categories", categoryForm);
      const data = response.data;
      if (data.success) {
        loadCategories();
        loadStats();
        resetCategoryForm();
        setIsCategoryDialogOpen(false);
      } else toast.error(data.error || "Erro ao salvar categoria");
    } catch {
      toast.error("Erro ao salvar categoria");
    }
  };

  // ========================================
// 🗑️ DELETE CATEGORY - COM CONFIRMAÇÃO E RECARREGAMENTO
// ========================================
const deleteCategory = async (id) => {
  if (!id) {
    toast.error("Categoria inválida!");
    return;
  }

  if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

  try {
    // Remove da UI imediatamente (opcional)
    setMyCategories((prev) => prev.filter((cat) => cat.id !== id));

    const response = await api.delete(`/categories/${id}`);
    const data = response.data;

    if (data.success) {
      toast.success("🗑️ Categoria removida com sucesso!");
      loadCategories();
      loadStats();
    } else {
      toast.error(data.error || "Erro ao deletar categoria");
      // Recarrega lista caso o backend não tenha atualizado corretamente
      loadCategories();
    }
  } catch (err) {
    console.error("❌ Erro ao deletar categoria:", err);
    toast.error("Erro ao excluir categoria");
    // Recarrega lista para manter estado consistente
    loadCategories();
  }
};


  // ========================================
// 🆕 DELETE PROMPT - COM OPTIMISTIC UPDATES E PROTEÇÃO PARA IDs TEMPORÁRIOS
// ========================================
const deletePrompt = async (id) => {
  // 🛡️ PROTEÇÃO: Não permite deletar prompts com ID temporário
  if (String(id).startsWith('temp-')) {
    toast.warning('⏳ Aguarde o prompt ser criado antes de deletar!', {
      duration: 3000,
    });
    return;
  }

  if (!confirm("Tem certeza que deseja deletar este prompt?")) return;
  
  // 1. Salva estado anterior (para rollback)
  const previousPrompts = [...prompts];
  
  // 2. Remove da UI IMEDIATAMENTE
  setPrompts(prompts.filter(p => p.id !== id));
  
  // 3. Feedback instantâneo
  toast.success('🗑️ Prompt deletado!');
  
  try {
    // 4. Faz requisição em background
    const response = await api.delete(`/prompts/${id}`);
    const data = response.data;
    
    if (data.success) {
      // Atualiza estatísticas
      loadStats();
    } else {
      // 5. Se falhar, REVERTE
      setPrompts(previousPrompts);
      toast.error(data.error || "Erro ao deletar prompt");
    }
  } catch (error) {
    // 6. Se erro, REVERTE
    console.error('❌ Erro ao deletar:', error);
    setPrompts(previousPrompts);
    toast.error("Erro ao deletar prompt");
  }
};
  // ========================================
  // ✅ TOGGLE FAVORITE - JÁ ESTAVA PERFEITO!
  // ========================================
  const toggleFavorite = async (prompt) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
      )
    );

    try {
      const response = await api.post(`/prompts/${prompt.id}/favorite`);
      const data = response.data;
      if (data.success) {
        loadStats();
      }

      if (!data.success) {
        setPrompts((prev) =>
          prev.map((p) =>
            p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
          )
        );
        toast.error("Erro ao atualizar favorito");
      }
    } catch (err) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );
      toast.error("Erro ao conectar ao servidor");
    }
  };

  const copyToClipboard = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      await api.post(`/prompts/${prompt.id}/copy`);
      loadPrompts();
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Erro ao copiar prompt");
    }
  };

  useEffect(() => {
    if (isPopupMode && defaultView === "chat") {
      setShowChatModal(true);
    }
  }, [isPopupMode, defaultView]);

  if (showTemplates) {
    return (
      <TemplatesPage
        user={user}
        onBack={() => {
          setShowTemplates(false);
          loadPrompts();
          loadCategories();
          loadStats();
        }}
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
      {/* Cabeçalho principal */}
      <Header
        user={user}
        handleLogout={handleLogout}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* Corpo principal */}
      <div className="w-full px-6 lg:px-10 xl:px-14 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 xl:gap-8">
          {/* Fundo escuro (abre/fecha sidebar no mobile) */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar lateral */}
          <Sidebar
            stats={stats}
            myCategories={myCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            resetCategoryForm={resetCategoryForm}
            setIsCategoryDialogOpen={setIsCategoryDialogOpen}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            editCategory={editCategory}
            deleteCategory={deleteCategory}
            isMobileSidebarOpen={isMobileSidebarOpen}
            user={user}
            handleLogout={handleLogout}
          />

          {/* Rodapé fixo (mobile) */}

          {/* Conteúdo principal */}
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

              <Button
                onClick={openChatIntelligently}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                size="sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </Button>

              <Button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                size="sm"
              >
                <BookText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </Button>

              <Button
                onClick={() => {
                  resetPromptForm();
                  setIsPromptDialogOpen(true);
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </div>

            <PromptGrid
              prompts={filteredPrompts}
              isLoading={false}
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
              onToggleFavorite={toggleFavorite}
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

    {/* 🔹 Dialog de categoria */}
    <Dialog
      open={isCategoryDialogOpen}
      onOpenChange={setIsCategoryDialogOpen}
    >
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-[9999]">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? "Edite os dados da categoria"
              : "Crie uma nova categoria pessoal"}
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
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
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
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, color: e.target.value })
                }
                className="w-12 h-10 rounded border border-slate-300"
              />
              <Input
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, color: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveCategory}>
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* 🔹 Dialog de prompt */}
    <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700">
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
        {/* Conteúdo do formulário de prompt aqui */}
      </DialogContent>
    </Dialog>

    {/* 🔹 Outros modais */}
    <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
      {/* Conteúdo do image modal */}
    </Dialog>

    <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
      {/* Conteúdo do video modal */}
    </Dialog>

    {/* 🔹 Chat e compartilhamento */}
    <ChatModal
      isOpen={showChatModal}
      onClose={() => setShowChatModal(false)}
      onPromptSaved={handlePromptSaved}
    />

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
          loadPrompts();
        }}
      />
    )}
  </>
);
}
