// promply_frontend/src/lib/toast.js
// Helper para notificações toast elegantes

import { toast as sonnerToast } from 'sonner'

// Toast de sucesso padrão
export const showSuccess = (message, description) => {
  sonnerToast.success(message, {
    description,
    duration: 2000,
  })
}

// Toast de erro
export const showError = (message, description) => {
  sonnerToast.error(message, {
    description,
    duration: 3000,
  })
}

// Toast especial para copiar (verde neon)
export const showCopied = (itemName = 'Conteúdo') => {
  sonnerToast.success('✨ Copiado!', {
    description: `${itemName} copiado para área de transferência`,
    duration: 2000,
    className: 'toast-copied',
  })
}

// Toast de loading (para operações demoradas)
export const showLoading = (message) => {
  return sonnerToast.loading(message)
}

// Atualizar toast de loading para sucesso
export const updateToSuccess = (toastId, message) => {
  sonnerToast.success(message, { id: toastId })
}

// Atualizar toast de loading para erro
export const updateToError = (toastId, message) => {
  sonnerToast.error(message, { id: toastId })
}

// Helper para copiar com toast
export const copyToClipboard = async (content, itemName = 'Prompt') => {
  try {
    await navigator.clipboard.writeText(content)
    showCopied(itemName)
    return true
  } catch (error) {
    console.error('Erro ao copiar:', error)
    showError('Erro ao copiar', 'Não foi possível acessar a área de transferência')
    return false
  }
}

// Toast customizado
export const showToast = (type, message, options = {}) => {
  sonnerToast[type](message, {
    duration: 2000,
    ...options
  })
}

export default {
  success: showSuccess,
  error: showError,
  copied: showCopied,
  loading: showLoading,
  copyToClipboard,
}