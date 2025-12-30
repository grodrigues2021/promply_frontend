// api.js - VERSÃO COM AUTENTICAÇÃO UNIFICADA - PRODUÇÃO READY
// Suporta JWT (dev/staging) e Session Cookies (production)

import axios from "axios";

// =====================================
// 🌐 Detecta Ambiente e URL
// =====================================
const MODE = import.meta.env.MODE || "development";
const VITE_ENV = import.meta.env.VITE_ENV;

let ENV = VITE_ENV || MODE;

const API_URLS = {
  development: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api",
  staging:
    import.meta.env.VITE_API_URL ||
    "https://promply-backend-staging.onrender.com/api",
  production: import.meta.env.VITE_API_URL || "https://api.promply.app/api",
};

let API_BASE_URL = API_URLS[ENV] || API_URLS.development;

// ✅ CRÍTICO: Força HTTPS em staging/production
if (ENV === "staging" || ENV === "production") {
  const urlAntes = API_BASE_URL;

  API_BASE_URL = API_BASE_URL.replace(/^http:\/\//, "https://");

  if (!API_BASE_URL.startsWith("http")) {
    API_BASE_URL = `https://${API_BASE_URL}`;
  }

  if (urlAntes !== API_BASE_URL) {
    console.warn("⚠️ API URL corrigida de HTTP para HTTPS");
    console.warn("   - ANTES:", urlAntes);
    console.warn("   - DEPOIS:", API_BASE_URL);
  }
}

// ======================================
// ⚙️ Configuração Base do Axios
// ======================================
const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 120000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
};

// =====================================
// 📡 Cria instância do Axios
// =====================================
export const api = axios.create(axiosConfig);

// =====================================
// 📤 Interceptor de Requisição
// =====================================
api.interceptors.request.use(
  (config) => {
    // 🔑 JWT Token (apenas dev/staging)
    if (ENV !== "production") {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // ✅ Só mostra warning se não for rota pública
        const isPublicRoute =
          config.url?.includes("/auth/") ||
          config.url?.includes("/login") ||
          config.url?.includes("/register") ||
          config.url?.includes("/health");

        if (!isPublicRoute) {
          console.warn("⚠️ Nenhum token JWT encontrado para:", config.url);
        }
      }
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
    // 🔐 Salva token JWT se vier na resposta (apenas dev/staging)
    if (ENV !== "production" && response.data?.access_token) {
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error("❌ [API Error]");
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

        // ✅ Rotas públicas que NÃO devem redirecionar em erro 401
        const publicPaths = ["/login", "/register", "/reset-password"];
        const isPublicPath = publicPaths.some((path) =>
          window.location.pathname.includes(path)
        );

        if (!isPublicPath) {
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
  }
};

export const saveAuthToken = (token) => {
  if (ENV !== "production" && token) {
    localStorage.setItem("access_token", token);
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
