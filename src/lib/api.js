// api.js - VERSÃO COM AUTENTICAÇÃO UNIFICADA + DEBUG DETALHADO
// Suporta JWT (dev/staging) e Session Cookies (production)

import axios from "axios";

// =====================================
// 🌍 Detecta Ambiente e URL
// =====================================
const MODE = import.meta.env.MODE || "development";
const VITE_ENV = import.meta.env.VITE_ENV;

let ENV = VITE_ENV || MODE;

console.log("🔍 ========== DEBUG API.JS ==========");
console.log("📊 Variáveis de Ambiente RAW:");
console.log("   - import.meta.env.MODE:", MODE);
console.log("   - import.meta.env.VITE_ENV:", VITE_ENV);
console.log("   - import.meta.env.VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("   - ENV detectado:", ENV);

const API_URLS = {
  development: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api",
  staging:
    import.meta.env.VITE_API_URL ||
    "https://promply-backend-staging.onrender.com/api",
  production: import.meta.env.VITE_API_URL || "https://api.promply.app/api",
};

console.log("📋 URLs por Ambiente:");
console.log("   - development:", API_URLS.development);
console.log("   - staging:", API_URLS.staging);
console.log("   - production:", API_URLS.production);

let API_BASE_URL = API_URLS[ENV] || API_URLS.development;

console.log("🎯 URL Selecionada ANTES de validação:");
console.log("   - API_BASE_URL:", API_BASE_URL);
console.log(
  "   - Protocolo:",
  API_BASE_URL.startsWith("https://") ? "✅ HTTPS" : "❌ HTTP"
);

// ✅ CRÍTICO: Força HTTPS em staging/production
if (ENV === "staging" || ENV === "production") {
  console.log("🔒 Forçando HTTPS para ambiente:", ENV);

  const urlAntes = API_BASE_URL;

  // Se a URL estiver com HTTP, troca para HTTPS
  API_BASE_URL = API_BASE_URL.replace(/^http:\/\//, "https://");

  // Se não tiver protocolo, adiciona HTTPS
  if (!API_BASE_URL.startsWith("http")) {
    API_BASE_URL = `https://${API_BASE_URL}`;
  }

  if (urlAntes !== API_BASE_URL) {
    console.warn("⚠️ URL foi corrigida!");
    console.warn("   - ANTES:", urlAntes);
    console.warn("   - DEPOIS:", API_BASE_URL);
  } else {
    console.log("✅ URL já estava com HTTPS");
  }
}

console.log("🌍 Axios Configuração FINAL:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - Base URL: ${API_BASE_URL}`);
console.log(
  `   - Protocolo: ${
    API_BASE_URL.startsWith("https://") ? "✅ HTTPS" : "❌ HTTP"
  }`
);
console.log(
  `   - Auth Mode: ${ENV === "production" ? "Session Cookies" : "JWT Token"}`
);
console.log("====================================\n");

// ======================================
// ⚙️ Configuração Base do Axios
// ======================================
const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
};

console.log("⚙️ Configuração do Axios criada:");
console.log("   - baseURL:", axiosConfig.baseURL);
console.log("   - timeout:", axiosConfig.timeout);
console.log("   - withCredentials:", axiosConfig.withCredentials);

// =====================================
// 📡 Cria instância do Axios
// =====================================
export const api = axios.create(axiosConfig);

console.log("✅ Instância do Axios criada com sucesso");
console.log("🔍 Verificação final da baseURL:", api.defaults.baseURL);
console.log("====================================\n");

// =====================================
// 🔒 Interceptor de Requisição
// =====================================
api.interceptors.request.use(
  (config) => {
    console.log("📤 [INTERCEPTOR REQUEST]");
    console.log("   - Method:", config.method?.toUpperCase());
    console.log("   - URL:", config.url);
    console.log("   - baseURL:", config.baseURL);
    console.log("   - Full URL:", `${config.baseURL}${config.url}`);
    console.log(
      "   - Protocolo:",
      config.baseURL?.startsWith("https://") ? "✅ HTTPS" : "❌ HTTP"
    );

    // 🔑 JWT Token (apenas dev/staging)
    if (ENV !== "production") {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔐 Token JWT adicionado:", token.slice(0, 20) + "...");
      } else {
        console.warn("⚠️ Nenhum token encontrado no localStorage");
      }
    } else {
      console.log("🍪 Production mode - usando Session Cookies");
    }

    return config;
  },
  (error) => {
    console.error("❌ [API Request Error]", error);
    return Promise.reject(error);
  }
);

// =====================================
// 📥 Interceptor de Resposta
// =====================================
api.interceptors.response.use(
  (response) => {
    console.log("✅ [INTERCEPTOR RESPONSE]");
    console.log("   - Status:", response.status);
    console.log("   - URL:", response.config.url);

    // 🔑 Salva token JWT se vier na resposta (apenas dev/staging)
    if (ENV !== "production" && response.data?.access_token) {
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);
      console.log("💾 Token JWT salvo no localStorage");
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error("❌ [INTERCEPTOR ERROR]");
    console.error("   - Status:", status);
    console.error("   - URL:", url);
    console.error("   - Data:", error.response?.data);

    switch (status) {
      case 401:
        console.warn("⚠️ Não autenticado (401)");

        if (ENV !== "production") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
        }

        if (!window.location.pathname.includes("/login")) {
          console.warn("🔄 Redirecionando para login...");
          window.location.href = "/login";
        }
        break;

      case 403:
        console.warn("⚠️ Acesso negado (403)");
        break;

      case 404:
        console.warn("⚠️ Recurso não encontrado (404)");
        break;

      case 500:
        console.error("❌ Erro interno do servidor (500)");
        break;

      default:
        console.error("❌ Erro desconhecido:", error);
    }

    return Promise.reject(error);
  }
);

// =====================================
// 🛠️ Helper Functions
// =====================================

export const hasValidAuth = () => {
  if (ENV === "production") {
    return true;
  } else {
    return !!(
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken")
    );
  }
};

export const clearAuth = () => {
  if (ENV !== "production") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    console.log("🗑️ Tokens JWT removidos");
  }
};

export const saveAuthToken = (token) => {
  if (ENV !== "production" && token) {
    localStorage.setItem("access_token", token);
    console.log("💾 Token JWT salvo");
  }
};

export const getAuthToken = () => {
  if (ENV === "production") {
    return null;
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    null
  );
};

export const favoriteRequest = async (promptId) => {
  return api.post(`/prompts/${promptId}/favorite`, {});
};

// =====================================
// 📤 Exports
// =====================================
export const apiBaseUrl = API_BASE_URL;
export const currentEnv = ENV;
export const isProduction = ENV === "production";
export const isStaging = ENV === "staging";
export const isDevelopment = ENV === "development";

export default api;
