import axios from "axios";

// 🌍 URLs por ambiente (ajuste conforme necessário)
const API_URLS = {
  development: "http://localhost:5000/api",
  staging: "https://promply-backend-staging.onrender.com/api",
  production: "https://promply-backend-production.onrender.com/api",
};

// Detecta o ambiente atual
const ENV = import.meta.env.MODE || "development";

// Seleciona a URL base de acordo com o ambiente atual
const API_BASE_URL = API_URLS[ENV] || API_URLS.development;

// 🔧 LIMPEZA AUTOMÁTICA DE BARRAS FINAIS
// Garante que não haja '/' duplicadas no final da URL base
const CLEAN_API_BASE_URL = API_BASE_URL.replace(/\/+$/, "");

// 🧠 LOGS DE VERIFICAÇÃO — ajudam a identificar problemas futuros
console.log("==============================================");
console.log("🧩 [API CONFIGURAÇÃO INICIAL]");
console.log("🌐 Ambiente detectado:", ENV);
console.log("📦 API_BASE_URL (original):", API_BASE_URL);
console.log("🧹 API_BASE_URL (limpa):", CLEAN_API_BASE_URL);
console.log("==============================================");

// Criação da instância do Axios com baseURL limpa
const api = axios.create({
  baseURL: CLEAN_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para adicionar o token JWT automaticamente em cada requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // 🔍 Log opcional — apenas em ambiente de desenvolvimento
    if (ENV === "development") {
      console.log("🔑 [JWT Interceptor]");
      console.log("   • Token presente:", !!token);
      console.log("   • Rota:", config.url);
      console.log("   • Método:", config.method?.toUpperCase());
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ [Axios Interceptor Error]:", error);
    return Promise.reject(error);
  }
);

// Interceptor para logar respostas e status HTTP (apenas para debug)
api.interceptors.response.use(
  (response) => {
    if (ENV === "development") {
      console.log("✅ [API RESPONSE]");
      console.log("   • URL:", response.config.url);
      console.log("   • Status:", response.status);
    }
    return response;
  },
  (error) => {
    console.error("🚨 [API ERROR]");
    console.error("   • URL:", error.config?.url);
    console.error("   • Status:", error.response?.status);
    console.error("   • Mensagem:", error.message);
    return Promise.reject(error);
  }
);

// Exporta a instância do Axios para uso em toda a aplicação
export { api };

// Exporta também a baseURL limpa (usada por outros serviços, ex: Socket.IO)
export const apiBaseUrl = CLEAN_API_BASE_URL;

// Função utilitária opcional para debug manual no console
export function logApiConfig() {
  console.log("🔎 [API CONFIG CHECK]");
  console.log("   • Ambiente:", ENV);
  console.log("   • URL Original:", API_BASE_URL);
  console.log("   • URL Limpa:", CLEAN_API_BASE_URL);
  console.log("   • LocalStorage Token:", localStorage.getItem("token") ? "✅ Presente" : "❌ Ausente");
  console.log("──────────────────────────────────────────────");
}

// Log final para confirmação visual no console (Render / navegador)
console.log("==============================================");
console.log("✅ Axios Configuração Finalizada");
console.log("   • Ambiente:", ENV);
console.log("   • Base URL Ativa:", CLEAN_API_BASE_URL);
console.log("   • Headers padrão:", { "Content-Type": "application/json" });
console.log("==============================================");

export default api;