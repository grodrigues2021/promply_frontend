// src/components/PromptCard.jsx - COM BADGE E THUMBNAIL CORRETO
import React, { useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import {
  Star,
  Copy,        // ✅ Necessário para copiar link
  Edit,
  Trash2,
  Play,
  Image as ImageIcon,
  Share2,
  PlusCircle,
  Tag as TagIcon,
  X,
  Youtube,
  Download,    // ✅ Necessário para download
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

// --- 🔧 Video helpers ---
const detectVideoType = (url) => {
  if (!url) return null;
  const normalized = url.toLowerCase().trim();

  if (
    normalized.includes("youtube.com/watch") ||
    normalized.includes("youtube.com/embed/") ||
    normalized.includes("youtu.be/")
  ) {
    return "youtube";
  }

  if (
    normalized.startsWith("data:video/") ||
    normalized.startsWith("blob:") ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(normalized)
  ) {
    return "local";
  }

  return null;
};

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

// --- 🎬 MODAL SIMPLES E NATIVO (botão dentro) ---
// --- 🎬 MODAL COMPLETO COM BOTÕES DE DOWNLOAD E COPIAR ---
const MediaModal = ({ type, src, videoId, title, onClose }) => {
  if (!type) return null;

  // 📥 Função para baixar imagem
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title || 'imagem'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.toast?.success('✅ Download iniciado!');
  };

  // 📥 Função para baixar vídeo
  const downloadVideo = async () => {
    try {
      window.toast?.info('⏳ Preparando download...');
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      window.toast?.success('✅ Download concluído!');
    } catch (error) {
      console.error('Erro ao baixar vídeo:', error);
      window.toast?.error('❌ Erro ao baixar. Tentando abrir em nova aba...');
      window.open(src, '_blank');
    }
  };

  // 🔗 Função para copiar link do YouTube
  const copyYouTubeLink = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(youtubeUrl);
    window.toast?.success('🔗 Link copiado! Cole em um downloader de YouTube.');
  };

  // 🎬 Função para abrir no YouTube
  const openInYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Conteúdo */}
      <div className="relative max-w-5xl w-full bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header com título e botões */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <h3 className="text-white font-semibold truncate flex-1 mr-4">
            {title || 'Mídia'}
          </h3>
          
          <div className="flex items-center gap-2">
            {/* 🖼️ IMAGEM - Botão Download */}
            {type === 'image' && (
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-lg hover:shadow-xl"
                title="Baixar imagem"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
            )}

            {/* 🎬 VÍDEO MP4 - Botão Download */}
            {type === 'video' && (
              <button
                onClick={downloadVideo}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium shadow-lg hover:shadow-xl"
                title="Baixar vídeo"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
            )}

            {/* 📺 YOUTUBE - Botões Copiar Link e Abrir */}
            {type === 'youtube' && videoId && (
              <>
                <button
                  onClick={copyYouTubeLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-lg hover:shadow-xl"
                  title="Copiar link do vídeo"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copiar Link</span>
                </button>
                
                <button
                  onClick={openInYouTube}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-lg hover:shadow-xl"
                  title="Abrir no YouTube"
                >
                  <Youtube className="w-4 h-4" />
                  <span className="hidden sm:inline">Abrir</span>
                </button>
              </>
            )}

            {/* ❌ Botão fechar */}
            <button
              onClick={onClose}
              className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mídia */}
        <div className="bg-black">
          {type === 'image' && (
            <img
              src={src}
              alt={title}
              className="w-full h-auto max-h-[75vh] object-contain"
            />
          )}

          {type === 'video' && (
            <video
              src={src}
              controls
              autoPlay
              className="w-full h-auto max-h-[75vh]"
            />
          )}

          {type === 'youtube' && videoId && (
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
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

      {/* Clique fora para fechar */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

/* ========================================== */
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
  // Estado do modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    src: null,
    videoId: null,
  });

  const mediaInfo = useMemo(() => {
    const videoUrl = prompt.video_url || prompt.youtube_url;
    const hasImage = prompt.image_url;
    
    const videoType = detectVideoType(videoUrl);
    
    const hasYouTubeVideo = videoType === 'youtube';
    const hasLocalVideo = videoType === 'local';
    const hasVideo = hasYouTubeVideo || hasLocalVideo;
    const hasMedia = hasVideo || hasImage;
    
    const videoId = hasYouTubeVideo ? extractYouTubeId(videoUrl) : null;
    
    // ✅ Usar hqdefault (sempre existe) ao invés de maxresdefault
    const youtubeThumbnail = videoId 
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
    
    let imageUrlWithCacheBuster = null;
    if (hasImage && prompt.image_url) {
      if (prompt.image_url.startsWith("data:image")) {
        imageUrlWithCacheBuster = prompt.image_url;
      } else if (prompt.updated_at) {
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

  // Função para abrir modal
  const openModal = (type, src = null, videoId = null) => {
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
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {prompt.title}
                  </h3>
                  
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
        {mediaInfo.hasMedia && (
          <div className={cn(mediaVariants({ layout: "horizontal" }), "relative")}>
            
            {/* ✅ BADGE "YOUTUBE" no canto superior direito */}
            {mediaInfo.hasYouTubeVideo && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-red-600 text-white border-0 shadow-lg">
                  <Youtube className="w-3 h-3 mr-1" />
                  YouTube
                </Badge>
              </div>
            )}
            {/* 🎬 NOVA: BADGE "VÍDEO" para vídeos locais (MP4) */}
            {mediaInfo.hasLocalVideo && !mediaInfo.hasYouTubeVideo && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-pink-600 text-white border-0 shadow-lg">
                  <Play className="w-3 h-3 mr-1" />
                  Vídeo
                </Badge>
              </div>
            )}

            {/* 🖼️ NOVA: BADGE "IMAGEM" quando só tem imagem (sem vídeo) */}
                {!mediaInfo.hasVideo && mediaInfo.hasImage && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-blue-600 text-white border-0 shadow-lg">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      Imagem
                    </Badge>
                  </div>
                )}


            {/* YOUTUBE - Apenas thumbnail clicável */}
            {mediaInfo.hasYouTubeVideo && mediaInfo.videoId && (
              <button
                type="button"
                onClick={() => openModal('youtube', null, mediaInfo.videoId)}
                className="relative w-full h-full group/media overflow-hidden"
              >
                <img
                  src={mediaInfo.thumbnailUrl}
                  alt={prompt.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback para mqdefault se hqdefault falhar
                    e.target.src = `https://img.youtube.com/vi/${mediaInfo.videoId}/mqdefault.jpg`;
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="bg-white/95 p-4 rounded-full shadow-2xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                    <Play className="h-8 w-8 text-red-600 fill-current" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-0 right-0 text-center opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                  <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
                    Clique para assistir
                  </span>
                </div>
              </button>
            )}

            {/* VÍDEO LOCAL - Apenas thumbnail clicável */}
            {mediaInfo.hasLocalVideo && !mediaInfo.hasYouTubeVideo && (
              <button
                type="button"
                onClick={() => openModal('video', mediaInfo.videoUrl)}
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
            )}

            {/* IMAGEM - Apenas thumbnail clicável */}
            {!mediaInfo.hasVideo && mediaInfo.hasImage && (
              <button
                type="button"
                onClick={() => openModal('image', prompt.image_url)}
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
    prevProps.prompt.tags === nextProps.prompt.tags
  );
});

PromptCard.displayName = 'PromptCard';

export default PromptCard;

export { cardVariants, mediaVariants, contentVariants };