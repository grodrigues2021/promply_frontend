// =====================================
// Promply - API Client Unificado
// Suporte total: Development (JWT), Staging (JWT),
// Production (Session Cookies)
// =====================================

import axios from "axios";

// =====================================
// 🌍 Detecta Ambiente
// =====================================

// MODE = modo interno do Vite (sempre "production" no Render)
const MODE = import.meta.env.MODE || "development";

// VITE_ENV = ambiente real definido no Render (development | staging | production)
const ENV = import.meta.env.VITE_ENV || MODE;

// =====================================
// 🌐 Configuração de URLs por ambiente
// Sempre preferir variáveis de ambiente (Render)
// =====================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (ENV === "development"
    ? "http://127.0.0.1:5000/api"
    : ENV === "staging"
    ? "https://promply-backend-staging.onrender.com/api"
    : "https://api.promply.app/api");

// Debug claro
console.log("===== PROMPLY API CONFIG =====");
console.log("Ambiente:", ENV);
console.log("API Base URL:", API_BASE_URL);
console.log("Auth Mode:", ENV === "production" ? "Session Cookies" : "JWT");
console.log("================================");

// =====================================
// ⚙️ Instância principal do Axios
// =====================================

const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,

  // Sempre true:
  // - Em development: permite testes com localhost
  // - Em staging: permite JWT + cookies do Google OAuth
  // - Em production: obrigatório para Session Cookies
  withCredentials: true,

  headers: {
    Accept: "application/json",
  },
};

export const api = axios.create(axiosConfig);

// =====================================
// 🔒 INTERCEPTOR DE REQUISIÇÃO
// =====================================

api.interceptors.request.use(
  (config) => {
    if (ENV === "development") {
      console.log(`➡️ [REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    }

    // ============================================================
    //  JWT → Apenas DEVELOPMENT e STAGING usam Authorization header
    // ============================================================
    if (ENV !== "production") {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        if (ENV === "development") {
          console.log("🔑 JWT enviado:", token.slice(0, 15) + "...");
        }
      } else {
        if (ENV === "development") console.warn("⚠️ Nenhum JWT encontrado.");
      }
    } else {
      // ============================================================
      //  SESSION COOKIE → PRODUCTION não usa JWT
      //  O navegador envia automaticamente o cookie de sessão
      // ============================================================
      delete config.headers.Authorization;

      if (ENV === "development") {
        console.log("🍪 Production mode → cookies automáticos ativados");
      }
    }

    return config;
  },
  (error) => {
    console.error("❌ [REQUEST ERROR]", error);
    return Promise.reject(error);
  }
);

// =====================================
// 📥 INTERCEPTOR DE RESPOSTA
// =====================================

api.interceptors.response.use(
  (response) => {
    if (ENV === "development") {
      console.log(`⬅️ [RESPONSE] ${response.status} ${response.config.url}`);
    }

    // ============================================================
    // Salva JWT automaticamente se vier em dev/staging
    // ============================================================
    if (ENV !== "production" && response.data?.access_token) {
      const token = response.data.access_token;
      localStorage.setItem("access_token", token);

      if (ENV === "development") {
        console.log("💾 JWT salvo no localStorage");
      }
    }

    return response;
  },

  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ [API ERROR] ${status} @ ${url}`, error.response?.data);

    // ============================================================
    // 🛑 401 - Não autenticado
    // ============================================================
    if (status === 401) {
      console.warn("⚠️ Não autenticado (401)");

      // Limpa tokens (dev/staging)
      if (ENV !== "production") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
      }

      // Redirecionar apenas se não estivermos na página de login
      if (!window.location.pathname.includes("/login")) {
        console.warn("🔄 Redirecionando para login...");
        window.location.href = "/login";
      }
    }

    // ============================================================
    // 🛑 Tratamentos adicionais
    // ============================================================
    if (status === 403) console.warn("⛔ Acesso negado (403)");
    if (status === 404) console.warn("🔍 Recurso não encontrado (404)");
    if (status === 500) console.error("🔥 Erro interno no servidor (500)");

    return Promise.reject(error);
  }
);

// =====================================
// 🛠️ FUNÇÕES DE AUTENTICAÇÃO
// =====================================

/**
 * Verifica se o usuário possui autenticação válida.
 * Development / Staging → precisa de token JWT
 * Production → cookies são gerenciados automaticamente pelo navegador
 */
export const hasValidAuth = () => {
  if (ENV === "production") {
    return true; // backend valida cookies
  }

  return !!(
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken")
  );
};

/**
 * Remove JWT (dev/staging)
 * Em production o backend limpa cookies via endpoint `/logout`
 */
export const clearAuth = () => {
  if (ENV !== "production") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    console.log("🗑️ JWT removido do localStorage");
  }
};

/**
 * Armazena JWT (apenas dev/staging)
 */
export const saveAuthToken = (token) => {
  if (ENV !== "production" && token) {
    localStorage.setItem("access_token", token);
    console.log("💾 JWT salvo no localStorage");
  }
};

/**
 * Obtém token JWT (somente dev/staging)
 * Production retorna null porque usa apenas cookies
 */
export const getAuthToken = () => {
  if (ENV === "production") return null;

  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    null
  );
};

// =====================================
// ⭐ FAVORITAR PROMPTS — Compatível com JWT & Cookies
// =====================================
export const favoriteRequest = async (promptId) => {
  return api.post(`/prompts/${promptId}/favorite`, {});
};

// =====================================
// 📤 EXPORTS FINAIS
// =====================================

export const apiBaseUrl = API_BASE_URL;
export const currentEnv = ENV;

export const isDevelopment = ENV === "development";
export const isStaging = ENV === "staging";
export const isProduction = ENV === "production";

export default api;
