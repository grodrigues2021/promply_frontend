// src/components/ChatInput.jsx - COM UPLOAD DE IMAGEM
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Send, Loader2, ChevronDown, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import api from '../lib/api';
import { validateMessage, debounce } from '../utils/chatUtils';
import { notifyChatMessageSent } from '../hooks/useBroadcastSync';

const ChatInput = ({ onMessageSent, hasNewMessages, onScrollToBottom, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const isTyping = useRef(false);

  const MAX_LENGTH = 5000;
  const MIN_LENGTH = 1;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 📷 Upload de imagem
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.toast?.error('Selecione apenas arquivos de imagem');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      window.toast?.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setImageFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // 🗑️ Remover imagem
  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.toast?.success('Imagem removida');
  }, []);

  // 📤 Upload da imagem para o servidor
  const uploadImage = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      setUploadingImage(true);
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw new Error('Falha no upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const notifyTyping = useMemo(
    () => debounce(() => {
      if (onTyping && message.trim().length > 0) {
        onTyping(true);
        isTyping.current = true;
        
        setTimeout(() => {
          if (isTyping.current) {
            onTyping(false);
            isTyping.current = false;
          }
        }, 3000);
      }
    }, 500),
    [onTyping, message]
  );

  const handleResize = useMemo(
    () => debounce(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 50),
    []
  );

  const validateInRealTime = useCallback((text) => {
    if (text.trim().length === 0) {
      setValidationError(null);
      return;
    }

    const validation = validateMessage(text, {
      minLength: MIN_LENGTH,
      maxLength: MAX_LENGTH,
    });

    if (!validation.valid) {
      setValidationError(validation.error);
    } else {
      setValidationError(null);
    }
  }, []);

  const handleTextareaChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (newValue.length <= MAX_LENGTH) {
      setMessage(newValue);
      setCharCount(newValue.length);
      handleResize();
      validateInRealTime(newValue);
      
      if (newValue.trim().length > 0) {
        notifyTyping();
      } else if (isTyping.current) {
        onTyping?.(false);
        isTyping.current = false;
      }
    }
  }, [handleResize, validateInRealTime, notifyTyping, onTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isTyping.current) {
      onTyping?.(false);
      isTyping.current = false;
    }

    if (isSubmitting) return;

    // Validação: ou tem mensagem ou tem imagem
    if (!message.trim() && !imageFile) {
      window.toast?.error('Digite uma mensagem ou selecione uma imagem');
      return;
    }

    const validation = validateMessage(message, {
      minLength: 0, // Permite mensagem vazia se tiver imagem
      maxLength: MAX_LENGTH,
    });

    if (message.trim() && !validation.valid) {
      setValidationError(validation.error);
      window.toast?.error(validation.error);
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      // 1️⃣ Upload da imagem (se houver)
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // 2️⃣ Enviar mensagem
      await api.post('/chat/posts', {
        content: message.trim(),
        image_url: imageUrl
      });

      console.log('🚀 Mensagem enviada via API');

      notifyChatMessageSent();

      setTimeout(() => {
        if (onMessageSent) {
          onMessageSent();
        }
      }, 2000);

      // 3️⃣ Limpar form
      setMessage('');
      setCharCount(0);
      setValidationError(null);
      removeImage();

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
      
      window.toast?.success('✅ Mensagem enviada!');
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao enviar mensagem';
      setValidationError(errorMsg);
      window.toast?.error(errorMsg);
      
      textareaRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [message, isSubmitting, validationError, imageFile]);

  const getCounterColor = () => {
    const percentage = (charCount / MAX_LENGTH) * 100;
    if (percentage >= 90) return 'text-red-600 font-semibold';
    if (percentage >= 75) return 'text-orange-600 font-medium';
    return 'text-gray-500';
  };

  const canSubmit = (message.trim().length >= MIN_LENGTH || imageFile) && 
                    message.length <= MAX_LENGTH && 
                    !isSubmitting && 
                    !validationError &&
                    !uploadingImage;

  return (
    <div className="relative bg-[#F0F2F5]">
      {/* 🔽 Botão "Novas mensagens" */}
      {hasNewMessages && (
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={onScrollToBottom}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all animate-bounce"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="text-sm font-medium">Nova mensagem</span>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </div>
      )}

      {/* Input de mensagem */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Preview da Imagem */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-lg border-2 border-blue-300"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem... (Shift+Enter para nova linha)"
                rows={1}
                maxLength={MAX_LENGTH}
                disabled={isSubmitting || uploadingImage}
                autoFocus
                className={`w-full px-4 py-3 bg-white border border-blue-500 rounded-xl !outline-none focus:!outline-none focus-visible:!outline-none resize-none max-h-[200px] overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed transition ${
                  validationError 
                    ? 'border-red-400' 
                    : ''
                }`}
                style={{ 
                  minHeight: '48px', 
                  boxShadow: 'none', 
                  outline: 'none',
                  outlineOffset: '0px'
                }}
              />
              
              {/* Informações e erro */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-3">
                  {/* Botão de adicionar imagem */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="chat-image-upload"
                    disabled={isSubmitting || uploadingImage}
                  />
                  <label
                    htmlFor="chat-image-upload"
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition ${
                      uploadingImage || isSubmitting
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">Imagem</span>
                  </label>

                  {/* Contador de caracteres */}
                  <p className={`text-xs ${getCounterColor()}`}>
                    {charCount} / {MAX_LENGTH}
                  </p>
                  
                  {/* Mensagem de erro */}
                  {validationError && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">{validationError}</span>
                    </div>
                  )}
                </div>
                
                {/* Dica de uso */}
                <p className="text-xs text-gray-400 hidden sm:block">
                  Enter • Shift+Enter
                </p>
              </div>
            </div>
            
            {/* Botão de enviar */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition shadow-lg ${
                canSubmit
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-md'
              }`}
              title={canSubmit ? 'Enviar mensagem' : 'Digite uma mensagem ou selecione uma imagem'}
            >
              {isSubmitting || uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;