// src/components/NewPostForm.jsx
import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import api from '../lib/api';

const NewPostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamanho (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setImageFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw new Error('Falha no upload da imagem');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!content.trim() && !imageFile) || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      // 1. Upload da imagem (se houver)
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // 2. Criar post com URL da imagem
      await api.post('/chat/posts', {
        content: content.trim(),
        image_url: imageUrl,
      });

      // 3. Limpar form
      setContent('');
      removeImage();
      
      if (onPostCreated) {
        onPostCreated();
      }
      
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert(error.response?.data?.message || 'Erro ao publicar post');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0)
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Compartilhe um prompt com a comunidade..."
        rows={3}
        maxLength={5000}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {/* Preview da Imagem */}
      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full max-h-64 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            title="Remover imagem"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de progresso */}
      {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botão de adicionar imagem */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm">Imagem</span>
          </label>

          <span className="text-sm text-gray-500">
            {content.length} / 5000
          </span>
        </div>
        
        <button
          type="submit"
          disabled={(!content.trim() && !imageFile) || isSubmitting}
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