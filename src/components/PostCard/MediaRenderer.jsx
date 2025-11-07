// src/components/PostCard/MediaRenderer.jsx
import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

const MediaRenderer = ({ media }) => {
  const [showModal, setShowModal] = useState(false);

  if (!media) return null;

  // Renderiza vídeo do YouTube
  if (media.youtubeId) {
    return (
      <div className="relative w-full h-56 overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${media.youtubeId}`}
          title="YouTube video"
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Renderiza vídeo mp4
  if (media.videoUrl) {
    return (
      <video
        src={media.videoUrl}
        controls
        className="w-full h-56 object-cover rounded-xl"
      />
    );
  }

  // Renderiza imagem com modal
  if (media.imageUrl) {
    return (
      <>
        <div className="relative group">
          <img
            src={media.imageUrl}
            alt="Post image"
            className="w-full h-56 object-cover rounded-xl cursor-pointer"
            loading="lazy"
            onClick={() => setShowModal(true)}
          />
          {/* Overlay com ícone de zoom */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Modal de visualização */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition"
              onClick={() => setShowModal(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={media.imageUrl}
              alt="Post image fullscreen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return null;
};

export default MediaRenderer;