import React, { useState } from 'react';
import { Heart, MessageCircle, FolderPlus, Trash2, Send, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import SaveToCategory from './SaveToCategory';

const ChatMessage = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  if (!post || !post.author) {
    console.error('Post inválido:', post);
    return null;
  }

  const isMyMessage = user && post.author && user.id === post.author.id;
  const canDelete = isMyMessage || (user && user.is_admin);

  // Iniciais do autor para avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Cor de fundo baseada no ID do autor (consistente)
  const getAvatarColor = (authorId) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500',
      'bg-yellow-500', 'bg-teal-500', 'bg-orange-500'
    ];
    return colors[authorId % colors.length];
  };

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const response = await api.get(`/chat/posts/${post.id}/comments`);
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Deseja realmente deletar esta mensagem?')) return;

    try {
      await api.delete(`/chat/posts/${post.id}`);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleSaveSuccess = () => {
    setShowSaveModal(false);
    alert('Prompt salvo com sucesso!');
  };

  // Formatar hora
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ✅ FUNÇÃO para obter tags do prompt compartilhado
  const getSharedPromptTags = () => {
    if (!post.shared_prompt?.tags) return [];
    const tags = post.shared_prompt.tags;
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    return [];
  };

  // ✅ RENDERIZAÇÃO ESPECIAL: Prompt Compartilhado
  if (post.is_shared_prompt && post.shared_prompt) {
    const tags = getSharedPromptTags();

    return (
      <>
        <div className={`flex gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {!isMyMessage && (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(post.author.id)}`}>
              {getInitials(post.author.name)}
            </div>
          )}

          {/* Conteúdo */}
          <div className={`flex flex-col max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
            {/* Nome do autor */}
            {!isMyMessage && (
              <span className="text-xs font-semibold text-gray-700 mb-1 px-2">
                {post.author.name}
              </span>
            )}

            {/* Balão da mensagem */}
            <div className={`rounded-2xl px-4 py-3 ${
              isMyMessage 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-gradient-to-br from-purple-50 to-blue-50 text-gray-800 rounded-bl-none shadow-md border-2 border-purple-200'
            }`}>
              {/* Badge */}
              <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${
                isMyMessage ? 'border-purple-400' : 'border-purple-200'
              }`}>
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase opacity-90">
                  Prompt Compartilhado
                </span>
              </div>

              {/* Mensagem do usuário (se existir) */}
              {post.content && post.content.trim() && (
                <div className={`mb-3 pb-2 border-b ${
                  isMyMessage ? 'border-purple-400' : 'border-purple-200'
                }`}>
                  <p className="text-sm italic">
                    💬 {post.content}
                  </p>
                </div>
              )}

              {/* Card do Prompt */}
              <div className={`rounded-lg p-3 mb-2 ${
                isMyMessage ? 'bg-purple-700/40' : 'bg-white shadow-sm'
              }`}>
                {/* Título */}
                <h4 className="font-bold text-sm mb-2 flex items-center gap-1">
                  📌 {post.shared_prompt.title}
                </h4>
                
                {/* Conteúdo */}
                <div className="text-xs max-h-32 overflow-y-auto mb-2 whitespace-pre-wrap leading-relaxed">
                  {post.shared_prompt.content}
                </div>

                {/* Descrição */}
                {post.shared_prompt.description && (
                  <p className="text-xs italic opacity-80 mb-2">
                    💡 {post.shared_prompt.description}
                  </p>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          isMyMessage
                            ? 'bg-purple-800/50 text-white'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Autor Original */}
                <div className={`text-xs opacity-70 border-t pt-1.5 mt-1.5 ${
                  isMyMessage ? 'border-purple-500/30' : 'border-gray-200'
                }`}>
                  ✍️ {post.shared_prompt.author?.name || 'Autor'}
                </div>
              </div>

              {/* Hora */}
              <div className="flex items-center justify-end gap-1 mt-2">
                <span className={`text-xs ${isMyMessage ? 'text-purple-100' : 'text-gray-400'}`}>
                  {formatTime(post.created_at)}
                </span>
                {isMyMessage && (
                  <span className="text-xs text-purple-100">✓✓</span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1 mt-1 px-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
                  post.user_liked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                type="button"
              >
                <Heart
                  className="w-3.5 h-3.5"
                  fill={post.user_liked ? 'currentColor' : 'none'}
                />
                <span>{post.likes_count || 0}</span>
              </button>

              <button
                onClick={handleToggleComments}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs transition"
                type="button"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{post.comments_count || 0}</span>
                {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                onClick={() => setShowSaveModal(true)}
                className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                title="Salvar nas minhas categorias"
                type="button"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                  title="Deletar mensagem"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Comentários */}
            {showComments && (
              <div className={`mt-2 w-full max-w-md`}>
                <div className="bg-white rounded-lg shadow-sm border p-3 space-y-2">
                  {isLoadingComments ? (
                    <p className="text-sm text-gray-500 text-center">Carregando...</p>
                  ) : comments.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs font-semibold text-gray-700">
                            {comment.author?.name || 'Usuário'}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {comment.content || ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">Nenhum comentário</p>
                  )}

                  <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Comentar..."
                      maxLength={2000}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {showSaveModal && (
          <SaveToCategory
            postContent={post.shared_prompt.content}
            postAuthor={post.shared_prompt.author?.name || 'Autor'}
            postId={post.id}
            onClose={() => setShowSaveModal(false)}
            onSuccess={handleSaveSuccess}
          />
        )}
      </>
    );
  }

  // ✅ RENDERIZAÇÃO NORMAL: Post Simples
  return (
    <>
      <div className={`flex gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isMyMessage && (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(post.author.id)}`}>
            {getInitials(post.author.name)}
          </div>
        )}

        {/* Conteúdo */}
        <div className={`flex flex-col max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
          {/* Nome */}
          {!isMyMessage && (
            <span className="text-xs font-semibold text-gray-700 mb-1 px-2">
              {post.author.name}
            </span>
          )}

          {/* Balão */}
          <div className={`rounded-2xl px-4 py-2 ${
            isMyMessage 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-white text-gray-800 rounded-bl-none shadow-md'
          }`}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
              {post.content || ''}
            </p>

            <div className="flex items-center justify-end gap-1 mt-1">
              <span className={`text-xs ${isMyMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                {formatTime(post.created_at)}
              </span>
              {isMyMessage && (
                <span className="text-xs text-blue-100">✓✓</span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 mt-1 px-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
                post.user_liked
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              type="button"
            >
              <Heart
                className="w-3.5 h-3.5"
                fill={post.user_liked ? 'currentColor' : 'none'}
              />
              <span>{post.likes_count || 0}</span>
            </button>

            <button
              onClick={handleToggleComments}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs transition"
              type="button"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{post.comments_count || 0}</span>
              {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition"
                title="Deletar mensagem"
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Comentários */}
          {showComments && (
            <div className="mt-2 w-full max-w-md">
              <div className="bg-white rounded-lg shadow-sm border p-3 space-y-2">
                {isLoadingComments ? (
                  <p className="text-sm text-gray-500 text-center">Carregando...</p>
                ) : comments.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-semibold text-gray-700">
                          {comment.author?.name || 'Usuário'}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {comment.content || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">Nenhum comentário</p>
                )}

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Comentar..."
                    maxLength={2000}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
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

export default ChatMessage;