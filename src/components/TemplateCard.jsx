// src/components/TemplateCard.jsx
import React, { useMemo } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { ImageIcon, Play } from "lucide-react";

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
   📦 COMPONENTE TEMPLATE CARD (OTIMIZADO)
   ========================================== */

const TemplateCard = React.memo(({
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

const mediaInfo = useMemo(() => {
  const imageUrl = template?.image_url || null;
  const videoUrl = template?.video_url || null;
  const thumbUrl = template?.thumb_url || null;

  // Detectar YouTube pelo video_url
  const isYouTube = videoUrl && extractYouTubeId(videoUrl);
  const youtubeUrl = isYouTube ? videoUrl : null;

  // Detectar mp4 (vídeo local/backblaze)
  const isMp4 = videoUrl && !isYouTube;

  // Thumbnail do YouTube
  let youtubeThumbnail = null;
  if (isYouTube) {
    const id = extractYouTubeId(videoUrl);
    youtubeThumbnail = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }

  // PRIORIDADE DA THUMBNAIL:
  // 1. thumb_url (mp4)
  // 2. youtube thumbnail
  // 3. image_url (imagem)
  const thumbnailUrl =
    thumbUrl ||
    youtubeThumbnail ||
    imageUrl ||
    null;

  return {
    hasMedia: Boolean(imageUrl || videoUrl),
    hasImage: Boolean(imageUrl),
    hasVideoMp4: Boolean(isMp4),
    hasYouTube: Boolean(isYouTube),

    imageUrl,
    videoUrl,
    youtubeUrl,
    thumbnailUrl,
    isYouTube,
    isMp4,
  };
}, [
  template?.image_url,
  template?.video_url,
  template?.thumb_url
]);



  const tagsArray = useMemo(() => {
  if (Array.isArray(template?.tags)) return template.tags;
  if (typeof template?.tags === 'string') {
    return template.tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}, [template?.tags]);


  return (
    <div
  className={cn(
    cardVariants({ layout: "horizontal", hover: "none" }),
    "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-300",
    className
  )}
>

{/* CONTEÚDO */}
<div className={cn(contentVariants({ layout: "horizontal" }), "py-3 pr-4")}>
  <div className="min-w-0 flex flex-col gap-2">

    {/* TÍTULO */}
    <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
      {template.title}
    </h3>

    {/* CATEGORIA */}
    {template.category && (
      <Badge
        className="w-fit px-2 py-[2px] rounded-md text-xs mb-1"
        style={{
          backgroundColor: template.category.color || "#6366f1",
          color: "white",
        }}
      >
        {template.category.name}
      </Badge>
    )}

    {/* DESCRIÇÃO */}
    <p className="text-sm text-gray-500 leading-snug line-clamp-2">
      {template.description || template.content}
    </p>

    {/* TAGS */}
    {tagsArray.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1">
        {tagsArray.slice(0, 3).map((tag, idx) => (
          <Badge
            key={idx}
            variant="secondary"
            className="text-xs bg-slate-100 text-slate-700 border border-slate-200"
          >
            {tag}
          </Badge>
        ))}

        {tagsArray.length > 3 && (
          <Badge className="text-xs bg-slate-50 border border-slate-200 text-slate-600">
            +{tagsArray.length - 3}
          </Badge>
        )}
      </div>
    )}

    {/* BOTÕES */}
    <div className="flex items-center gap-1.5 mt-auto pt-2">

      {/* BOTÃO PRINCIPAL – USAR */}
      <Button
        size="sm"
        className="flex-1 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          onShare?.(template);
        }}
      >
        Usar Template
      </Button>

      {/* BOTÃO COPIAR */}
      {onCopy && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          title="Copiar conteúdo"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(template);
          }}
        >
          Copiar
        </Button>
      )}

      {/* BOTÃO EDITAR */}
      {user?.is_admin && onEdit && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          title="Editar Template"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(template);
          }}
        >
          Editar
        </Button>
      )}

      {/* BOTÃO EXCLUIR */}
      {user?.is_admin && onDelete && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-red-600 hover:text-red-700"
          title="Excluir Template"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(template.id);
          }}
        >
          Excluir
        </Button>
      )}
    </div>

  </div>
</div>



   {/* ============================ */}
{/*        SEÇÃO DE MÍDIA         */}
{/* ============================ */}
<div
  className={cn(
    mediaVariants({ layout: "horizontal" }),
    "relative group/media sm:rounded-r-xl rounded-t-xl overflow-hidden"
  )}
>

  {/* === Placeholder refinado === */}
  {!mediaInfo.hasMedia && (
    <div className="flex items-center justify-center w-full h-full bg-slate-100">
      <ImageIcon className="h-8 w-8 text-slate-400 opacity-50" />
    </div>
  )}

  {/* ========================= YOUTUBE ========================= */}
  {mediaInfo.hasYouTube && (
    <button
      type="button"
      onClick={() => onOpenVideo?.(mediaInfo.youtubeUrl)}
      className="w-full h-full overflow-hidden relative rounded-t-xl sm:rounded-r-xl sm:rounded-l-none"
    >
      <img
        src={mediaInfo.thumbnailUrl}
        alt={template.title}
        className="w-full h-full object-cover transition-all duration-500 group-hover/media:scale-110"
      />

      {/* Badge */}
      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-red-600 text-white border border-red-700 shadow-md">
          YouTube
        </Badge>
      </div>

      {/* Overlay Play */}
      <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/50 transition-colors duration-300 flex items-center justify-center">
        <div className="bg-white p-4 rounded-full shadow-2xl opacity-0 group-hover/media:opacity-100 transition-all transform scale-90 group-hover/media:scale-105">
          <Play className="h-8 w-8 text-red-600 fill-current" />
        </div>
      </div>
    </button>
  )}

  {/* ======================== VÍDEO MP4 ======================== */}
  {mediaInfo.hasVideoMp4 && (
    <button
      type="button"
      onClick={() => onOpenVideo?.(mediaInfo.videoUrl)}
      className="w-full h-full overflow-hidden relative rounded-t-xl sm:rounded-r-xl sm:rounded-l-none"
    >
      <img
        src={mediaInfo.thumbnailUrl}
        alt={template.title}
        loading="lazy"
        className="w-full h-full object-cover transition-all duration-500 group-hover/media:scale-110"
      />

      {/* Badge */}
      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-purple-600 text-white border border-purple-700 shadow-md">
          Vídeo
        </Badge>
      </div>

      {/* Overlay Play */}
      <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/50 transition-colors duration-300 flex items-center justify-center">
        <div className="bg-white p-4 rounded-full shadow-2xl opacity-0 group-hover/media:opacity-100 transition-all transform scale-90 group-hover/media:scale-105">
          <Play className="h-8 w-8 text-purple-600 fill-current" />
        </div>
      </div>
    </button>
  )}

  {/* ======================== IMAGEM ======================== */}
  {!mediaInfo.hasYouTube && !mediaInfo.hasVideoMp4 && mediaInfo.hasImage && (
    <button
      type="button"
      onClick={() => onOpenImage?.(mediaInfo.imageUrl, template.title)}
      className="w-full h-full overflow-hidden relative rounded-t-xl sm:rounded-r-xl sm:rounded-l-none"
    >
      <img
        src={mediaInfo.thumbnailUrl}
        alt={template.title}
        loading="lazy"
        className="w-full h-full object-cover transition-all duration-500 group-hover/media:scale-110"
      />

      {/* Badge */}
      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-blue-600 text-white border border-blue-700 shadow-md">
          Imagem
        </Badge>
      </div>

      {/* Overlay Zoom */}
      <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/40 transition-colors duration-300 flex items-center justify-center">
        <div className="bg-white/90 p-3 rounded-full shadow-lg opacity-0 group-hover/media:opacity-100 transition-opacity">
          <ImageIcon className="h-6 w-6 text-gray-800" />
        </div>
      </div>
    </button>
  )}

</div>


    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.template.id === nextProps.template.id &&
    prevProps.template.title === nextProps.template.title &&
    prevProps.template.is_favorite === nextProps.template.is_favorite &&
    prevProps.template.image_url === nextProps.template.image_url &&
    prevProps.template.video_url === nextProps.template.video_url &&
    prevProps.template.thumb_url === nextProps.template.thumb_url &&
    JSON.stringify(prevProps.template.tags) === JSON.stringify(nextProps.template.tags) &&
    prevProps.user?.is_admin === nextProps.user?.is_admin
  );
}

);

TemplateCard.displayName = 'TemplateCard';

export default TemplateCard;

export { cardVariants, mediaVariants, contentVariants };