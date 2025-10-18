// src/lib/api.js
import axios from 'axios'

// ✅ Configuração dinâmica baseada no ambiente
const getApiUrl = () => {
  // 1. Tenta usar variável de ambiente do Vite
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // 2. Detecta ambiente automaticamente
  const hostname = window.location.hostname
  
  // ✅ CORRIGIDO: promply (não promptly)
  if (hostname.includes('promply-frontend-staging.onrender.com')) {
    return 'https://promply-backend-staging.onrender.com/api'
  }
  
  if (hostname.includes('promply-frontend-prod.onrender.com')) {
    return 'https://promply-backend-prod.onrender.com/api'
  }
  
  // 3. Desenvolvimento local (padrão)
  return 'http://localhost:5000/api'
}

const API_URL = getApiUrl()

console.log('🌐 API configurada para:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // ✅ CRUCIAL para cookies JWT
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

// Interceptor para debug
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ [API Request Error]', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    if (error.response) {
      console.error(`❌ [API Error] ${error.response.status} ${error.config?.url}`, error.response.data)
      
      // Se receber 401, pode ser token expirado
      if (error.response.status === 401) {
        console.warn('⚠️ Token JWT inválido ou expirado - redirecionando para login')
        // Opcional: redirecionar automaticamente
        // window.location.href = '/login'
      }
    } else if (error.request) {
      console.error('❌ [API Error] Sem resposta do servidor:', error.message)
    } else {
      console.error('❌ [API Error]', error.message)
    }
    return Promise.reject(error)
  }
)

export default api