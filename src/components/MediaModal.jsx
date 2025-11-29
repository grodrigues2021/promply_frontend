import React from "react";
import { X } from "lucide-react";
import { resolveMediaUrl } from "../lib/media";

const MediaModal = ({ type, prompt, onClose }) => {
  if (!prompt) return null;

  // Detectar tipo de mídia
  const isYouTube = type === "video" && prompt.youtube_url;
  const isLocalVideo = type === "video" && prompt.video_url && !prompt.youtube_url;
  const isImage = type === "image" && prompt.image_url;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="relative bg-black rounded-xl overflow-hidden shadow-lg max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white bg-black/40 rounded-full p-2 hover:bg-black/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Conteúdo da mídia */}
        {isYouTube && (
          <iframe
            src={prompt.youtube_url.replace("watch?v=", "embed/")}
            title="YouTube Video"
            allowFullScreen
            className="w-full h-[80vh]"
          />
        )}

        {isLocalVideo && (
          <video
            src={resolveMediaUrl(prompt.video_url)}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] rounded-lg"
          />
        )}

        {isImage && (
          <img
            src={resolveMediaUrl(prompt.image_url)}
            alt={prompt.title || "Imagem"}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  );
};

export default MediaModal;
