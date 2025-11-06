import React, { useState, useEffect, useMemo } from "react";
import { MoreVertical, Heart, MessageSquare, Bookmark, Share2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const PostCard = ({ post, onLike, onSave, onDelete, onShare }) => {
  const [isLiked, setIsLiked] = useState(post?.liked || false);
  const [isSaved, setIsSaved] = useState(post?.saved || false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [showModal, setShowModal] = useState(false);

  // Detecta se é YouTube, imagem ou texto
  const mediaType = useMemo(() => {
    if (!post?.mediaUrl) return "text";
    const url = post.mediaUrl.toLowerCase();
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/)) return "image";
    return "text";
  }, [post?.mediaUrl]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => (isLiked ? prev - 1 : prev + 1));
    if (onLike) onLike(post.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (onSave) onSave(post.id);
  };

  const handleShare = () => {
    if (onShare) onShare(post.id);
    if (navigator.share) {
      navigator.share({
        title: post.title || "Compartilhar post",
        text: post.content || "",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado!");
    }
  };

  const timeAgo = useMemo(() => {
    if (!post?.created_at) return "";
    try {
      return formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "";
    }
  }, [post?.created_at]);
  // Função para extrair ID do vídeo do YouTube
  const extractYouTubeId = (url) => {
    const regex =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Render da mídia (imagem, youtube, ou texto)
  const renderMedia = () => {
    if (mediaType === "youtube") {
      const videoId = extractYouTubeId(post.mediaUrl);
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      return (
        <div
          className="relative w-full overflow-hidden rounded-xl cursor-pointer group"
          onClick={() => setShowModal(true)}
        >
          <img
            src={thumbnail}
            alt="YouTube thumbnail"
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 24 24"
                width="40"
                height="40"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (mediaType === "image") {
      return (
        <div
          className="relative w-full overflow-hidden rounded-xl cursor-pointer group"
          onClick={() => setShowModal(true)}
        >
          <img
            src={post.mediaUrl}
            alt="Post content"
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      );
    }

    // Default: texto puro
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {post.content}
      </p>
    );
  };

  // Modal leve interno
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onClick={() => setShowModal(false)}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 text-gray-700 hover:text-black"
            onClick={() => setShowModal(false)}
          >
            <X size={22} />
          </button>

          {mediaType === "youtube" ? (
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-b-xl"
                src={`https://www.youtube.com/embed/${extractYouTubeId(
                  post.mediaUrl
                )}?autoplay=1`}
                title="YouTube video player"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              src={post.mediaUrl}
              alt="Imagem ampliada"
              className="rounded-b-xl w-full object-contain"
            />
          )}
        </div>
      </div>
    );
  };
  // Cabeçalho do post (usuário e menu)
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <img
          src={post.user?.avatar || "/placeholder-avatar.png"}
          alt={post.user?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold leading-tight">
            {post.user?.name || "Usuário"}
          </h3>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onShare?.(post.id)}>
            Compartilhar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSave?.(post.id)}>
            {isSaved ? "Remover dos salvos" : "Salvar post"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => onDelete?.(post.id)}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Ações principais (curtir, comentar, salvar, compartilhar)
  const renderActions = () => (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
      <div className="flex items-center gap-5">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Heart
            size={18}
            fill={isLiked ? "red" : "none"}
            stroke={isLiked ? "red" : "currentColor"}
          />
          <span className="text-sm">{likesCount}</span>
        </button>

        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageSquare size={18} />
          <span className="text-sm">Comentar</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Bookmark
            size={18}
            fill={isSaved ? "currentColor" : "none"}
            stroke={isSaved ? "currentColor" : "currentColor"}
          />
        </button>

        <button
          onClick={handleShare}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
  // Render final do componente
  return (
    <>
      <Card className="w-full rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-card">
        <CardContent className="p-4 sm:p-5">
          {renderHeader()}

          {/* Título */}
          {post.title && (
            <h2 className="text-base sm:text-lg font-semibold mb-2">
              {post.title}
            </h2>
          )}

          {/* Conteúdo ou mídia */}
          {renderMedia()}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Ações */}
          {renderActions()}
        </CardContent>
      </Card>

      {/* Modal leve de visualização (imagem / YouTube) */}
      {renderModal()}
    </>
  );
};

export default PostCard;
