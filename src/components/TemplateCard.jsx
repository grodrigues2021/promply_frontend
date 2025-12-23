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
import thumbnailCache from '../lib/thumbnailCache';

// ============================================================
// 📵 PLATAFORMAS DISPONÍVEIS
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
   📦 COMPONENTE TEMPLATE CARD (COM INTERSECTION OBSERVER)
   ========================================== */

const TemplateCard = React.memo(({
  prompt,
  template: legacyTemplate,
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
  // ============================================================
  // 🔍 Normalização de dados
  // ============================================================
  const item = prompt || legacyTemplate;

  if (!item) {
    console.warn("⚠️ TemplateCard renderizado sem dados:", {
      prompt,
      legacyTemplate,
    });
    return null;
  }

  // ============================================================
  // 🆔 ID único para cache
  // ============================================================
  const templateId = item?.id || item?.prompt_id;

  // ============================================================
  // 📦 Cache persistente (recupera se já existe)
  // ============================================================
  const cachedThumbnail = thumbnailCache.get(templateId);
  
  // ============================================================
  // 🎬 Refs e estados para Intersection Observer
  // ============================================================
  const mediaContainerRef = useRef(null);
  const [localGeneratedThumb, setLocalGeneratedThumb] = useState(cachedThumbnail);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ============================================================
  // 🎬 Intersection Observer - Processa SOB DEMANDA
  // ============================================================
  useEffect(() => {
    // ✅ Se já tem thumbnail no cache, não faz nada
    if (cachedThumbnail) return;
    
    // ✅ Se tem thumb_url do backend, não precisa gerar
    if (!item?.video_url || item?.thumb_url) return;
    
    // ✅ Só para vídeos MP4 locais (não YouTube)
    if (item.video_url.includes('youtube') || item.video_url.includes('youtu.be')) return;
    
    // ✅ Se não tem ref do container, espera
    if (!mediaContainerRef.current) return;

    // ✅ INTERSECTION OBSERVER: Processa quando card entra na viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isProcessing) {
            setIsProcessing(true);
            
            // Resolve URL do vídeo
            const videoUrl = item.video_url.startsWith('http')
              ? item.video_url
              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://api.promply.app'}/storage/${item.video_url}`;
            
            // ✅ Adiciona à fila global (max 5 simultâneos)
            if (window.queueThumbnailGeneration) {
              console.log(`📄 [Observer] Enfileirando thumbnail: ${templateId}`);
              
              window.queueThumbnailGeneration(videoUrl, templateId, (success) => {
                if (success) {
                  const thumb = thumbnailCache.get(templateId);
                  if (thumb) {
                    setLocalGeneratedThumb(thumb);
                  }
                }
                setIsProcessing(false);
              });
            }
            
            // Desconecta observer após processar
            observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin: '200px', // Começa a processar 200px antes de aparecer
        threshold: 0.01
      }
    );

    observer.observe(mediaContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [item?.video_url, item?.thumb_url, templateId, cachedThumbnail, isProcessing]);

  // ============================================================
  // 🆕 CORREÇÃO: CACHE AUTOMÁTICO - Salva thumb_url do backend
  // ============================================================
  useEffect(() => {
    // ✅ Se o backend enviou thumb_url e não está no cache
    if (item?.thumb_url && !cachedThumbnail && templateId) {
      console.log(`💾 [Cache] Salvando thumb_url do backend para ID ${templateId}`);
      
      // Salva no IndexedDB para persistir entre sessões
      thumbnailCache.set(templateId, item.thumb_url);
      
      // Atualiza estado local para forçar re-render
      setLocalGeneratedThumb(item.thumb_url);
    }
  }, [item?.thumb_url, templateId, cachedThumbnail]);

  // ============================================================
  // 🖼️ Media Info com cache persistente
  // ============================================================
  const mediaInfo = useMemo(() => {
    // ============================================================
    // 🎬 DETECÇÃO DE VÍDEO
    // ============================================================
    const videoUrl = item?.video_url || item?.youtube_url;
    const videoType = detectVideoType(videoUrl);

    const hasYouTubeVideo = videoType === "youtube";
    const hasLocalVideo = videoType === "local";
    const hasVideo = hasYouTubeVideo || hasLocalVideo;

    // ============================================================
    // ▶️ YOUTUBE
    // ============================================================
    const videoId = hasYouTubeVideo ? extractYouTubeId(videoUrl) : null;
    const youtubeThumbnail = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;

    // ============================================================
    // 🖼️ DEFINIÇÃO ÚNICA DE THUMBNAIL (DESKTOP + MOBILE)
    // ============================================================
    let thumbnailUrl = null;

    if (hasVideo) {
      /**
       * PRIORIDADE COM CACHE PERSISTENTE:
       *
       * 1. cachedThumbnail → cache em memória (persiste entre navegações)
       * 2. thumb_url → backend (fonte única da verdade)
       * 3. image_url → thumbnail capturado no upload
       * 4. youtubeThumbnail → fallback YouTube
       * 5. localGeneratedThumb → último fallback client-side
       */
      thumbnailUrl =
        cachedThumbnail ||
        item?.thumb_url ||
        item?.image_url ||
        youtubeThumbnail ||
        localGeneratedThumb;

      // ✅ Se encontrou thumbnail válido, salvar no cache
      if (thumbnailUrl && !cachedThumbnail) {
        thumbnailCache.set(templateId, thumbnailUrl);
      }
    } else {
      /**
       * IMAGEM SIMPLES
       */
      thumbnailUrl = item?.image_url;

      // Cache também para imagens simples
      if (thumbnailUrl && !cachedThumbnail) {
        thumbnailCache.set(templateId, thumbnailUrl);
      }
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
    localGeneratedThumb,
    cachedThumbnail,
    templateId,
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
            {item?.description?.trim()
              ? item.description
              : item?.content}
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

          {/* Editar – somente admin */}
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

          {/* Excluir – somente admin */}
          {user?.is_admin && typeof onDelete === "function" && (
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
        <div 
          ref={mediaContainerRef}
          className={cn(mediaVariants({ layout: "horizontal" }), "relative")}
        >
          
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
                {/* Thumbnail definitiva – persiste entre navegações */}
                {mediaInfo.thumbnailUrl ? (
                  <img
                    src={
                      mediaInfo.thumbnailUrl.startsWith("http")
                        ? mediaInfo.thumbnailUrl
                        : resolveMediaUrl(mediaInfo.thumbnailUrl)
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : isProcessing ? (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-purple-200">
                    <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-2"></div>
                    <span className="text-xs text-purple-600 font-medium">Gerando thumbnail...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-purple-200">
                    <Play className="h-16 w-16 text-purple-400" />
                  </div>
                )}

                {/* Overlay de hover */}
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