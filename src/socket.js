// socket.js
// Configuração corrigida do Socket.IO para todos os ambientes Promply

import { io } from "socket.io-client";

// Detecta ambiente
const MODE = import.meta.env.MODE || "development";
const VITE_ENV = import.meta.env.VITE_ENV;
let ENV = VITE_ENV || MODE;

// ================================
// URLs por ambiente (CORRETAS)
// ================================
const BACKEND_URLS = {
  development: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000",

  staging:
    import.meta.env.VITE_BACKEND_URL_STAGING ||
    "https://promply-backend-staging.onrender.com",

  production:
    // PRODUÇÃO SEMPRE VIA CLOUDFLARE → COOKIES + WEBSOCKET OK
    "https://api.promply.app",
};

// Seleção final
const URL = BACKEND_URLS[ENV] || BACKEND_URLS.development;

console.log("🌐 Socket.IO Configuração:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - URL Backend: ${URL}`);

// Inicialização do socket
export const socket = io(URL, {
  transports: ["websocket", "polling"],
  withCredentials: ENV === "production", // cookies só em produção
  autoConnect: true,

  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 8,
  timeout: 20000,
});

// Debug
socket.on("connect", () => {
  console.log(`✅ Socket conectado: ${socket.id}`);
});

socket.on("connect_error", (err) => {
  console.error("❌ Erro Socket.IO:", err);
  console.error("Tentando conectar em:", URL);
});

// Exports
export const backendUrl = URL;
export const currentEnv = ENV;

export default socket;
