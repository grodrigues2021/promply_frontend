// src/utils/chatUtils.js
import DOMPurify from 'dompurify';

/**
 * 🎨 CORES PARA USUÁRIOS
 */
export const CHAT_COLORS = [
  '#8B5CF6', // Roxo
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Laranja
  '#EC4899', // Rosa
  '#EAB308', // Amarelo
  '#6366F1', // Índigo
  '#06B6D4', // Cyan
  '#84CC16', // Lima
  '#F97316', // Laranja intenso
];

/**
 * Gera cor consistente baseada no user_id
 */
export const getUserColor = (userId) => {
  return CHAT_COLORS[userId % CHAT_COLORS.length];
};

/**
 * 🔤 Gera iniciais do nome
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * 🕒 Formata timestamp
 */
export const formatTimestamp = (dateString) => {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 📅 Formata data completa
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * 🔗 PROCESSA LINKS NO TEXTO
 * Converte URLs em links clicáveis
 */
export const processLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return text.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all">$1</a>'
  );
};

/**
 * ✨ PROCESSA FORMATAÇÃO BÁSICA DE MARKDOWN
 * Suporta: **negrito**, *itálico*, `código`, ~~tachado~~
 */
export const processMarkdown = (text) => {
  let processed = text;
  
  // Negrito: **texto**
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  
  // Itálico: *texto*
  processed = processed.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
  
  // Código inline: `texto`
  processed = processed.replace(/`(.+?)`/g, '<code class="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
  
  // Tachado: ~~texto~~
  processed = processed.replace(/~~(.+?)~~/g, '<del class="line-through">$1</del>');
  
  return processed;
};

/**
 * 🛡️ SANITIZA E PROCESSA CONTEÚDO
 * Remove scripts maliciosos e formata o texto
 */
export const sanitizeAndFormat = (text, options = {}) => {
  const { 
    allowLinks = true, 
    allowMarkdown = true,
    maxLength = null 
  } = options;
  
  let processed = text;
  
  // Truncar se necessário
  if (maxLength && processed.length > maxLength) {
    processed = processed.substring(0, maxLength) + '...';
  }
  
  // Aplicar formatações
  if (allowMarkdown) {
    processed = processMarkdown(processed);
  }
  
  if (allowLinks) {
    processed = processLinks(processed);
  }
  
  // Sanitizar HTML para prevenir XSS
  processed = DOMPurify.sanitize(processed, {
    ALLOWED_TAGS: ['a', 'strong', 'em', 'code', 'del', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
  
  return processed;
};

/**
 * ✅ VALIDA MENSAGEM
 */
export const validateMessage = (text, options = {}) => {
  const {
    minLength = 1,
    maxLength = 5000,
    maxSpecialCharRatio = 0.5
  } = options;
  
  const trimmed = text.trim();
  
  // Validações básicas
  if (trimmed.length < minLength) {
    return { valid: false, error: 'Mensagem muito curta' };
  }
  
  if (trimmed.length > maxLength) {
    return { valid: false, error: `Mensagem muito longa (máx. ${maxLength} caracteres)` };
  }
  
  // Verificar excesso de caracteres especiais (possível spam)
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\sÀ-ÿ]/g) || []).length;
  const specialCharRatio = specialCharCount / trimmed.length;
  
  if (specialCharRatio > maxSpecialCharRatio) {
    return { valid: false, error: 'Mensagem contém muitos caracteres especiais' };
  }
  
  // Verificar repetição excessiva de caracteres
  if (/(.)\1{9,}/.test(trimmed)) {
    return { valid: false, error: 'Mensagem contém repetição excessiva de caracteres' };
  }
  
  return { valid: true, error: null };
};

/**
 * 🎯 DEBOUNCE
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 🔔 DETECTA SE DEVE NOTIFICAR
 */
export const shouldNotify = (message, currentUserId) => {
  // Não notificar próprias mensagens
  if (message.author.id === currentUserId) {
    return false;
  }
  
  // Notificar se a janela não está em foco
  if (document.hidden) {
    return true;
  }
  
  return false;
};

/**
 * 🔔 ENVIA NOTIFICAÇÃO DO NAVEGADOR
 */
export const sendNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

/**
 * 🔔 SOLICITA PERMISSÃO PARA NOTIFICAÇÕES
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
};