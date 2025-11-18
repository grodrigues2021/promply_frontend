// src/components/PromptManager.jsx
import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// UI Components
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Icons
import {
  Search,
  X,
  Star,
  BookText,
  MessageSquare,
  Plus,
  ChevronDown,
} from "lucide-react";

// Custom Components
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import PromptGrid from "./PromptGrid";
import TemplatesPage from "./TemplatesPage.jsx";
import DebugUser from "./DebugUser";

// Hooks & Utils
import { useAuth } from "../hooks/useAuth";
import { usePromptsQuery } from "../hooks/usePromptsQuery";
import { useCategoriesQuery } from "../hooks/useCategoriesQuery";
import { useStats } from "../hooks/useStats";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import api from "../lib/api";

// ===== CONSTANTES =====
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const VIDEO_UPLOAD_TIMEOUT = 300000; // 5 minutos
const DEFAULT_UPLOAD_TIMEOUT = 120000; // 2 minutos

const INITIAL_PROMPT_FORM = {
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
};

const INITIAL_CATEGORY_FORM = {
  name: "",
  description: "",
  color: "#3B82F6",
  is_template: false,
};

// Lazy loads
const SharePromptModal = lazy(() => import("./SharePromptModal"));

// ===== HELPER FUNCTIONS =====
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function normalizeTags(tags) {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  return tags;
}

async function captureVideoThumbnail(file) {
  return new Promise((resolve, reject) => {
    const videoURL = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
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
          canvas.remove();
          cleanup();
          resolve({ thumbnailFile, thumbnailBase64 });
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Erro ao processar vídeo"));
    };

    video.src = videoURL;
  });
}

// ===== COMPONENTE PRINCIPAL =====
export default function PromptManager({
  setIsAuthenticated,
  setUser,
  defaultView = "prompts",
  isPopupMode = false,
}) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Estados principais
  const [prompts, setPrompts] = useState([]);
  const [myCategories, setMyCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modais
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Estados de edição
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [promptToShare, setPromptToShare] = useState(null);

  // Estados de upload
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estados de chat
  const [ChatComponent, setChatComponent] = useState(null);
  const [isChatDetached, setIsChatDetached] = useState(false);

  // Formulários
  const [promptForm, setPromptForm] = useState(INITIAL_PROMPT_FORM);
  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);
  const [categorySearch, setCategorySearch] = useState("");

  // Queries
  const { data: stats = {} } = useStats();
  const { data: promptsData = [], isLoading: loadingPrompts } = usePromptsQuery();
  const { data: categoriesData, isLoading: loadingCategories } = useCategoriesQuery();

  // Lock scroll quando modais estão abertos
  useLockBodyScroll(isPromptDialogOpen || isCategoryDialogOpen || isMobileSidebarOpen);

  // ===== EFFECTS =====
  useEffect(() => {
    if (categoriesData) {
      setMyCategories(categoriesData.my || []);
    }
  }, [categoriesData]);

  useEffect(() => {
    if (Array.isArray(promptsData)) {
      setPrompts(promptsData);
    }
  }, [promptsData]);

  useEffect(() => {
    if (isPopupMode && defaultView === "chat") {
      setShowChatModal(true);
    }
  }, [isPopupMode, defaultView]);

  useEffect(() => {
    if (showChatModal && !ChatComponent) {
      import("./ChatContainer.jsx").then((module) => {
        setChatComponent(() => module.default);
      });
    }
  }, [showChatModal, ChatComponent]);

  // Chat detached listener
  useEffect(() => {
    const channel = new BroadcastChannel("promply-chat-status");

    channel.onmessage = (event) => {
      switch (event.data.type) {
        case "chat-detached":
          setIsChatDetached(true);
          setShowChatModal(false);
          break;
        case "chat-closed":
          setIsChatDetached(false);
          break;
        case "pong":
          setIsChatDetached(true);
          setShowChatModal(false);
          break;
        default:
          break;
      }
    };

    channel.postMessage({ type: "ping" });
    return () => channel.close();
  }, []);

  // ===== FORM HANDLERS =====
  const resetPromptForm = useCallback(() => {
    setPromptForm(INITIAL_PROMPT_FORM);
    setEditingPrompt(null);
  }, []);

  const resetCategoryForm = useCallback(() => {
    setCategoryForm(INITIAL_CATEGORY_FORM);
    setEditingCategory(null);
  }, []);

  // ===== UPLOAD HANDLERS =====
  const handleImageUpload = useCallback(async (e) => {
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

      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Imagem muito grande! Máx. 5MB.");
        return;
      }

      setUploadingImage(true);
      toast.loading("Enviando imagem...");

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
  }, []);

  const handleVideoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um vídeo válido");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Vídeo muito grande! Máx. 50MB");
      return;
    }

    setUploadingImage(true);
    toast.info("🎬 Processando vídeo...");

    try {
      const { thumbnailFile, thumbnailBase64 } = await captureVideoThumbnail(file);

      setPromptForm((prev) => ({
        ...prev,
        videoFile: file,
        video_url: "",
        image_url: prev.image_url || thumbnailBase64,
        imageFile: prev.imageFile || thumbnailFile,
        youtube_url: "",
      }));

      toast.success("Vídeo processado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar vídeo:", error);
      toast.error("Erro ao processar vídeo");
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const removeImage = useCallback(() => {
    setPromptForm((prev) => ({ ...prev, image_url: "", imageFile: null }));
    toast.success("Imagem removida");
  }, []);

  // ===== EDIT HANDLERS =====
  const editPrompt = useCallback((prompt) => {
    setEditingPrompt(prompt);

    requestAnimationFrame(() => {
      const categoryId = prompt.category?.id
        ? String(prompt.category.id)
        : prompt.category_id
        ? String(prompt.category_id)
        : "none";

      let mediaType = "none";
      if (prompt.youtube_url) mediaType = "youtube";
      else if (prompt.video_url) mediaType = "video";
      else if (prompt.image_url) mediaType = "imagem";

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
        selectedMedia: mediaType,
      });

      setIsPromptDialogOpen(true);
    });
  }, []);

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

  // ===== SAVE HANDLERS =====
  const savePrompt = useCallback(async () => {
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

      // Preparar body
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
        body.append(
          "tags",
          Array.isArray(promptForm.tags)
            ? promptForm.tags.join(",")
            : promptForm.tags
        );

        const categoryValue =
          !promptForm.category_id || promptForm.category_id === "none"
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
          tags:
            typeof promptForm.tags === "string"
              ? promptForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
              : promptForm.tags,
          category_id:
            !promptForm.category_id || promptForm.category_id === "none"
              ? null
              : Number(promptForm.category_id),
          is_favorite: promptForm.is_favorite,
          image_url: promptForm.image_url || "",
          video_url: promptForm.video_url || "",
          youtube_url: promptForm.youtube_url || "",
        });
      }

      const timeoutDuration = promptForm.videoFile
        ? VIDEO_UPLOAD_TIMEOUT
        : DEFAULT_UPLOAD_TIMEOUT;

      if (!isEditing) {
        // Criar novo prompt com UI otimista
        const tempId = `temp-${Date.now()}`;

        const optimisticPrompt = {
          id: tempId,
          _tempId: tempId,
          _skipAnimation: true,
          title: promptForm.title,
          content: promptForm.content,
          description: promptForm.description,
          tags: promptForm.tags,
          category_id:
            promptForm.category_id === "none"
              ? null
              : Number(promptForm.category_id),
          category:
            promptForm.category_id !== "none"
              ? myCategories.find(
                  (c) => String(c.id) === String(promptForm.category_id)
                )
              : null,
          is_favorite: promptForm.is_favorite,
          image_url: promptForm.image_url || "",
          video_url: promptForm.video_url || "",
          youtube_url: promptForm.youtube_url || "",
          created_at: new Date().toISOString(),
          _isOptimistic: true,
        };

        setPrompts([optimisticPrompt, ...prompts]);
        setIsPromptDialogOpen(false);
        resetPromptForm();
        toast.success("✅ Prompt criado!");

        try {
          const response = await api.post(endpoint, body, {
            headers,
            timeout: timeoutDuration,
          });

          if (response.data.success) {
            const serverPrompt = response.data.data || response.data.prompt;

            if (serverPrompt) {
              setPrompts((prev) =>
                prev.map((p) =>
                  p.id === tempId
                    ? { ...serverPrompt, _tempId: tempId, _skipAnimation: true }
                    : p
                )
              );
            } else {
              setTimeout(() => {
                queryClient.invalidateQueries(["prompts"]);
              }, 800);
            }

            queryClient.invalidateQueries(["stats"]);
          } else {
            setPrompts((prev) => prev.filter((p) => p.id !== tempId));
            toast.error(response.data.error || "Erro ao criar prompt");
          }
        } catch (err) {
          console.error("❌ Erro ao criar prompt:", err);
          setPrompts((prev) => prev.filter((p) => p.id !== tempId));

          if (err.code === "ECONNABORTED") {
            toast.error("⏱️ Tempo esgotado. Tente com arquivo menor.", {
              duration: 5000,
            });
          } else if (err.response?.status === 413) {
            toast.error("📦 Arquivo muito grande! Máx 50MB.");
          } else {
            toast.error("❌ Erro ao salvar. Tente novamente.");
          }
        }
      } else {
        // Atualizar prompt existente
        const previousPrompts = [...prompts];

        const updatedPrompt = {
          ...editingPrompt,
          title: promptForm.title,
          content: promptForm.content,
          description: promptForm.description,
          tags: promptForm.tags,
          category_id:
            promptForm.category_id === "none"
              ? null
              : Number(promptForm.category_id),
          category:
            promptForm.category_id !== "none"
              ? myCategories.find(
                  (c) => String(c.id) === String(promptForm.category_id)
                )
              : null,
          is_favorite: promptForm.is_favorite,
          image_url: promptForm.image_url || "",
          video_url: promptForm.video_url || "",
          youtube_url: promptForm.youtube_url || "",
          updated_at: new Date().toISOString(),
        };

        setPrompts((prev) =>
          prev.map((p) => (p.id === editingPrompt.id ? updatedPrompt : p))
        );

        setIsPromptDialogOpen(false);
        resetPromptForm();
        toast.success("✏️ Prompt atualizado!");

        try {
          const response = await api.put(endpoint, body, {
            headers,
            timeout: timeoutDuration,
          });

          if (response.data.success) {
            const serverPrompt = response.data.data || response.data.updated;

            if (serverPrompt) {
              setPrompts((prev) =>
                prev.map((p) => (p.id === serverPrompt.id ? serverPrompt : p))
              );
            } else {
              setTimeout(() => {
                queryClient.invalidateQueries(["prompts"]);
              }, 800);
            }

            queryClient.invalidateQueries(["stats"]);
          } else {
            setPrompts(previousPrompts);
            toast.error(response.data.error || "Erro ao atualizar prompt");
          }
        } catch (err) {
          console.error("❌ Erro ao editar prompt:", err);
          setPrompts(previousPrompts);

          if (err.code === "ECONNABORTED") {
            toast.error("⏱️ Tempo esgotado. Tente novamente.", {
              duration: 5000,
            });
          } else {
            toast.error("❌ Erro ao atualizar.");
          }
        }
      }
    } catch (err) {
      console.error("❌ Erro geral:", err);
      toast.error("Erro ao salvar prompt");
    }
  }, [
    uploadingImage,
    promptForm,
    editingPrompt,
    prompts,
    myCategories,
    resetPromptForm,
    queryClient,
  ]);

  const saveCategory = useCallback(async () => {
    try {
      const response = editingCategory
        ? await api.put(`/categories/${editingCategory.id}`, categoryForm)
        : await api.post("/categories", categoryForm);

      if (response.data.success) {
        queryClient.invalidateQueries(["categories"]);
        queryClient.invalidateQueries(["stats"]);
        resetCategoryForm();
        setIsCategoryDialogOpen(false);
        toast.success(
          editingCategory ? "Categoria atualizada!" : "Categoria criada!"
        );
      } else {
        toast.error(response.data.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error("Erro ao salvar categoria");
    }
  }, [editingCategory, categoryForm, resetCategoryForm, queryClient]);

  // ===== DELETE HANDLERS =====
  const deletePrompt = useCallback(
    async (id) => {
      if (String(id).startsWith("temp-")) {
        toast.warning("⏳ Aguarde o prompt ser criado antes de deletar!");
        return;
      }

      if (!window.confirm("Tem certeza que deseja deletar este prompt?")) return;

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
    },
    [prompts, queryClient]
  );

  const deleteCategory = useCallback(
    async (id) => {
      if (!id) {
        toast.error("Categoria inválida!");
        return;
      }

      if (!window.confirm("Tem certeza que deseja excluir esta categoria?"))
        return;

      try {
        setMyCategories((prev) => prev.filter((cat) => cat.id !== id));

        const response = await api.delete(`/categories/${id}`);

        if (response.data.success) {
          toast.success("🗑️ Categoria removida com sucesso!");
          queryClient.invalidateQueries(["categories"]);
          queryClient.invalidateQueries(["stats"]);
        } else {
          toast.error(response.data.error || "Erro ao deletar categoria");
        }
      } catch (err) {
        console.error("❌ Erro ao deletar categoria:", err);
        toast.error("Erro ao excluir categoria");
      }
    },
    [queryClient]
  );

  // ===== OTHER HANDLERS =====
  const toggleFavorite = useCallback(
    async (prompt) => {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );

      try {
        const response = await api.post(`/prompts/${prompt.id}/favorite`);

        if (response.data.success) {
          queryClient.invalidateQueries(["stats"]);
        } else {
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
    },
    [queryClient]
  );

  const copyToClipboard = useCallback(async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      await api.post(`/prompts/${prompt.id}/copy`);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Erro ao copiar prompt");
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
    queryClient.invalidateQueries(["prompts"]);
    queryClient.invalidateQueries(["categories"]);
    queryClient.invalidateQueries(["stats"]);
    toast.success("✅ Prompt adicionado com sucesso!");
  }, [queryClient]);

  const openChatFromTopButton = useCallback(() => {
    if (window.innerWidth < 768) {
      setShowChatModal(true);
    } else {
      if (isChatDetached) {
        const channel = new BroadcastChannel("promply-chat-status");
        channel.postMessage({ type: "focus-chat" });
        channel.close();
        toast.success("💬 Chat destacado atualizado!");
      } else {
        setShowChatModal(true);
      }
    }
  }, [isChatDetached]);

  const openImageModal = useCallback((imageBase64, title) => {
    // Implementar modal de imagem se necessário
    console.log("Abrir imagem:", title);
  }, []);

  const openVideoModal = useCallback((url) => {
    // Implementar modal de vídeo se necessário
    console.log("Abrir vídeo:", url);
  }, []);

  // ===== COMPUTED VALUES =====
  const filteredPrompts = useMemo(() => {
    if (!Array.isArray(prompts)) return [];

    return prompts.filter((prompt) => {
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
    });
  }, [prompts, searchTerm, selectedCategory, showFavoritesOnly]);

  // ===== RENDER =====
  if (showTemplates) {
    return (
      <TemplatesPage
        user={user}
        onBack={() => {
          setShowTemplates(false);
          queryClient.invalidateQueries(["prompts"]);
          queryClient.invalidateQueries(["categories"]);
          queryClient.invalidateQueries(["stats"]);
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
        <Header
          user={user}
          handleLogout={handleLogout}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        <div className="w-full px-6 lg:px-10 xl:px-14 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 xl:gap-8">
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 lg:hidden"
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

      {/* Modal de Categoria */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700 z-[10000]">
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
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Nome da categoria"
              />
            </div>

            <div>
              <Label htmlFor="cat-desc">Descrição</Label>
              <Textarea
                id="cat-desc"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label htmlFor="cat-color">Cor</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="cat-color"
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
                  placeholder="#3B82F6"
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

      {/* Modal de Prompt */}
      <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-200 dark:border-slate-700 p-6">
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
              <Label htmlFor="prompt-title">Título</Label>
              <Input
                id="prompt-title"
                value={promptForm.title}
                onChange={(e) =>
                  setPromptForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Título do prompt"
              />
            </div>

            <div>
              <Label htmlFor="prompt-content">Conteúdo</Label>
              <Textarea
                id="prompt-content"
                value={promptForm.content}
                onChange={(e) =>
                  setPromptForm((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={10}
                className="w-full max-h-96 overflow-y-auto resize-y whitespace-pre-wrap break-words"
                placeholder="Digite o conteúdo do prompt..."
              />
            </div>

            <div>
              <Label htmlFor="prompt-desc">Descrição</Label>
              <Textarea
                id="prompt-desc"
                value={promptForm.description}
                onChange={(e) =>
                  setPromptForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descrição opcional"
              />
            </div>

            {/* Tipo de mídia */}
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo de mídia
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { key: "none", label: "Nenhum", icon: "❌" },
                  { key: "imagem", label: "Imagem", icon: "📷" },
                  { key: "video", label: "Vídeo", icon: "🎥" },
                  { key: "youtube", label: "YouTube", icon: "🔗" },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setPromptForm((prev) => ({
                        ...prev,
                        selectedMedia: key,
                        image_url: "",
                        video_url: "",
                        youtube_url: "",
                        videoFile: null,
                        imageFile: null,
                      }))
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

            {/* Upload de imagem */}
            {promptForm.selectedMedia === "imagem" && (
              <div className="mt-4 space-y-2">
                <Label>Upload de imagem</Label>
                {promptForm.image_url ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={promptForm.image_url}
                      alt="Preview"
                      className="object-contain w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      aria-label="Remover imagem"
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

            {/* Upload de vídeo */}
            {promptForm.selectedMedia === "video" && (
              <div className="mt-4 space-y-2">
                <Label>Upload de vídeo</Label>
                {promptForm.video_url ? (
                  <div className="relative w-full h-56 rounded-lg overflow-hidden border">
                    <video
                      src={promptForm.video_url}
                      controls
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPromptForm((prev) => ({
                          ...prev,
                          video_url: "",
                          videoFile: null,
                        }))
                      }
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      aria-label="Remover vídeo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="prompt-video-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Selecione um vídeo
                    </span>
                    <input
                      id="prompt-video-upload"
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/mov"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Link do YouTube */}
            {promptForm.selectedMedia === "youtube" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="youtube-url">Link do YouTube</Label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={promptForm.youtube_url || ""}
                  onChange={(e) =>
                    setPromptForm((prev) => ({
                      ...prev,
                      youtube_url: e.target.value.trim(),
                      video_url: "",
                      image_url: "",
                      videoFile: null,
                      imageFile: null,
                    }))
                  }
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cole o link completo do vídeo (formato válido do YouTube)
                </p>
              </div>
            )}

            {/* Categoria */}
            <div className="mt-4">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Categoria
              </Label>

              {/* Desktop */}
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

              {/* Mobile */}
              <div className="block sm:hidden relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCategoryModal(true);
                  }}
                  className="w-full px-4 py-2.5 text-left bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition flex items-center justify-between touch-manipulation cursor-pointer"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-200 pointer-events-none">
                    {promptForm.category_id === "none" ||
                    !promptForm.category_id
                      ? "Selecione uma categoria"
                      : myCategories.find(
                          (c) =>
                            String(c.id) === String(promptForm.category_id)
                        )?.name || "Sem categoria"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
                </button>
              </div>
            </div>

            {/* Favorito */}
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
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <Label htmlFor="prompt-favorite">Marcar como favorito</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPromptDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={savePrompt} disabled={uploadingImage}>
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : editingPrompt ? (
                  "Salvar"
                ) : (
                  "Criar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Categoria Mobile */}
      {createPortal(
        <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
          <DialogContent className="max-w-sm w-full rounded-xl p-4 bg-white dark:bg-slate-900 max-h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Selecionar Categoria</DialogTitle>
            </DialogHeader>

            <Input
              placeholder="Buscar categoria..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="mb-3"
            />

            <div
              className="flex-1 overflow-y-auto pr-2"
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              <div className="space-y-2 pb-4">
                <button
                  className="w-full text-left px-3 py-2 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    setPromptForm((prev) => ({ ...prev, category_id: "none" }));
                    setShowCategoryModal(false);
                    setCategorySearch("");
                  }}
                >
                  Sem categoria
                </button>

                {myCategories
                  .filter((cat) =>
                    cat.name
                      .toLowerCase()
                      .includes(categorySearch.toLowerCase())
                  )
                  .map((cat) => (
                    <button
                      key={cat.id}
                      className="w-full text-left px-3 py-2 rounded-md border hover:bg-slate-50 dark:hover:bg-slate-800"
                      onClick={() => {
                        setPromptForm((prev) => ({
                          ...prev,
                          category_id: String(cat.id),
                        }));
                        setShowCategoryModal(false);
                        setCategorySearch("");
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <Button
                variant="outline"
                onClick={() => setShowCategoryModal(false)}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>,
        document.getElementById("category-modal-root")
      )}

      {/* Modals com Suspense */}
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
        {showChatModal && ChatComponent && (
          <ChatComponent
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
            onPromptSaved={handlePromptSaved}
          />
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
              openChatFromTopButton();
              queryClient.invalidateQueries(["prompts"]);
              queryClient.invalidateQueries(["categories"]);
            }}
          />
        )}
      </Suspense>

      {/* ⚠️ DEBUG - REMOVA EM PRODUÇÃO */}
      <DebugUser />
    </>
  );
}