// src/components/PromptCard.jsx - VERSÃO CORRIGIDA E OTIMIZADA
import React, { useMemo, useState, useEffect, useRef, } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import {
  Star,
  Copy,
  Edit,
  Trash2,
  Play,
  Image as ImageIcon,
  Share2,
  PlusCircle,
  Tag as TagIcon,
  X,
  Youtube,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import api from "../lib/api";
import { resolveMediaUrl, resolveMediaUrlWithCache } from "../lib/media";
import { getYoutubeThumbnail } from "../lib/youtube";



const cardVariants = cva(
  "group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] border-[2px] border-transparent hover:border-indigo-500",
  {
    variants: {
      layout: {
        vertical: "flex flex-col",
        horizontal: "flex flex-col sm:flex-row items-stretch flex-wrap sm:flex-nowrap",
      },
      hover: {
        none: "",
        lift: "hover:shadow-xl hover:-translate-y-1",
        glow: "hover:shadow-2xl hover:shadow-indigo-200/50",
      },
    },
    defaultVariants: {
      layout: "horizontal",
      hover: "lift",
    },
  }
);

const mediaVariants = cva(
  "relative flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden",
  {
    variants: {
      layout: {
        vertical: "w-full h-40",
        horizontal: "flex-shrink-0 w-full sm:w-52 h-[200px] sm:h-[230px] rounded-t-xl sm:rounded-r-xl",
      },
    },
  }
);

const contentVariants = cva("flex flex-col justify-between p-4 min-w-0", {
  variants: {
    layout: {
      vertical: "flex-1",
      horizontal: "flex-1 h-auto sm:h-[230px] min-w-0 overflow-visible sm:overflow-hidden",
    },
  },
});

const extractYouTubeId = (url) => {
  if (!url) return null;
  try {
    const idMatch =
      url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
      url.match(/v=([a-zA-Z0-9_-]{11})/);
    return idMatch ? idMatch[1] : null;
  } catch (err) {
    console.warn("[YouTube Extract Error]", err);
    return null;
  }
};

// --- 🎬 MODAL COMPLETO COM BOTÕES DE DOWNLOAD E COPIAR ---
const MediaModal = ({ type, src, videoId, title, onClose }) => {
  if (!type) return null;

  const downloadImage = async () => {
    try {
      toast.info("⏳ Baixando imagem...");

      const extension = src.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)?.[1] || "jpg";
      const filename = `${title || "imagem"}.${extension}`;

      let friendlySrc = src;
      if (src.includes("s3.us-east-005.backblazeb2.com")) {
        friendlySrc = src
          .replace("https://promptly-staging.s3.us-east-005.backblazeb2.com", "https://f005.backblazeb2.com/file/promptly-staging")
          .replace("https://s3.us-east-005.backblazeb2.com/promply-staging", "https://f005.backblazeb2.com/file/promply-staging");
      }

      const response = await fetch(friendlySrc, { mode: 'cors' });
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
      window.open(src, "_blank");
    }
  };

  const downloadVideo = async () => {
    try {
      toast.info("⏳ Baixando vídeo...");
      
      const response = await fetch(src);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("✅ Download do vídeo concluído!");
    } catch (error) {
      console.error("❌ Erro ao baixar vídeo:", error);
      toast.error("Erro ao baixar. Abrindo em nova aba...");
      window.open(src, "_blank");
    }
  };

  const copyYouTubeLink = async () => {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      await navigator.clipboard.writeText(youtubeUrl);
      
      toast.success("✅ Link do YouTube copiado!", {
        position: "top-center",
        duration: 2000,
      });
    } catch (error) {
      console.error("❌ Erro ao copiar link:", error);
      toast.error("❌ Erro ao copiar link do YouTube");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
      <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-black/70">
          <h3 className="text-white font-semibold truncate flex-1 mr-4">
            {title || "Mídia"}
          </h3>

          <div className="flex gap-2">
            {type === "youtube" && (
              <Button onClick={copyYouTubeLink} className="bg-red-600 text-white hover:bg-red-700">
                <Copy className="w-4 h-4 mr-1" /> Copiar Link
              </Button>
            )}
            {type === "image" && (
              <Button onClick={downloadImage} className="bg-blue-600 text-white hover:bg-blue-700">
                <Download className="w-4 h-4 mr-1" /> Baixar
              </Button>
            )}
            {type === "video" && (
              <Button onClick={downloadVideo} className="bg-purple-600 text-white hover:bg-purple-700">
                <Download className="w-4 h-4 mr-1" /> Baixar
              </Button>
            )}
            <Button onClick={onClose} className="bg-gray-700 text-white hover:bg-gray-600">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-black flex items-center justify-center">
          {type === "image" && (
            <img
              src={src}
              alt={title}
              className="w-full h-auto max-h-[80vh] object-contain"
              loading="lazy"
            />
          )}

          {type === "video" && (
            <video
              src={src}
              controls
              playsInline
              preload="metadata"
              autoPlay
              className="w-full h-auto max-h-[80vh] bg-black"
            />
          )}

          {type === "youtube" && videoId && (
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ==========================================
   📦 COMPONENTE PROMPT CARD
   ========================================== */
const PromptCard = React.memo(({
  prompt,
  authorName,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onOpenImage,
  onOpenVideo,
  className,
  onSave,
  onShare,
  isInChat
}) => {
  // Estado dos anexos
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  // Estado do modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    src: null,
    videoId: null,
  });

  // 🎯 Detecta se é um prompt otimista (temporário)
  // 🎯 Detecta se é um prompt otimista (temporário) ou fazendo upload
  // 🎯 Detecta se é um prompt otimista (temporário)
// 🔒 Um prompt só deve ser bloqueado enquanto NÃO existir no backend
const isOptimistic = useMemo(() => {
  // Segurança defensiva
  if (!prompt || !prompt.id) return true;

  const isTempId = String(prompt.id).startsWith("temp-");

  if (isTempId) {
    console.log("🔒 Prompt ainda otimista (ID temporário):", {
      id: prompt.id,
      title: prompt.title,
    });
  }

  return isTempId;
}, [prompt?.id, prompt?.title]);



// =====================================================
// 🖼️ MEDIA INFO NORMALIZADO (ANTI-INCONSISTÊNCIA)
// =====================================================
const stableThumbnailRef = useRef(null);

// -----------------------------------------------------
// 🔄 RESET DO REF QUANDO O PROMPT MUDA
// -----------------------------------------------------
useEffect(() => {
  stableThumbnailRef.current = null;
}, [prompt._clientId]);

const mediaInfo = useMemo(() => {
  const thumbUrl = prompt.thumb_url || "";
  const imageUrl = prompt.image_url || "";
  const videoUrl = prompt.video_url || "";
  const youtubeUrl = prompt.youtube_url || "";

  let thumbnailUrl = "";
  let hasImage = false;
  let hasLocalVideo = false;
  let hasYouTubeVideo = false;
  let videoId = null;
  let finalVideoUrl = "";

  // -------------------------------------------------
  // 🎬 YOUTUBE
  // -------------------------------------------------
  if (youtubeUrl) {
    hasYouTubeVideo = true;
    videoId = extractYouTubeId(youtubeUrl);
    thumbnailUrl = getYoutubeThumbnail(youtubeUrl);
  }

  // -------------------------------------------------
  // 🎥 VÍDEO LOCAL
  // -------------------------------------------------
  else if (videoUrl) {
    hasLocalVideo = true;
    finalVideoUrl = resolveMediaUrl(videoUrl);

    if (thumbUrl) {
      if (
        stableThumbnailRef.current &&
        (prompt._uploadingMedia || thumbUrl.startsWith("blob:"))
      ) {
        thumbnailUrl = stableThumbnailRef.current;
      } else {
        thumbnailUrl = resolveMediaUrlWithCache(
          thumbUrl,
          prompt._uploadingMedia ? null : prompt.updated_at
        );
        stableThumbnailRef.current = thumbnailUrl;
      }
    }
  }

  // -------------------------------------------------
  // 🖼️ IMAGEM
  // -------------------------------------------------
  else if (imageUrl) {
    hasImage = true;

    if (
      stableThumbnailRef.current &&
      (prompt._uploadingMedia || imageUrl.startsWith("blob:"))
    ) {
      thumbnailUrl = stableThumbnailRef.current;
    } else {
      thumbnailUrl = resolveMediaUrlWithCache(
        imageUrl,
        prompt._uploadingMedia ? null : prompt.updated_at
      );
      stableThumbnailRef.current = thumbnailUrl;
    }
  }

  return {
    // Flags principais
    hasMedia: Boolean(hasImage || hasLocalVideo || hasYouTubeVideo),
    hasImage,
    hasLocalVideo,
    hasYouTubeVideo,

    // Dados de vídeo
    videoId,
    videoUrl: finalVideoUrl,

    // Thumbnail
    thumbnailUrl,
  };
}, [
  prompt.thumb_url,
  prompt.image_url,
  prompt.video_url,
  prompt.youtube_url,
  prompt._uploadingMedia,
]);


  const tagsArray = useMemo(() => {
    if (Array.isArray(prompt.tags)) return prompt.tags;
    if (typeof prompt.tags === 'string') {
      return prompt.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  }, [prompt.tags]);

  // 🔵 Ícones por plataforma
  const platformIcons = {
    chatgpt: "🤖",
    nanobanana: "🌙",
    gemini: "✨",
    veo3: "🎥",
    manus: "📝",
    claude: "🧠",
  };

  // 🔵 Rótulos amigáveis
  const platformLabels = {
    chatgpt: "ChatGPT",
    nanobanana: "Nano Banana",
    gemini: "Gemini",
    veo3: "VEO3",
    manus: "Manus",
    claude: "Claude",
  };

  const platformIcon = platformIcons[prompt.platform] || null;
  const platformLabel = platformLabels[prompt.platform] || null;

  // 🔵 Carregar anexos do prompt
  useEffect(() => {
    // 🔒 Evitar IDs temporários (ex: "temp-123123")
    if (!prompt.id || typeof prompt.id !== "number") {
      setLoadingAttachments(false);
      return;
    }

    async function fetchFiles() {
      try {
        const res = await api.get(`/prompts/${prompt.id}/files`);
        setAttachments(res.data?.data || []);
      } catch (err) {
        console.error("Erro ao carregar anexos:", err);
      } finally {
        setLoadingAttachments(false);
      }
    }

    fetchFiles();
  }, [prompt.id]);

  const displayAuthorName = authorName || 
                           prompt.author_name || 
                           prompt.user_name || 
                           "Usuário Desconhecido";
  
  const authorInitials = getInitials(displayAuthorName);

  // Função para abrir modal
  const openModal = (type, src = null, videoId = null) => {
    console.log("🎬 ABRINDO MODAL:", {
      type: type,
      src: src,
      videoId: videoId,
      hasVideo: mediaInfo.hasVideo,
      hasLocalVideo: mediaInfo.hasLocalVideo,
      videoUrl: mediaInfo.videoUrl
    });
    setModalState({
      isOpen: true,
      type,
      src,
      videoId,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      src: null,
      videoId: null,
    });
  };

  return (
    <>
      <div
        className={cn(
          cardVariants({ layout: "horizontal", hover: "lift" }),
          isInChat ? "border-0 shadow-none" : "",
          className
        )}
      >
        {/* CONTEÚDO */}
        <div className={contentVariants({ layout: "horizontal" })}>
          <div className="min-w-0">
            {/* CABEÇALHO */}
            {isInChat ? (
              <div className="mb-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                    {authorInitials}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1 min-w-0">
                    {prompt.title}
                  </h3>

                  {onToggleFavorite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleFavorite(prompt)}
                      className={cn(
                        "flex-shrink-0 h-8 w-8 min-w-[32px] transition-all",
                        prompt.is_favorite
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-gray-400 hover:text-amber-500"
                      )}
                    >
                      <Star
                        className={cn("h-5 w-5 transition-all", prompt.is_favorite && "fill-current")}
                      />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis line-clamp-1">
                    {prompt.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-1 w-full">
                    {/* TAG DE CATEGORIA */}
                    {prompt.category && (
                      <div className="flex items-center gap-1.5">
                        <TagIcon className="w-3.5 h-3.5 text-gray-400" />
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium"
                          style={{
                            backgroundColor: prompt.category.color ? `${prompt.category.color}15` : '#e0e7ff',
                            color: prompt.category.color || '#4f46e5',
                            borderColor: prompt.category.color ? `${prompt.category.color}30` : '#c7d2fe',
                          }}
                        >
                          {prompt.category.name}
                        </Badge>
                      </div>
                    )}

                    {/* TAG DE PLATAFORMA - APENAS ÍCONE COM TOOLTIP */}
                    {platformLabel && (
                      <div className="relative">
                        <div className="peer flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md">
                          <span className="text-base">{platformIcon}</span>
                        </div>

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-10">
                          {platformLabel}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleFavorite(prompt)}
                    className={cn(
                      "flex-shrink-0 h-8 w-8 min-w-[32px] transition-all",
                      prompt.is_favorite
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-gray-400 hover:text-amber-500"
                    )}
                  >
                    <Star
                      className={cn("h-5 w-5 transition-all", prompt.is_favorite && "fill-current")}
                    />
                  </Button>
                )}
              </div>
            )}

            {/* Descrição */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {prompt.description || prompt.content}
            </p>

            {/* Tags */}
            {tagsArray.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tagsArray.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tagsArray.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tagsArray.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-2 mt-auto">
            {onCopy && !isInChat && (
              <Button
                variant="outline"
                size="sm"
                title="Copiar conteúdo"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(prompt.content);
                    toast.success("✅ Conteúdo copiado!");
                  } catch (error) {
                    console.error("Erro ao copiar:", error);
                    toast.error("❌ Erro ao copiar conteúdo");
                  }
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}

            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                title={isOptimistic ? "Aguarde a criação do prompt" : "Editar Prompt"}
                disabled={isOptimistic}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(prompt);
                }}
                className={isOptimistic ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
         
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                title={isOptimistic ? "Aguarde a criação do prompt" : "Excluir Prompt"}
                disabled={isOptimistic}
                className={cn(
                  "text-red-600 hover:text-red-700",
                  isOptimistic && "opacity-50 cursor-not-allowed"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(prompt.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            {onShare && (
              <Button
                variant="outline"
                size="sm"
                title="Compartilhar no Chat"
                className="text-purple-600 hover:text-purple-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(prompt);
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Botões do modo Chat */}
          {isInChat && (
            <div className="flex gap-2 justify-start mt-auto pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(prompt.content);
                    toast.success("✅ Conteúdo copiado!");
                  } catch (error) {
                    console.error("Erro ao copiar:", error);
                    toast.error("❌ Erro ao copiar conteúdo");
                  }
                }}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(prompt);
                }}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Salvar
              </Button>
            </div>
          )}
        </div>

        {/* MÍDIA */}

    {/* =====================================================
    🖼️ MÍDIA — BLOCO ÚNICO, IMG SEMPRE MONTADO (ANTI-FLICKER)
===================================================== */}
<div className="relative w-full aspect-video overflow-hidden rounded-md bg-muted">

  {/* =====================================================
      🖼️ THUMBNAIL ÚNICO — NUNCA SAI DO DOM
  ===================================================== */}
  <img
    src={mediaInfo.thumbnailUrl || ""}
    alt={prompt.title}
    className={cn(
      "absolute inset-0 w-full h-full object-cover transition-opacity duration-200",
      mediaInfo.thumbnailUrl ? "opacity-100" : "opacity-0"
    )}
    draggable={false}
    loading="eager"
  />

  {/* PLACEHOLDER (NÃO REMOVE IMG) */}
  {!mediaInfo.thumbnailUrl && (
    <div className="absolute inset-0 flex items-center justify-center bg-muted">
      <ImageIcon className="h-10 w-10 text-muted-foreground" />
    </div>
  )}

  {/* =====================================================
      🎬 BADGES / ETIQUETAS (MANTIDAS)
  ===================================================== */}

  {/* BADGE YOUTUBE */}
  {mediaInfo.hasYouTubeVideo && (
    <div className="absolute top-3 right-3 z-10">
      <Badge className="bg-red-600 text-white shadow-lg">
        <Youtube className="w-3 h-3 mr-1" />
        YouTube
      </Badge>
    </div>
  )}

  {/* BADGE VÍDEO LOCAL */}
  {mediaInfo.hasLocalVideo && (
    <div className="absolute top-3 left-3 z-10">
      <Badge className="bg-purple-600 text-white shadow-lg">
        Vídeo
      </Badge>
    </div>
  )}

  {/* BADGE IMAGEM */}
  {!mediaInfo.hasLocalVideo &&
    !mediaInfo.hasYouTubeVideo &&
    mediaInfo.hasImage && (
      <div className="absolute bottom-3 left-3 z-10">
        <Badge className="bg-blue-600 text-white shadow-lg">
          Imagem
        </Badge>
      </div>
    )}

  {/* =====================================================
      ▶️ OVERLAY DE PLAY (SEM TROCAR IMG)
  ===================================================== */}
  {(mediaInfo.hasLocalVideo || mediaInfo.hasYouTubeVideo) && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 pointer-events-none">
      <Play className="h-10 w-10 text-white opacity-90" />
    </div>
  )}

  {/* =====================================================
      ⏳ OVERLAY DE UPLOAD (SEM TROCAR IMG)
  ===================================================== */}
  {prompt._uploadingMedia && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
      <span className="text-xs text-white">
        Processando mídia…
      </span>
    </div>
  )}

  {/* =====================================================
      🖱️ CLICK HANDLER ÚNICO (MANTÉM UX)
  ===================================================== */}
  <button
    type="button"
    onClick={() => {
      if (mediaInfo.hasYouTubeVideo && mediaInfo.videoId) {
        openModal("youtube", null, mediaInfo.videoId);
      } else if (mediaInfo.hasLocalVideo && mediaInfo.videoUrl) {
        openModal("video", mediaInfo.videoUrl);
      } else if (mediaInfo.hasImage && mediaInfo.thumbnailUrl) {
        openModal("image", mediaInfo.thumbnailUrl);
      }
    }}
    className="absolute inset-0 z-30"
    aria-label="Abrir mídia"
  />
</div>


        {/* Placeholder se não tem mídia */}
        {!mediaInfo.hasMedia && (
          <div className={cn(
            mediaVariants({ layout: "horizontal" }),
            "flex items-center justify-center"
          )}>
            <div className="text-center text-slate-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Sem mídia</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ÚNICO PARA TODAS AS MÍDIAS */}
      {modalState.isOpen && (
        <MediaModal
          type={modalState.type}
          src={modalState.src}
          videoId={modalState.videoId}
          title={prompt.title}
          onClose={closeModal}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.prompt.id === nextProps.prompt.id &&
    prevProps.prompt.title === nextProps.prompt.title &&
    prevProps.authorName === nextProps.authorName &&
    prevProps.prompt.is_favorite === nextProps.prompt.is_favorite &&
    prevProps.prompt.category?.id === nextProps.prompt.category?.id &&
    prevProps.prompt.image_url === nextProps.prompt.image_url &&
    prevProps.prompt.video_url === nextProps.prompt.video_url &&
    prevProps.prompt.youtube_url === nextProps.prompt.youtube_url &&
    prevProps.prompt.thumb_url === nextProps.prompt.thumb_url &&
    prevProps.prompt.tags === nextProps.prompt.tags
  );
});

PromptCard.displayName = 'PromptCard';

export default PromptCard;

export { cardVariants, mediaVariants, contentVariants };