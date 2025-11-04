// src/hooks/useWebSocket.js — versão final sem looping
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";

let globalSocket = null; // conexão global única

export function useWebSocket(onMessage) {
  const messageHandlerRef = useRef(onMessage);

  useEffect(() => {
    messageHandlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!globalSocket) {
      console.log("🔌 Criando conexão WebSocket global:", SOCKET_URL);
      globalSocket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
      });

      globalSocket.on("connect", () => {
        console.log("✅ WebSocket conectado:", globalSocket.id);
      });

      globalSocket.on("disconnect", (reason) => {
        console.warn("⚠️ WebSocket desconectado:", reason);
      });

      globalSocket.on("connect_error", (err) => {
        console.error("❌ Erro WebSocket:", err.message);
      });
    }

    const handleMessage = (data) => {
      messageHandlerRef.current?.(data);
    };

    globalSocket.on("new_message", handleMessage);

    return () => {
      globalSocket.off("new_message", handleMessage);
    };
  }, []);

  return globalSocket;
}
