import axios from 'axios'

// ✅ Configuração da URL da API baseada no ambiente
const getApiBaseUrl = () => {
  // 1. Tenta pegar do ambiente (build time)
  const envApiUrl = import.meta.env.VITE_API_URL
  
  if (envApiUrl) {
    // Se começa com http, usa como está (backend separado)
    if (envApiUrl.startsWith('http')) {
      return envApiUrl
    }
    // Se é caminho relativo (ex: /api), usa a origem atual
    return envApiUrl
  }
  
  // 2. Fallback para desenvolvimento local
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api'
  }
  
  // 3. Fallback para produção (mesma origem)
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

console.log('🌐 API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRÍTICO: Enviar cookies para autenticação
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
})

// Interceptor de Request
api.interceptors.request.use(
  (config) => {
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Interceptor de Response
api.interceptors.response.use(
  (response) => {
    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.url}`, response.data)
    }
    return response
  },
  (error) => {
    // Tratamento de erros
    if (error.response) {
      const status = error.response.status
      const url = error.config?.url || 'unknown'
      
      // 401 é esperado quando não há autenticação
      if (status === 401) {
        console.log(`ℹ️ API: Não autenticado em ${url}`)
      } 
      // 403 é acesso negado
      else if (status === 403) {
        console.warn(`⚠️ API: Acesso negado em ${url}`)
      }
      // 404 é endpoint não encontrado
      else if (status === 404) {
        console.warn(`⚠️ API: Endpoint não encontrado - ${url}`)
      }
      // 500+ são erros do servidor
      else if (status >= 500) {
        console.error(`❌ API: Erro do servidor (${status}) em ${url}`)
      }
      // Outros erros
      else {
        console.error(`❌ API Error (${status}):`, error.response.data)
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('❌ API: Sem resposta do servidor (verifique a conexão)')
    } else {
      // Erro na configuração da requisição
      console.error('❌ API Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Helper para verificar se a API está acessível
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('❌ API Health Check falhou:', error)
    throw error
  }
}

export default api
