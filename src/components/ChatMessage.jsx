// src/components/ChatMessage.jsx - COM BOTÃO DELETE
import React, { memo, useState } from 'react';
import { Share2, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getInitials, formatTimestamp, sanitizeAndFormat } from '../utils/chatUtils';
import PromptCard from './PromptCard';
import api from '../lib/api';
import { toast } from 'sonner';

/**
 * 🎨 Componente de mensagem individual - COM DELETE
 */
const ChatMessage = ({ post, userColor, onUpdate }) => {
  const { user } = useAuth();
  const { author, content, shared_prompt, created_at } = post;
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ✅ Verifica se é mensagem do usuário atual
  const isMyMessage = user?.id === author.id;
  
  // 🕒 Formata timestamp
  const timestamp = formatTimestamp(created_at);
  
  // ✨ Iniciais do autor
  const initials = getInitials(author.name);

  // 🎨 Cor para mensagens: verde para você, colorida para outros
  const messageColor = isMyMessage ? '#25D366' : userColor;
  const messageBgColor = isMyMessage ? '#DCF8C6' : 'white';

  // 🔗 Processa conteúdo com links e formatação
  const formattedContent = sanitizeAndFormat(content, {
    allowLinks: true,
    allowMarkdown: true
  });

  // 🗑️ DELETAR POST
  const handleDeletePost = async () => {
    // Confirmar exclusão
    const confirmed = window.confirm(
      '⚠️ Tem certeza que deseja excluir este compartilhamento?\n\nEsta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      
      const response = await api.delete(`/chat/posts/${post.id}`);
      
      if (response.data.success) {
        toast.success('✅ Compartilhamento excluído com sucesso!');
        
        // Atualizar lista de posts
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Erro ao excluir compartilhamento';
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 📌 MENSAGEM DE PROMPT COMPARTILHADO
  if (shared_prompt) {
    return (
      <div className={`flex items-start gap-3 mb-4 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
          style={{ backgroundColor: messageColor }}
        >
          {initials}
        </div>

        {/* Conteúdo */}
        <div className={`flex-1 max-w-[85%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Cabeçalho da notificação */}
          <div 
            className="rounded-lg px-4 py-3 shadow-sm mb-2 relative"
            style={{
              backgroundColor: isMyMessage ? '#E7F9E7' : `${userColor}15`,
            }}
          >
            {/* ✅ BOTÃO DELETE - APENAS SE FOR MEU POST */}
            {isMyMessage && (
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="absolute top-2 right-2 p-1.5 hover:bg-red-100 rounded-full transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excluir compartilhamento"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                )}
              </button>
            )}

            <div className="flex items-center gap-2 mb-1 pr-8">
              <Share2 className="w-4 h-4" style={{ color: messageColor }} />
              <span 
                className="font-semibold text-gray-900" 
                style={{ color: messageColor }}
              >
                {isMyMessage ? 'Você' : author.name}
              </span>
              <span className="text-xs text-gray-600">compartilhou um prompt</span>
            </div>
            
            {/* Observação do usuário (se houver) */}
            {content && (
              <div 
                className="mt-2 text-sm text-gray-700 italic pl-3"
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-500 mt-2 text-right">{timestamp}</p>
          </div>

          {/* Card do Prompt */}
          <div className="mt-2">
            <PromptCard
              prompt={shared_prompt}
              isInChat
            />
          </div>
        </div>
      </div>
    );
  }

  // 💬 MENSAGEM NORMAL
  return (
    <div className={`flex items-start gap-3 mb-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
        style={{ backgroundColor: messageColor }}
      >
        {initials}
      </div>

      {/* Bolha de mensagem */}
      <div className={`flex-1 max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Nome do autor (apenas para outros) */}
        {!isMyMessage && (
          <p className="text-xs font-semibold mb-1 px-1" style={{ color: userColor }}>
            {author.name}
          </p>
        )}

        {/* Conteúdo da mensagem */}
        <div 
          className="rounded-lg px-4 py-3 shadow-sm relative"
          style={{
            backgroundColor: messageBgColor,
          }}
        >
          <div 
            className="text-gray-800 text-sm whitespace-pre-wrap break-words leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-2 text-right">
            {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

// ⚡ OTIMIZAÇÃO: React.memo com comparação customizada
export default memo(ChatMessage, (prevProps, nextProps) => {
  // Re-renderizar apenas se o post mudou
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.created_at === nextProps.post.created_at &&
    prevProps.userColor === nextProps.userColor
  );
});