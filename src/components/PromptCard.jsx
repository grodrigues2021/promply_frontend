// src/components/PromptCard.jsx - CORRIGIDO COM BADGE DE CATEGORIA
import React, { useMemo } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
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
   🔧 HELPER: GERAR INICIAIS DO NOME
   ========================================== */
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ==========================================
   📦 COMPONENTE PROMPT CARD (CORRIGIDO)
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
    
      // ✅ CORREÇÃO: Adicionar cache-buster (timestamp) à URL da imagem para forçar o recarregamento
 
    let imageUrlWithCacheBuster = null;
    if (hasImage && prompt.image_url) {
      if (prompt.image_url.startsWith("data:image")) {
        // Base64 — não adiciona ?v=
        imageUrlWithCacheBuster = prompt.image_url;
      } else if (prompt.updated_at) {
        // URL normal — adiciona cache-buster
        const timestamp = new Date(prompt.updated_at).getTime();
        imageUrlWithCacheBuster = `${prompt.image_url}?v=${timestamp}`;
      } else {
        imageUrlWithCacheBuster = prompt.image_url;
      }
    }

  const thumbnailUrl = youtubeThumbnail || imageUrlWithCacheBuster;

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
  }, [prompt.video_url, prompt.youtube_url, prompt.image_url, prompt.updated_at]);

  const tagsArray = useMemo(() => {
    if (Array.isArray(prompt.tags)) return prompt.tags;
    if (typeof prompt.tags === 'string') {
      return prompt.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  }, [prompt.tags]);

  const displayAuthorName = authorName || 
                           prompt.author_name || 
                           prompt.user_name || 
                           "Usuário Desconhecido";
  
  const authorInitials = getInitials(displayAuthorName);

  return (
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
          {/* ✨ CABEÇALHO */}
          {isInChat ? (
            /* 📱 VERSÃO CHAT - Com avatar e autor */
            <div className="mb-3">
              <div className="flex items-center gap-3 mb-1">
                {/* Avatar do autor */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  {authorInitials}
                </div>

                {/* Título */}
                <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1 min-w-0">
                  {prompt.title}
                </h3>

                {/* Botão Favorito */}
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
            /* 🏠 VERSÃO NORMAL - Sem avatar */
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {prompt.title}
                </h3>
                
                {/* ✅ BADGE DE CATEGORIA - ADICIONADO */}
                {prompt.category && (
                  <div className="flex items-center gap-1.5 mt-1">
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
          {/* Botão padrão (oculto no chat) */}
          {onCopy && !isInChat && (
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

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              title="Editar Prompt"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(prompt);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
       
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              title="Excluir Prompt"
              className="text-red-600 hover:text-red-700"
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
              onClick={(e) => {
                e.stopPropagation();
                onCopy?.(prompt);
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
{(prompt.video_url || prompt.youtube_url || prompt.image_url) ? (
  <div className="relative flex-shrink-0 w-full sm:w-52 h-[200px] sm:h-[230px] bg-slate-100 overflow-hidden rounded-t-xl sm:rounded-r-xl">
    
    {/* Badge YouTube */}
    {(prompt.video_url || prompt.youtube_url) && (
      <div className="absolute top-2 right-2 z-20">
        <Badge className="gap-1 text-xs shadow-md bg-red-600 text-white font-semibold px-2 py-0.5 rounded-md border border-red-700">
          YouTube
        </Badge>
      </div>
    )}

    <button
      type="button"
      onClick={() =>
        prompt.video_url || prompt.youtube_url
          ? onOpenVideo?.(prompt.video_url || prompt.youtube_url)
          : onOpenImage?.(prompt.image_url, prompt.title)
      }
      className="relative w-full h-full group/media overflow-hidden"
    >
      {(() => {
        const url = prompt.youtube_url || prompt.video_url
        const imageUrl = prompt.image_url
        const videoId = url
          ? (url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1] ?? null)
          : null
        const thumbnail = videoId
          ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          : imageUrl
        return thumbnail ? (
          <img
            src={thumbnail}
            alt={prompt.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <ImageIcon className="h-12 w-12 text-slate-400" />
          </div>
        )
      })()}

      {/* Overlay no hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="bg-white/95 p-3 rounded-full shadow-xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
          {(prompt.video_url || prompt.youtube_url) ? (
            <Play className="h-6 w-6 text-slate-800 fill-current" />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-800" />
          )}
        </div>
      </div>
    </button>
  </div>
) : (
  <div className="flex items-center justify-center bg-slate-100 w-full sm:w-52 h-[200px] sm:h-[230px] rounded-t-xl sm:rounded-r-xl text-slate-400">
    <ImageIcon className="h-12 w-12 opacity-40" />
    <p className="text-xs">Sem mídia</p>
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
    prevProps.authorName === nextProps.authorName &&
    prevProps.prompt.is_favorite === nextProps.prompt.is_favorite &&
    prevProps.prompt.category?.id === nextProps.prompt.category?.id &&
    prevProps.prompt.image_url === nextProps.prompt.image_url &&
    prevProps.prompt.video_url === nextProps.prompt.video_url &&
    prevProps.prompt.youtube_url === nextProps.prompt.youtube_url &&
    prevProps.prompt.tags === nextProps.prompt.tags
  );
});

PromptCard.displayName = 'PromptCard';

export default PromptCard;

export { cardVariants, mediaVariants, contentVariants };