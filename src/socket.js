// socket.js
// Configuração corrigida do Socket.IO para ambiente híbrido Promply

import { io } from "socket.io-client";

// =====================================
// 🌍 Detecta Ambiente
// =====================================
const MODE = import.meta.env.MODE || "development";
const VITE_ENV = import.meta.env.VITE_ENV;

// Ambiente final
let ENV = VITE_ENV || MODE;

// =====================================
// 🔗 URLs Fixas e Corretas por Ambiente
// =====================================
// NUNCA usar domínio onrender.com em produção — cookies e WebSocket falham
const BACKEND_URLS = {
  development: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000",
  staging:
    import.meta.env.VITE_BACKEND_URL_STAGING || "https://api.promply.app",
  production: "https://api.promply.app", // 🔥 PRODUÇÃO SEMPRE USA CLOUDFLARE
};

// URL final
const URL = BACKEND_URLS[ENV] || BACKEND_URLS.development;

// Debug
console.log("🌐 Socket.IO Configuração:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - URL Backend: ${URL}`);

// =====================================
// 🔌 Inicializa Socket.IO (cliente)
// =====================================
export const socket = io(URL, {
  transports: ["websocket", "polling"], // websocket first
  withCredentials: true, // 🔥 obrigatório para session cookie
  autoConnect: true,

  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 8,

  timeout: 20000,

  // Headers CORS (não bloqueia cookies)
  extraHeaders: {
    Accept: "application/json",
  },
});

// =====================================
// 📊 Event Listeners para Debug
// =====================================
socket.on("connect", () => {
  console.log(`✅ Socket conectado: ${socket.id}`);
  console.log(`   - Transport: ${socket.io.engine.transport.name}`);
});

socket.on("disconnect", (reason) => {
  console.warn(`⚠️ Socket desconectado: ${reason}`);
});

socket.on("connect_error", (error) => {
  console.error(`❌ Erro na conexão Socket.IO:`, error);
  console.log(`   - URL tentada: ${URL}`);
  console.log(`   - Transport: ${socket.io.engine?.transport?.name || "N/A"}`);
});

socket.on("reconnect_attempt", (n) => {
  console.log(`🔄 Tentando reconectar… tentativa ${n}`);
});

socket.on("reconnect", (n) => {
  console.log(`🔄 Reconectado após ${n} tentativa(s)`);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Falha total ao reconectar WebSocket");
});

// =====================================
// 📤 Exports
// =====================================
export const backendUrl = URL;
export const currentEnv = ENV;

export default socket;
