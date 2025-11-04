// src/hooks/useBroadcastSync.js
// Hook para sincronizar dados entre janelas/abas

import { useEffect, useCallback, useRef } from 'react';

const CHANNEL_NAME = 'promply-chat-sync';

/**
 * Hook para sincronizar dados entre janelas usando BroadcastChannel
 * 
 * @param {Function} onMessage - Callback chamado quando recebe mensagem
 * @returns {Function} sendMessage - Função para enviar mensagens
 */
export function useBroadcastSync(onMessage) {
  const channelRef = useRef(null);

  useEffect(() => {
    // Verifica se BroadcastChannel é suportado
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('⚠️ BroadcastChannel não suportado neste navegador');
      return;
    }

    // Cria canal
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    
    // Escuta mensagens
    channelRef.current.onmessage = (event) => {
      console.log('📡 Mensagem recebida:', event.data);
      if (onMessage) {
        onMessage(event.data);
      }
    };

    console.log('✅ BroadcastChannel conectado');

    // Cleanup
    return () => {
      channelRef.current?.close();
      console.log('🔌 BroadcastChannel desconectado');
    };
  }, [onMessage]);

  // Função para enviar mensagens
  const sendMessage = useCallback((data) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage(data);
        console.log('📤 Mensagem enviada:', data);
      } else {
        // Fallback: cria canal temporário
        const tempChannel = new BroadcastChannel(CHANNEL_NAME);
        tempChannel.postMessage(data);
        tempChannel.close();
        console.log('📤 Mensagem enviada (canal temporário):', data);
      }
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
    }
  }, []);

  return sendMessage;
}

/**
 * Tipos de mensagens suportadas
 */
export const BroadcastMessageTypes = {
  CHAT_MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
  PROMPT_SHARED: 'PROMPT_SHARED',
  PROMPT_SAVED: 'PROMPT_SAVED',
  PROMPT_DELETED: 'PROMPT_DELETED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
};

/**
 * Helper para enviar mensagem de chat enviada
 */
export function notifyChatMessageSent() {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: BroadcastMessageTypes.CHAT_MESSAGE_SENT,
      timestamp: Date.now()
    });
    channel.close();
  } catch (err) {
    console.warn('⚠️ Não foi possível notificar outras janelas:', err);
  }
}

/**
 * Helper para enviar mensagem de prompt compartilhado
 */
export function notifyPromptShared(promptData) {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: BroadcastMessageTypes.PROMPT_SHARED,
      data: promptData,
      timestamp: Date.now()
    });
    channel.close();
  } catch (err) {
    console.warn('⚠️ Não foi possível notificar outras janelas:', err);
  }
}

/**
 * Helper para enviar mensagem de prompt salvo
 */
export function notifyPromptSaved(promptData) {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: BroadcastMessageTypes.PROMPT_SAVED,
      data: promptData,
      timestamp: Date.now()
    });
    channel.close();
  } catch (err) {
    console.warn('⚠️ Não foi possível notificar outras janelas:', err);
  }
}

export default useBroadcastSync;