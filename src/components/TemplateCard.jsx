// src/components/TemplateCard.jsx
import React, { useMemo } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import {
  Star,
  Copy,
  Edit,
  Trash2,
  Sparkles,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

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

/* ==========================================
   🔧 HELPER: EXTRAIR ID DO YOUTUBE
   ========================================== */
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

/* ==========================================
   🔧 HELPER: DETECTAR TIPO DE VÍDEO
   ========================================== */
const detectVideoType = (url) => {
  if (!url) return null;
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (url.startsWith('data:video/') || url.startsWith('blob:') || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return 'local';
  }
  
  return null;
};

/* ==========================================
   📦 COMPONENTE TEMPLATE CARD (OTIMIZADO)
   ========================================== */

const TemplateCard = React.memo(({
  prompt,
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
  const mediaInfo = useMemo(() => {
    const videoUrl = prompt.video_url || prompt.youtube_url;
    const hasImage = prompt.image_url;
    
    const videoType = detectVideoType(videoUrl);
    
    const hasYouTubeVideo = videoType === 'youtube';
    const hasLocalVideo = videoType === 'local';
    const hasVideo = hasYouTubeVideo || hasLocalVideo;
    const hasMedia = hasVideo || hasImage;
    
    const videoId = hasYouTubeVideo ? extractYouTubeId(videoUrl) : null;
    const youtubeThumbnail = videoId 
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null;
    
    // ✅ Para vídeos locais, usa a imagem do prompt como thumbnail (se houver)
    const thumbnailUrl = youtubeThumbnail || (hasImage ? prompt.image_url : null);

    return { 
      hasVideo,
      hasYouTubeVideo,
      hasLocalVideo,
      hasImage, 
      hasMedia, 
      videoUrl,
      videoId, 
      thumbnailUrl 
    };
  }, [prompt.video_url, prompt.youtube_url, prompt.image_url]);

  const tagsArray = useMemo(() => {
    if (Array.isArray(prompt.tags)) return prompt.tags;
    if (typeof prompt.tags === 'string') {
      return prompt.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  }, [prompt.tags]);

  return (
    <div className={cn(cardVariants({ layout: "horizontal", hover: "lift" }), className)}>
      {/* CONTEÚDO */}
      <div className={contentVariants({ layout: "horizontal" })}>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 min-w-0">
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

          {prompt.category && (
            <Badge
              className="mb-2"
              style={{
                backgroundColor: prompt.category.color || "#6366f1",
                color: "white",
              }}
            >
              {prompt.category.name}
            </Badge>
          )}

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {prompt.description || prompt.content}
          </p>

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

        {/* BOTÕES */}
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-md transition"
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(prompt);
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Usar Template
          </Button>

          {onCopy && (
            <Button
              variant="outline"
              size="sm"
              title="Copiar conteúdo"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(prompt);
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}

          {user?.is_admin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              title="Editar Template"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prompt);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {user?.is_admin && onDelete && (
            <Button
              variant="outline"
              size="sm"
              title="Excluir Template"
              className="text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(prompt.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* MÍDIA */}
      {mediaInfo.hasMedia && (
        <div className={cn(mediaVariants({ layout: "horizontal" }), "relative")}>
          
          {/* Badge de tipo de vídeo */}
          {mediaInfo.hasYouTubeVideo && (
            <div className="absolute top-2 right-2 z-20">
              <Badge className="gap-1 text-xs shadow-md bg-red-600 text-white font-semibold px-2 py-0.5 rounded-md border border-red-700">
                YouTube
              </Badge>
            </div>
          )}
          
          {mediaInfo.hasLocalVideo && (
            <div className="absolute top-2 right-2 z-20">
              <Badge className="gap-1 text-xs shadow-md bg-purple-600 text-white font-semibold px-2 py-0.5 rounded-md border border-purple-700">
                Vídeo
              </Badge>
            </div>
          )}

          {/* 🎬 VÍDEO LOCAL: Thumbnail clicável (NÃO player direto) */}
          {mediaInfo.hasLocalVideo && (
            <button
              type="button"
              onClick={() => onOpenVideo?.(mediaInfo.videoUrl)}
              className="relative w-full h-full group/media overflow-hidden"
            >
              {/* Thumbnail ou placeholder */}
              {mediaInfo.thumbnailUrl ? (
                <img
                  src={mediaInfo.thumbnailUrl}
                  alt={prompt.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-purple-200">
                  <Play className="h-16 w-16 text-purple-400" />
                </div>
              )}

              {/* Overlay com botão play */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/95 p-4 rounded-full shadow-2xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                  <Play className="h-8 w-8 text-purple-600 fill-current" />
                </div>
              </div>

              {/* Label "Clique para assistir" */}
              <div className="absolute bottom-3 left-0 right-0 text-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
                  Clique para assistir
                </span>
              </div>
            </button>
          )}

          {/* 🎥 YOUTUBE: Thumbnail clicável */}
          {mediaInfo.hasYouTubeVideo && (
            <button
              type="button"
              onClick={() => onOpenVideo?.(mediaInfo.videoUrl)}
              className="relative w-full h-full group/media overflow-hidden"
            >
              {mediaInfo.thumbnailUrl ? (
                <img
                  src={mediaInfo.thumbnailUrl}
                  alt={prompt.title}
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
          )}

          {/* 🖼️ IMAGEM: Apenas se não tem vídeo */}
          {!mediaInfo.hasVideo && mediaInfo.hasImage && (
            <button
              type="button"
              onClick={() => onOpenImage?.(prompt.image_url, prompt.title)}
              className="relative w-full h-full group/media overflow-hidden"
            >
              <img
                src={mediaInfo.thumbnailUrl}
                alt={prompt.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/95 p-3 rounded-full shadow-xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                  <ImageIcon className="h-6 w-6 text-slate-800" />
                </div>
              </div>
            </button>
          )}
        </div>
      )}

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
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.prompt.id === nextProps.prompt.id &&
    prevProps.prompt.title === nextProps.prompt.title &&
    prevProps.prompt.is_favorite === nextProps.prompt.is_favorite &&
    prevProps.prompt.image_url === nextProps.prompt.image_url &&
    prevProps.prompt.video_url === nextProps.prompt.video_url &&
    prevProps.prompt.youtube_url === nextProps.prompt.youtube_url &&
    prevProps.prompt.tags === nextProps.prompt.tags &&
    prevProps.user?.is_admin === nextProps.user?.is_admin
  );
});

TemplateCard.displayName = 'TemplateCard';

export default TemplateCard;

export { cardVariants, mediaVariants, contentVariants };