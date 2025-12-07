// ===============================================
// src/hooks/useWebSocket.js
// HOOK OFICIAL DO WEBSOCKET – ARQUITETURA UNIFICADA
// Não cria conexão nova. Usa SEMPRE o socket global.
// ===============================================

import { useEffect, useRef } from "react";
import { socket } from "../socket";

/**
 * Hook de WebSocket padronizado
 * - Nunca cria nova conexão
 * - Usa a conexão global definida em socket.js
 * - Garante listeners seguros e sem duplicação
 */
export function useWebSocket(eventName, callback) {
  const savedCallback = useRef(null);

  // Mantém a referência da callback sempre atualizada
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!eventName) return;

    const handler = (data) => {
      if (savedCallback.current) {
        savedCallback.current(data);
      }
    };

    // Registra listener
    socket.on(eventName, handler);

    console.log(`🔌 Listener WebSocket registrado → ${eventName}`);

    // Remove listener ao desmontar
    return () => {
      socket.off(eventName, handler);
      console.log(`❌ Listener WebSocket removido → ${eventName}`);
    };
  }, [eventName]);

  return socket;
}
