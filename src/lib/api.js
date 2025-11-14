// api.js - VERSÃO CORRIGIDA
// Configuração centralizada do Axios
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
    import.meta.env.VITE_API_URL_STAGING ||
    "https://promply-backend-staging.onrender.com/api",
  production:
    import.meta.env.VITE_API_URL_PROD ||
    "https://promply-backend-prod.onrender.com/api",
};

const API_BASE_URL = API_URLS[ENV] || API_URLS.development;

console.log("🌍 Axios Configuração:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - Base URL: ${API_BASE_URL}`);

// ======================================
// ⚙️ Configuração dinâmica por ambiente
// ======================================
const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
};

// Em produção → cookies HttpOnly (para JWT nos cookies)
if (ENV === "production") {
  axiosConfig.withCredentials = true;
} else {
  axiosConfig.withCredentials = false;
}

// =====================================
// 📡 Cria instância do Axios
// =====================================
export const api = axios.create(axiosConfig);

// =====================================
// 🔒 Interceptores de Requisição
// =====================================
api.interceptors.request.use(
  (config) => {
    if (ENV === "development") {
      console.log(
        `🌐 [API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    // 🔑 CORRIGIDO: Sempre adiciona token do localStorage (exceto production que usa cookies)
    if (ENV !== "production") {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        if (ENV === "development") {
          console.log("🔑 Token adicionado:", token.slice(0, 20) + "...");
        }
      } else if (ENV === "development") {
        console.warn("⚠️ Nenhum token encontrado no localStorage");
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
// 📥 Interceptores de Resposta
// =====================================
api.interceptors.response.use(
  (response) => {
    if (ENV === "development") {
      console.log(
        `✅ [API Response] ${response.status} ${response.config.url}`
      );
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ [API Error] ${status} ${url}`, error.response?.data);

    switch (status) {
      case 401:
        console.warn("⚠️ Sessão expirada - limpando token e redirecionando");
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("authToken");

        if (ENV !== "production") {
          window.location.href = "/login";
        }
        break;

      case 403:
        console.warn("⚠️ Acesso negado");
        break;

      case 404:
        console.warn("⚠️ Rota não encontrada");
        break;

      case 500:
        console.error("❌ Erro interno no servidor");
        break;

      default:
        console.error("❌ Erro desconhecido:", error);
    }

    return Promise.reject(error);
  }
);

// =====================================
// 📤 Exports
// =====================================
export const apiBaseUrl = API_BASE_URL;
export const currentEnv = ENV;
export default api;
