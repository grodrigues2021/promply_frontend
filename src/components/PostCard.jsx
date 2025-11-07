// src/components/PostCard.jsx
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import MediaRenderer from './PostCard/MediaRenderer';
import ActionsBar from './PostCard/ActionsBar';
import CommentsSection from './PostCard/CommentsSection';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  if (!post || !post.author) {
    console.error('Post inválido:', post);
    return null;
  }

  const handleDelete = async () => {
    if (!window.confirm('Deseja realmente deletar este post?')) return;

    try {
      await api.delete(`/chat/posts/${post.id}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert(error.response?.data?.message || 'Erro ao deletar post');
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data desconhecida';
    }
  };

  const isAuthor = user && post.author && user.id === post.author.id;
  const canDelete = isAuthor || (user && user.is_admin);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col gap-3">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-gray-800">
            {post.author?.name || 'Usuário'}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(post.created_at)}
          </p>
        </div>

        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-1 text-red-500 hover:bg-red-50 rounded transition"
            title="Deletar post"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Conteúdo */}
      {post.content && (
        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      )}

      {/* Mídia (imagem / mp4 / YouTube) */}
      <MediaRenderer media={post.media} />

      {/* Barra de ações */}
      <ActionsBar
        post={post}
        onUpdate={onUpdate}
        onToggleComments={() => setShowComments(!showComments)}
      />

      {/* Comentários */}
      <CommentsSection postId={post.id} visible={showComments} />
    </div>
  );
};

export default PostCard;
