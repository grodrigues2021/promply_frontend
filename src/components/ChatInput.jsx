// src/components/ChatInput.jsx - OTIMIZADO + FOCO CORRIGIDO + BORDA AZUL SIMPLES + SYNC
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Send, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { validateMessage, debounce } from '../utils/chatUtils';
import { notifyChatMessageSent } from '../hooks/useBroadcastSync';

const ChatInput = ({ onMessageSent, hasNewMessages, onScrollToBottom, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const isTyping = useRef(false);

  // 🔢 Constantes de validação
  const MAX_LENGTH = 5000;
  const MIN_LENGTH = 1;

  // 🎯 Foco automático ao montar o componente
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ⌨️ Notificar que está digitando (com debounce)
  const notifyTyping = useMemo(
    () => debounce(() => {
      if (onTyping && message.trim().length > 0) {
        onTyping(true);
        isTyping.current = true;
        
        // Para de digitar após 3 segundos
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

  // 📏 Auto-resize do textarea (com debounce)
  const handleResize = useMemo(
    () => debounce(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 50),
    []
  );

  // ✅ Validação em tempo real
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

  // 📝 Handler de mudança no textarea
  const handleTextareaChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Limitar comprimento
    if (newValue.length <= MAX_LENGTH) {
      setMessage(newValue);
      setCharCount(newValue.length);
      handleResize();
      validateInRealTime(newValue);
      
      // Notificar digitação
      if (newValue.trim().length > 0) {
        notifyTyping();
      } else if (isTyping.current) {
        onTyping?.(false);
        isTyping.current = false;
      }
    }
  }, [handleResize, validateInRealTime, notifyTyping, onTyping]);

  // 📤 Enviar mensagem
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parar indicador de digitação
    if (isTyping.current) {
      onTyping?.(false);
      isTyping.current = false;
    }

    if (isSubmitting) return;

    // Validação final
    const validation = validateMessage(message, {
      minLength: MIN_LENGTH,
      maxLength: MAX_LENGTH,
    });

    if (!validation.valid) {
      setValidationError(validation.error);
      window.toast?.error(validation.error);
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      
      await api.post('/chat/posts', {
        content: message.trim()
      });

      console.log('🚀 Mensagem enviada via API, aguardando confirmação do WebSocket...');

      // 🔥 NOTIFICA OUTRAS JANELAS (incluindo janela destacada)
      notifyChatMessageSent();

      // ⏱️ Dá tempo pro backend gravar e emitir via WS antes de atualizar manualmente
      setTimeout(() => {
        if (onMessageSent) {
          onMessageSent(); // chama APENAS uma vez, com leve atraso
        }
      }, 2000);

      // Limpar input imediatamente (mantém UX suave)
      setMessage('');
      setCharCount(0);
      setValidationError(null);

      // Resetar altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // 🎯 CORREÇÃO DO BUG: Retorna o foco após enviar
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
      
      // Toast de sucesso
      window.toast?.success('✅ Mensagem enviada!');
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao enviar mensagem';
      setValidationError(errorMsg);
      window.toast?.error(errorMsg);
      
      // Mantém foco mesmo em caso de erro
      textareaRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚡ ENTER ENVIA | SHIFT+ENTER QUEBRA LINHA
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [message, isSubmitting, validationError]);

  // 🎨 Cor do contador baseado no uso
  const getCounterColor = () => {
    const percentage = (charCount / MAX_LENGTH) * 100;
    if (percentage >= 90) return 'text-red-600 font-semibold';
    if (percentage >= 75) return 'text-orange-600 font-medium';
    return 'text-gray-500';
  };

  // ✅ Botão de enviar habilitado?
  const canSubmit = message.trim().length >= MIN_LENGTH && 
                    message.length <= MAX_LENGTH && 
                    !isSubmitting && 
                    !validationError;

  return (
    <div className="relative bg-[#F0F2F5]">
      {/* 🔽 Botão "Novas mensagens" - acima do input */}
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
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
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
              disabled={isSubmitting}
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
              <div className="flex items-center gap-2">
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
                Enter para enviar • Shift+Enter para nova linha
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
            title={canSubmit ? 'Enviar mensagem' : 'Digite uma mensagem válida'}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;