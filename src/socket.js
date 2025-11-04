// socket.js
// Configuração do Socket.IO para Frontend Promply
import { io } from "socket.io-client";

// =====================================
// 🌍 Detecta Ambiente
// =====================================
const MODE = import.meta.env.MODE || "development";
const VITE_ENV = import.meta.env.VITE_ENV;

// Determina ambiente correto
let ENV;
if (VITE_ENV) {
  ENV = VITE_ENV; // Prioriza variável customizada
} else if (MODE === "production") {
  // Em build de produção, pode ser staging ou prod
  ENV = "production"; // Padrão
} else {
  ENV = MODE; // development
}

// =====================================
// 🔗 URLs por Ambiente
// =====================================
const BACKEND_URLS = {
  development: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000",
  staging: import.meta.env.VITE_BACKEND_URL_STAGING || "https://promply-backend-staging.onrender.com",
  production: import.meta.env.VITE_BACKEND_URL_PROD || "https://promply-backend-prod.onrender.com"
};

// Seleciona URL baseada no ambiente
const URL = BACKEND_URLS[ENV] || BACKEND_URLS.development;

console.log("🌐 Socket.IO Configuração:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - URL Backend: ${URL}`);

// =====================================
// 🔌 Inicializa Socket.IO
// =====================================
export const socket = io(URL, {
  // Transports: tenta WebSocket primeiro, fallback para polling
  transports: ["websocket", "polling"],
  
  // Credenciais (cookies/auth)
  withCredentials: true,
  
  // Auto-conectar ao iniciar
  autoConnect: true,
  
  // Configurações de reconexão
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  
  // Timeout
  timeout: 20000,
  
  // Headers customizados (se necessário)
  extraHeaders: {
    "Access-Control-Allow-Origin": "*"
  }
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
  console.log(`   - Transport: ${socket.io.engine?.transport?.name || 'N/A'}`);
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`🔄 Socket reconectado após ${attemptNumber} tentativa(s)`);
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Tentando reconectar... (tentativa ${attemptNumber})`);
});

socket.on("reconnect_error", (error) => {
  console.error(`❌ Erro ao reconectar:`, error);
});

socket.on("reconnect_failed", () => {
  console.error(`❌ Falha total ao reconectar após todas as tentativas`);
});

// =====================================
// 📤 Exports
// =====================================
export const backendUrl = URL;
export const currentEnv = ENV;

export default socket;