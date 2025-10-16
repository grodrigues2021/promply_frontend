import React, { useState } from 'react';
import { X, Share2, Loader2 } from 'lucide-react';
import api from '../lib/api';

const SharePromptModal = ({ prompt, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const response = await api.post(`/chat/share-prompt/${prompt.id}`, {
        message: message.trim()
      });
      
      if (response.data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Erro ao compartilhar prompt no chat';
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Função para normalizar tags (aceita string ou array)
  const getTags = () => {
    if (!prompt.tags) return [];
    
    if (Array.isArray(prompt.tags)) {
      return prompt.tags;
    }
    
    if (typeof prompt.tags === 'string') {
      return prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    return [];
  };

  const tags = getTags();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Compartilhar no Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleShare} className="p-4 space-y-4">
          {/* Preview do prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt que será compartilhado:
            </label>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                📌 {prompt.title}
              </h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {prompt.content}
              </div>
              {prompt.description && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  💡 {prompt.description}
                </p>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mensagem adicional (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adicionar mensagem (opcional):
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Pessoal, achei esse prompt muito útil!"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} / 500 caracteres
            </p>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Este prompt será compartilhado publicamente no chat.
              Todos os usuários poderão visualizar e salvar em suas categorias.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              🚀 Após compartilhar, o chat abrirá automaticamente com seu post!
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compartilhando...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Compartilhar no Chat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SharePromptModal;