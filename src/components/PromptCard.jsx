// src/components/PromptCard.jsx
import { cva } from "class-variance-authority"
import { cn } from "../lib/utils"
import { Star, Copy, Edit, Trash2, Share2, Play, Image as ImageIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

/* ==========================================
   🎨 VARIANTES COM CVA - RESPONSIVAS
   ========================================== */

const cardVariants = cva(
  "group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] border-[2px] border-transparent hover:border-blue-500",
  {
    variants: {
      layout: {
        vertical: "flex flex-col",
        horizontal: "flex flex-col sm:flex-row items-stretch flex-wrap sm:flex-nowrap",



      },
      hover: {
        none: "",
        lift: "hover:shadow-xl hover:-translate-y-1",
        glow: "hover:shadow-2xl hover:shadow-blue-200/50",
      },
    },
    defaultVariants: {
      layout: "horizontal",
      hover: "lift",
    },
  }
)

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
)

const contentVariants = cva(
  "flex flex-col justify-between p-4 min-w-0",
  {
    variants: {
      layout: {
        vertical: "flex-1",
        horizontal: "flex-1 h-auto sm:h-[230px] min-w-0 overflow-visible sm:overflow-hidden",


      },
    },
  }
)

/* ==========================================
   📦 COMPONENTE PROMPT CARD
   ========================================== */

export default function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onShare,
  onOpenImage,
  onOpenVideo,
  className,
}) {
  // Detectar se tem mídia
  const hasVideo = prompt.video_url || prompt.youtube_url
  const hasImage = prompt.image_url
  const hasMedia = hasVideo || hasImage

  // Extrair ID do YouTube
  const extractYouTubeId = (url) => {
    if (!url) return null
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) return match[1]
    }
    return null
  }

  const videoId = hasVideo ? extractYouTubeId(hasVideo) : null
  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : hasImage

  // Tags array
  const tagsArray = Array.isArray(prompt.tags)
    ? prompt.tags
    : typeof prompt.tags === 'string'
    ? prompt.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  return (
    <div
      className={cn(
        cardVariants({ layout: "horizontal", hover: "lift" }),
        className
      )}
    >
      {/* CONTEÚDO */}
      <div className={contentVariants({ layout: "horizontal" })}>
        
        {/* Header: Título + Favorito */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 flex-1 min-w-0">
              {prompt.title}
            </h3>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite?.(prompt)}
              className={cn(
                "flex-shrink-0 h-8 w-8 min-w-[32px] transition-all",
                prompt.is_favorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-slate-400 hover:text-amber-500"
              )}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-all",
                  prompt.is_favorite && "fill-current"
                )}
              />
            </Button>
          </div>

          {/* Categoria */}
          {prompt.category && (
            <Badge
              className="mb-2"
              style={{
                backgroundColor: prompt.category.color || '#3B82F6',
                color: 'white'
              }}
            >
              {prompt.category.name}
            </Badge>
          )}

          {/* Descrição */}
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
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

        {/* AÇÕES - BOTÕES FIXOS 40x40px, FLEX */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Botão 1: Compartilhar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onShare?.(prompt)
            }}
  className="
    flex items-center justify-center h-10 w-10 rounded-lg
    border border-slate-300 bg-white text-slate-500
    hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-600
    shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200
  "

            title="Compartilhar"
          >
            <Share2 className="h-4 w-4 text-slate-600" />
          </button>

          {/* Botão 2: Copiar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCopy?.(prompt)
            }}
  className="
    flex items-center justify-center h-10 w-10 rounded-lg
    border border-slate-300 bg-white text-slate-500
    hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-600
    shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200
  "            title="Copiar"
          >
            <Copy className="h-4 w-4 text-slate-600" />
          </button>

          {/* Botão 3: Editar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(prompt)
            }}
  className="
    flex items-center justify-center h-10 w-10 rounded-lg
    border border-slate-300 bg-white text-slate-500
    hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-600
    shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200
  "            title="Editar"
          >
            <Edit className="h-4 w-4 text-slate-600" />
          </button>

          {/* Botão 4: Deletar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(prompt.id)
            }}
  className="
    flex items-center justify-center h-10 w-10 rounded-lg
    border border-slate-300 bg-white text-slate-500
    hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-600
    shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200
  "            title="Deletar"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* MÍDIA */}
      {hasMedia && (
        <div className={cn(mediaVariants({ layout: "horizontal" }), "relative")}>
          
          {/* Badge YouTube */}
          {hasVideo && (
  <div className="absolute top-2 right-2 z-20">
    <Badge
      className="gap-1 text-xs shadow-md bg-red-600 text-white font-semibold px-2 py-0.5 rounded-md border border-red-700"
    >
      
      YouTube
    </Badge>
  </div>
)}

          {/* Imagem/Vídeo */}
          <button
            type="button"
            onClick={() => hasVideo ? onOpenVideo?.(hasVideo) : onOpenImage?.(prompt.image_url, prompt.title)}
            className="relative w-full h-full group/media overflow-hidden"
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={prompt.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-110"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <ImageIcon className="h-12 w-12 text-slate-400" />
              </div>
            )}

            {/* Overlay no hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/95 p-3 rounded-full shadow-xl transform scale-90 group-hover/media:scale-100 transition-transform duration-300">
                {hasVideo ? (
                  <Play className="h-6 w-6 text-slate-800 fill-current" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-800" />
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Placeholder se não tem mídia */}
      {!hasMedia && (
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
  )
}

/* ==========================================
   🎯 EXPORT DE VARIANTES (para reuso)
   ========================================== */

export { cardVariants, mediaVariants, contentVariants }