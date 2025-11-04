// socket.js
import { io } from "socket.io-client";

// Detecta ambiente
const ENV = import.meta.env.MODE || "development";

// Seleciona URL apropriada
let URL;

if (ENV === "development") {
  URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";
} else if (ENV === "staging") {
  URL = import.meta.env.VITE_BACKEND_URL_STAGING || "https://prompt-manager-ef8x.onrender.com";
} else {
  URL = import.meta.env.VITE_BACKEND_URL_PROD || "https://prompt-manager-main.onrender.com";
}

console.log(`🌐 Socket.IO conectado a: ${URL} [${ENV}]`);

export const socket = io(URL, {
  transports: ["websocket"], // força WS direto
  withCredentials: true,
  autoConnect: true,         // conecta automaticamente
});

export const backendUrl = URL;
// ✅ export default
export default socket;