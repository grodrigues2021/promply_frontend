import React, { useState } from 'react';
import { Heart, MessageCircle, FolderPlus, Trash2, Send, Copy } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import SaveToCategory from './SaveToCategory';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Validar estrutura do post
  if (!post || !post.author) {
    console.error('Post inválido:', post);
    return null;
  }

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await api.get(`/chat/posts/${post.id}/comments`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      alert('Erro ao carregar comentários');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleLike = async () => {
    try {
      await api.post(`/chat/posts/${post.id}/like`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
      alert('Erro ao curtir post');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await api.post(`/chat/posts/${post.id}/comments`, {
        content: newComment
      });
      
      setNewComment('');
      await fetchComments();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao comentar:', error);
      alert(error.response?.data?.message || 'Erro ao adicionar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Deseja realmente deletar este post?')) return;

    try {
      await api.delete(`/chat/posts/${post.id}`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert(error.response?.data?.message || 'Erro ao deletar post');
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

  const handleSaveSuccess = () => {
    setShowSaveModal(false);
    alert('Prompt salvo com sucesso!');
  };

  const isAuthor = user && post.author && user.id === post.author.id;
  const canDelete = isAuthor || (user && user.is_admin);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-800">
              {post.author?.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500">
              {post.created_at ? new Date(post.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Data desconhecida'}
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

        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
          {post.content || ''}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
              post.user_liked
                ? 'bg-red-50 text-red-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            type="button"
          >
            <Heart
              className="w-4 h-4"
              fill={post.user_liked ? 'currentColor' : 'none'}
            />
            <span>{post.likes_count || 0}</span>
          </button>

          <button
            onClick={handleToggleComments}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm transition"
            type="button"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count || 0}</span>
          </button>

          {/* Botões à direita */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm transition"
              title="Copiar prompt"
              type="button"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 text-sm transition"
              title="Salvar nas minhas categorias"
              type="button"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {isLoadingComments ? (
              <p className="text-sm text-gray-500">Carregando comentários...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded p-2">
                    <p className="text-xs font-semibold text-gray-700">
                      {comment.author?.name || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {comment.content || ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum comentário ainda</p>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                maxLength={2000}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {showSaveModal && (
        <SaveToCategory
          postContent={post.content || ''}
          postAuthor={post.author?.name || 'Usuário'}
          postId={post.id}
          onClose={() => setShowSaveModal(false)}
          onSuccess={handleSaveSuccess}
        />
      )}
    </>
  );
};

export default PostCard;