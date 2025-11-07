// src/components/PostCard/MediaRenderer.jsx
import React from 'react';

const MediaRenderer = ({ media }) => {
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

  // Renderiza imagem
  if (media.imageUrl) {
    return (
      <img
        src={media.imageUrl}
        alt="Post image"
        className="w-full h-56 object-cover rounded-xl"
        loading="lazy"
      />
    );
  }

  return null;
};

export default MediaRenderer;
