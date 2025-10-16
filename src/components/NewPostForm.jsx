import React, { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../lib/api';

const NewPostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      await api.post('/chat/posts', { content });
      
      setContent('');
      
      if (onPostCreated) {
        onPostCreated();
      }
      
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert(error.response?.data?.message || 'Erro ao publicar post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Compartilhe um prompt com a comunidade..."
        rows={3}
        maxLength={5000}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {content.length} / 5000 caracteres
        </span>
        
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
};

export default NewPostForm;