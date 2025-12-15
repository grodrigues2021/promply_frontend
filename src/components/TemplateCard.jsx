// src/components/TemplateCard.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import {
  Heart,
  Copy,
  Edit,
  Trash2,
  Sparkles,
  Play,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";
import { resolveMediaUrl, extractYouTubeId, detectVideoType } from '../lib/media';

// ============================================================
// 🔵 PLATAFORMAS DISPONÍVEIS
// ============================================================
const PLATFORMS = {
  chatgpt: { label: "ChatGPT", icon: "🤖", color: "#10a37f" },
  claude: { label: "Claude", icon: "🧠", color: "#6366f1" },
  gemini: { label: "Gemini", icon: "✨", color: "#8e44ad" },
  copilot: { label: "Copilot", icon: "🔷", color: "#0078d4" },
  perplexity: { label: "Perplexity", icon: "🔍", color: "#1fb6ff" },
  midjourney: { label: "Midjourney", icon: "🎨", color: "#ff6b6b" },
  "dall-e": { label: "DALL-E", icon: "🖼️", color: "#ff9500" },
  other: { label: "Outro", icon: "⚡", color: "#64748b" },
};

const cardVariants = cva(
  "group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] border-[2px] border-transparent hover:border-indigo-500",
  {
    variants: {
      layout: {
        vertical: "flex flex-col",
        horizontal: "flex flex-col sm:flex-row items-stretch",
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


/* ==========================================
   📦 COMPONENTE TEMPLATE CARD (OTIMIZADO)
   ========================================== */

const TemplateCard = React.memo(({
  prompt,
  template,
  user,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onShare,
  onOpenImage,
  onOpenVideo,
  className,
}) => {
  const item = template;

// ============================================================
// 🎬 Thumbnail client-side para vídeo MP4 (quando não existe)
// ============================================================
const videoRef = useRef(null);
const canvasRef = useRef(null);
const [generatedThumb, setGeneratedThumb] = useState(null);

useEffect(() => {
  if (!item?.video_url || item?.thumb_url) return;

  const video = document.createElement("video");
  video.src = resolveMediaUrl(item.video_url);
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  const captureFrame = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // Evita thumbnail preta
      if (dataUrl && dataUrl !== "data:,") {
        setGeneratedThumb(dataUrl);
      }
    } catch (err) {
      console.warn("❌ Falha ao gerar thumbnail do vídeo:", err);
    }
  };

  const handleLoadedMetadata = () => {
    // captura em ~10% do vídeo ou 0.5s
    const safeTime = Math.min(
      Math.max(video.duration * 0.1, 0.5),
      video.duration - 0.1
    );
    video.currentTime = safeTime;
  };

  video.addEventListener("loadedmetadata", handleLoadedMetadata);
  video.addEventListener("seeked", captureFrame, { once: true });

  return () => {
    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    video.removeEventListener("seeked", captureFrame);
  };
}, [item?.video_url, item?.thumb_url]);



  // Estado para gerenciar erros de carregamento de imagem
  const [imageError, setImageError] = useState(false);

  // ============================================================
  // 🎯 LÓGICA UNIFICADA DE MÍDIA
  // ============================================================
  const mediaInfo = useMemo(() => {
    // Detectar tipo de vídeo
    const videoUrl = item?.video_url || item?.youtube_url;
    const videoType = detectVideoType(videoUrl);
    
    const hasYouTubeVideo = videoType === 'youtube';
    const hasLocalVideo = videoType === 'local';
    const hasVideo = hasYouTubeVideo || hasLocalVideo;
    
    // Gerar thumbnail do YouTube se aplicável
    const videoId = hasYouTubeVideo ? extractYouTubeId(videoUrl) : null;
    const youtubeThumbnail = videoId 
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
    
    // Determinar URL da thumbnail/imagem
    // Prioridade: thumb_url > image_url > youtubeThumbnail
    let thumbnailUrl = null;
    if (hasVideo) {
  // Prioridade:
  // 1. thumb_url (se existir)
  // 2. thumbnail do YouTube
  // 3. thumbnail gerado client-side (MP4)
  thumbnailUrl =
    item?.thumb_url ||
    youtubeThumbnail ||
    generatedThumb;
}
 else {
      // Para imagens: usar image_url diretamente
      thumbnailUrl = item?.image_url;
    }
    
    const hasImage = !!thumbnailUrl;
    const hasMedia = hasVideo || hasImage;
    
    return { 
      hasVideo,
      hasYouTubeVideo,
      hasLocalVideo,
      hasImage, 
      hasMedia, 
      videoUrl,
      videoId, 
      thumbnailUrl,
      youtubeThumbnail,
    };
  }, [
    item?.video_url,
    item?.youtube_url,
    item?.image_url,
    item?.thumb_url,
    generatedThumb
  ]);

  // Tags processadas
  const tagsArray = useMemo(() => {
    const rawTags = item?.tags || item?.prompt?.tags || prompt?.tags || [];

    if (Array.isArray(rawTags)) return rawTags;
    if (typeof rawTags === "string") {
      if (rawTags.startsWith('[')) {
        try {
          const parsed = JSON.parse(rawTags);
          return parsed;
        } catch {
          return rawTags.split(",").map(t => t.trim()).filter(Boolean);
        }
      }
      return rawTags.split(",").map(t => t.trim()).filter(Boolean);
    }

    return [];
  }, [item, prompt]);

  // Informações da plataforma
  const platformInfo = useMemo(() => {
    const platformKey = item?.platform;
    if (!platformKey) return null;
    return PLATFORMS[platformKey] || null;
  }, [item?.platform]);

  // Contadores
  const favoritesCount = item?.favorites_count || 0;
  const usageCount = item?.usage_count || 0;

  return (
    <div className={cn(cardVariants({ layout: "horizontal", hover: "lift" }), className)}>
      {/* CONTEÚDO À ESQUERDA */}
      <div className={cn(contentVariants({ layout: "horizontal" }))}>
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                {item?.title}
              </h3>
              
              {/* Container para categoria e plataforma */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Categoria discreta */}
                {item?.category && (
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      backgroundColor: `${item.category.color}15`,
                      color: item.category.color || "#6366f1",
                      border: `1px solid ${item.category.color}30`
                    }}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.category.color || "#6366f1" }}
                    />
                    <span>{item.category.name}</span>
                  </div>
                )}

                {/* Badge de plataforma */}
                {platformInfo && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-help"
                          style={{
                            backgroundColor: `${platformInfo.color}15`,
                            color: platformInfo.color,
                            border: `1px solid ${platformInfo.color}30`
                          }}
                        >
                          <span className="text-xs">{platformInfo.icon}</span>
                          <span>{platformInfo.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                      >
                        Plataforma: {platformInfo.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* ❤️ FAVORITOS + 📈 USOS */}
            <div className="flex items-center gap-2">
              {/* 📈 INDICADOR DE USOS */}
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-medium min-w-[12px]">
                        {usageCount >= 1000 
                          ? `${(usageCount / 1000).toFixed(1)}k` 
                          : usageCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                  >
                    {usageCount} {usageCount === 1 ? 'uso' : 'usos'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* ❤️ BOTÃO FAVORITO */}
              {onToggleFavorite && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200",
                          item?.is_favorite
                            ? "bg-red-50 text-red-500 hover:bg-red-100"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400"
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-all",
                            item?.is_favorite && "fill-current"
                          )}
                        />
                        <span 
                          className={cn(
                            "text-xs font-medium min-w-[12px]",
                            item?.is_favorite ? "text-red-500" : "text-gray-500"
                          )}
                        >
                          {favoritesCount}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-gray-900 text-white text-xs px-2 py-1 rounded"
                    >
                      {item?.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {item?.description || item?.content}
          </p>
        </div>

        {tagsArray.length > 0 && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex gap-2 mb-3 mt-auto cursor-pointer">
                  {/* TAGS VISÍVEIS (ATÉ 3) */}
                  {tagsArray.slice(0, 3).map((tag, index) => (
                    <div
                      key={index}
                      className="text-xs px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-700 border border-purple-300/50 shadow-sm max-w-[80px] truncate"
                    >
                      {tag}
                    </div>
                  ))}

                  {/* +N (somente se houver mais de 3 tags) */}
                  {tagsArray.length > 3 && (
                    <div className="text-xs px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-700 border border-purple-300/50 shadow-sm">
                      +{tagsArray.length - 3}
                    </div>
                  )}
                </div>
              </TooltipTrigger>

              {/* TOOLTIP COM TODAS AS TAGS */}
              <TooltipContent
                side="top"
                align="center"
                sideOffset={8}
                className="rounded-2xl bg-purple-100/80 border border-purple-300/50 backdrop-blur-md shadow-xl p-3 max-w-[260px] animate-in fade-in zoom-in-95"
              >
                <div className="flex flex-wrap gap-2">
                  {tagsArray.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-purple-200/70 text-purple-700 border border-purple-300/40 backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="flex items-center gap-2 pt-3">
          {/* Usar Template */}
          <Button
            size="sm"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md transition"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(item);
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Salvar Template
          </Button>

          {/* Copiar */}
          {onCopy && (
            <Button
              variant="outline"
              size="sm"
              title="Copiar conteúdo"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(item);
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}

          {/* Editar — somente admin */}
          {user?.is_admin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              title="Editar Template"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {/* Excluir — somente admin */}
          {user?.is_admin && onDelete && (
            <Button
              variant="outline"
              size="sm"
              title="Excluir Template"
              className="text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item?.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* MÍDIA À DIREITA */}
      {mediaInfo.hasMedia ? (
        <div className={cn(mediaVariants({ layout: "horizontal" }), "relative")}>
          
          {/* 🎬 VÍDEO LOCAL */}
          {mediaInfo.hasLocalVideo && (
            <>
              {/* Badge de tipo */}
              <div className="absolute top-2 right-2 z-20">
                <Badge className="gap-1 text-xs shadow-md bg-purple-600 text-white font-semibold px-2 py-0.5 rounded-md border border-purple-700">
                  Vídeo
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => onOpenVideo?.(mediaInfo.videoUrl)}
                className="relative w-full h-full group/media overflow-hidden"
              >
                {mediaInfo.thumbnailUrl ? (
                  <img
                    src={
                      mediaInfo.thumbnailUrl?.startsWith("http")
                        ? mediaInfo.thumbnailUrl
                        : resolveMediaUrl(mediaInfo.thumbnailUrl)
                    }
                    alt={item?.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                    loading="lazy"
                  />


                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-purple-200">
                    <Play className="h-16 w-16 text-purple-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/95 p-4 rounded-full shadow-2xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                    <Play className="h-8 w-8 text-purple-600 fill-current" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-0 right-0 text-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                  <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
                    Clique para assistir
                  </span>
                </div>
              </button>
            </>
          )}

          {/* 🎥 YOUTUBE */}
          {mediaInfo.hasYouTubeVideo && (
            <>
              {/* Badge de tipo */}
              <div className="absolute top-2 right-2 z-20">
                <Badge className="gap-1 text-xs shadow-md bg-red-600 text-white font-semibold px-2 py-0.5 rounded-md border border-red-700">
                  YouTube
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => onOpenVideo?.(mediaInfo.videoUrl)}
                className="relative w-full h-full group/media overflow-hidden"
              >
                {mediaInfo.thumbnailUrl ? (
                  <img
                    src={mediaInfo.thumbnailUrl}
                    alt={item?.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Play className="h-12 w-12 text-slate-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/95 p-3 rounded-full shadow-xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                    <Play className="h-6 w-6 text-slate-800 fill-current" />
                  </div>
                </div>
              </button>
            </>
          )}

          {/* 🖼️ IMAGEM SIMPLES */}
          {!mediaInfo.hasVideo && mediaInfo.hasImage && (
            <>
              {/* Badge de tipo */}
              <div className="absolute top-2 right-2 z-20">
                <Badge className="bg-blue-600 text-white border-0 shadow-md gap-1 px-2 py-0.5 rounded-md text-xs font-semibold">
                  <ImageIcon className="w-3 h-3" />
                  Imagem
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => onOpenImage?.(mediaInfo.thumbnailUrl, item?.title)}
                className="relative w-full h-full group/media overflow-hidden"
              >
                {!imageError ? (
                  <img
                      src={
                        mediaInfo.thumbnailUrl?.startsWith("http")
                          ? mediaInfo.thumbnailUrl
                          : resolveMediaUrl(mediaInfo.thumbnailUrl)
                      }
                      alt={item?.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                      loading="lazy"
                      onError={() => setImageError(true)}
                    />

                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-100 to-blue-200">
                    <ImageIcon className="h-12 w-12 text-blue-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/95 p-3 rounded-full shadow-xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                    <ImageIcon className="h-6 w-6 text-slate-800" />
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      ) : (
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
  );
});

TemplateCard.displayName = 'TemplateCard';

export default TemplateCard;
export { cardVariants, mediaVariants, contentVariants };