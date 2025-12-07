// api.js - VERSÃO COM AUTENTICAÇÃO UNIFICADA
// Suporta JWT (dev/staging) e Session Cookies (production)

import axios from "axios";

// =====================================
// 🌍 Detecta Ambiente e URL
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

const API_BASE_URL = API_URLS[ENV] || API_URLS.development;

console.log("🌍 Axios Configuração:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - Base URL: ${API_BASE_URL}`);
console.log(
  `   - Auth Mode: ${ENV === "production" ? "Session Cookies" : "JWT Token"}`
);

// ======================================
// ⚙️ Configuração Base do Axios
// ======================================
const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // ✅ SEMPRE true para permitir cookies (production) e funcionar em todos os ambientes
  headers: {
    Accept: "application/json",
  },
};

// =====================================
// 📡 Cria instância do Axios
// =====================================
export const api = axios.create(axiosConfig);

// =====================================
// 🔒 Interceptor de Requisição
// =====================================
api.interceptors.request.use(
  (config) => {
    if (ENV === "development") {
      console.log(
        `🌐 [API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    // 🔑 JWT Token (apenas dev/staging)
    // Production usa cookies automaticamente, não precisa adicionar token
    if (ENV !== "production") {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        if (ENV === "development") {
          console.log("🔑 Token JWT adicionado:", token.slice(0, 20) + "...");
        }
      } else if (ENV === "development") {
        console.warn("⚠️ Nenhum token encontrado no localStorage");
      }
    } else if (ENV === "development") {
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
    if (ENV === "development") {
      console.log(
        `✅ [API Response] ${response.status} ${response.config.url}`
      );
    }

    // 🔑 Salva token JWT se vier na resposta (apenas dev/staging)
    // Em production, os cookies são gerenciados automaticamente pelo navegador
    if (ENV !== "production" && response.data?.access_token) {
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);

      if (ENV === "development") {
        console.log("💾 Token JWT salvo no localStorage");
      }
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ [API Error] ${status} ${url}`, error.response?.data);

    switch (status) {
      case 401:
        console.warn("⚠️ Não autenticado (401)");

        // Limpa tokens (dev/staging) ou cookies (production é automático)
        if (ENV !== "production") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
        }

        // Redireciona para login se não estiver já na página de login
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

/**
 * Verifica se há um token válido (dev/staging) ou sessão ativa (production)
 * @returns {boolean}
 */
export const hasValidAuth = () => {
  if (ENV === "production") {
    // Em production, assume que o navegador gerencia cookies
    // A validação real será feita no backend
    return true;
  } else {
    // Em dev/staging, verifica se há token no localStorage
    return !!(
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken")
    );
  }
};

/**
 * Remove autenticação (logout)
 */
export const clearAuth = () => {
  if (ENV !== "production") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    console.log("🗑️ Tokens JWT removidos");
  }
  // Em production, o logout é feito via API que limpa os cookies no servidor
};

/**
 * Salva token JWT (apenas dev/staging)
 * @param {string} token
 */
export const saveAuthToken = (token) => {
  if (ENV !== "production" && token) {
    localStorage.setItem("access_token", token);
    console.log("💾 Token JWT salvo");
  }
};

/**
 * Pega token do localStorage (dev/staging) ou null (production usa cookies)
 * @returns {string|null}
 */
export const getAuthToken = () => {
  if (ENV === "production") {
    return null; // Production usa cookies gerenciados pelo navegador
  }

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    null
  );
};

export const favoriteRequest = async (promptId) => {
  // ✅ Usa diretamente o api.post que já tem o interceptor configurado
  // O interceptor adiciona automaticamente:
  // - JWT token (dev/staging) via Authorization header
  // - withCredentials: true para cookies (production)
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
