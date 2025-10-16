import React, { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../lib/api';

const ChatInput = ({ onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      await api.post('/chat/posts', { content: message });
      
      setMessage('');
      
      if (onMessageSent) {
        onMessageSent();
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert(error.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    // Enviar com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            maxLength={5000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[48px] max-h-[120px]"
            style={{
              height: 'auto',
              overflowY: message.length > 100 ? 'auto' : 'hidden'
            }}
          />
          <p className="text-xs text-gray-400 mt-1 px-1">
            {message.length} / 5000
          </p>
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          title="Enviar mensagem (Enter)"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;