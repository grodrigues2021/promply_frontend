// api.js
// Configuração centralizada do Axios
import axios from 'axios';

// =====================================
// 🌍 Detecta Ambiente e URL
// =====================================
const MODE = import.meta.env.MODE || "development";
const VITE_ENV = import.meta.env.VITE_ENV;

let ENV;
if (VITE_ENV) {
  ENV = VITE_ENV;
} else {
  ENV = MODE;
}

// URLs por ambiente
const API_URLS = {
  development: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api",
  staging: import.meta.env.VITE_API_URL_STAGING || "https://promply-backend-staging.onrender.com/api",
  production: import.meta.env.VITE_API_URL_PROD || "https://promply-backend-prod.onrender.com/api"
};

const API_BASE_URL = API_URLS[ENV] || API_URLS.development;

console.log("🌐 Axios Configuração:");
console.log(`   - Ambiente: ${ENV}`);
console.log(`   - Base URL: ${API_BASE_URL}`);

// =====================================
// 📡 Cria instância do Axios
// =====================================
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// =====================================
// 🔐 Request Interceptor (JWT)
// =====================================
api.interceptors.request.use(
  (config) => {
    // Log da requisição (apenas em dev)
    if (ENV === 'development') {
      console.log(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Adiciona token JWT se existir
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// =====================================
// 📥 Response Interceptor (Tratamento de erros)
// =====================================
api.interceptors.response.use(
  (response) => {
    // Log da resposta (apenas em dev)
    if (ENV === 'development') {
      console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error(`❌ [API Error] ${status} ${url}`, error.response?.data);

    // Tratamento específico por status
    switch (status) {
      case 401:
        // Token inválido ou expirado
        console.warn('⚠️ Token inválido - Redirecionando para login');
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;

      case 403:
        console.warn('⚠️ Acesso negado');
        break;

      case 404:
        console.warn('⚠️ Recurso não encontrado');
        break;

      case 500:
        console.error('❌ Erro interno do servidor');
        break;

      default:
        console.error('❌ Erro desconhecido:', error);
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