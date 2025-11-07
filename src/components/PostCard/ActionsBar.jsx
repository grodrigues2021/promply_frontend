// src/components/PostCard/ActionsBar.jsx
import React, { useState } from 'react';
import { Heart, MessageCircle, FolderPlus, Copy } from 'lucide-react';
import api from '../../lib/api';
import SaveToCategory from '../SaveToCategory';

const ActionsBar = ({ post, onToggleComments, onUpdate }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleLike = async () => {
    try {
      await api.post(`/chat/posts/${post.id}/like`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao curtir:', error);
      alert('Erro ao curtir post');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content || '');
      alert('Prompt copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      alert('Erro ao copiar prompt');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 pt-2 border-t">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
            post.user_liked
              ? 'bg-red-50 text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Heart className="w-4 h-4" fill={post.user_liked ? 'currentColor' : 'none'} />
          <span>{post.likes_count || 0}</span>
        </button>

        <button
          onClick={onToggleComments}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count || 0}</span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm transition"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 text-sm transition"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSaveModal && (
        <SaveToCategory
          postContent={post.content || ''}
          postAuthor={post.author?.name || 'Usuário'}
          postId={post.id}
          onClose={() => setShowSaveModal(false)}
          onSuccess={() => {
            setShowSaveModal(false);
            alert('Prompt salvo com sucesso!');
          }}
        />
      )}
    </>
  );
};

export default ActionsBar;
