// ==========================================
// src/lib/media.js
// NORMALIZAÇÃO GLOBAL DE URL DE MÍDIA
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Remove "/api" do backend (ex: http://localhost:5000)
const BACKEND_BASE = API_BASE_URL.replace("/api", "");

// Detectar domínio do B2 (qualquer variação)
const isB2Url = (url) => {
  return (
    url.includes("backblazeb2.com") ||
    url.includes("f005.backblazeb2.com") ||
    url.includes("s3.us-east-005.backblazeb2.com") ||
    url.includes("file/prompt") // múltiplos buckets possíveis
  );
};

// Detectar se é URL absoluta válida
const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

// Detectar base64
const isBase64 = (url) => url.startsWith("data:");

/**
 * NORMALIZA QUALQUER URL DE MÍDIA
 * Regras:
 * 🔹 Se a URL já for absoluta → retorna como está
 * 🔹 Se for base64 → retorna como está
 * 🔹 Se vier do B2 → retorna como está
 * 🔹 Se vier com caminhos antigos (/media/images/) → corrigir
 * 🔹 Se for relativa → prefixar BACKEND_BASE
 */
export const resolveMediaUrl = (url = "") => {
  try {
    if (!url) return "";

    // Base64 → retorna
    if (isBase64(url)) return url;

    // URLs absolutas (http/https) → retorna
    if (isAbsoluteUrl(url)) return url;

    // URLs do B2 detectadas (backup de segurança)
    if (isB2Url(url)) return url;

    let finalUrl = url.trim();

    // ===========================
    // CORREÇÃO: Remover duplicações de /media/
    // ===========================
    // Remove /media//media/ ou //media/
    finalUrl = finalUrl.replace(/\/media\/\/media\//g, "/media/");
    finalUrl = finalUrl.replace(/\/media\/media\//g, "/media/");
    finalUrl = finalUrl.replace(/\/\/media\//g, "/media/");

    // ===========================
    // CORREÇÕES DE CAMINHOS ANTIGOS
    // ===========================
    if (finalUrl.startsWith("/media/images/")) {
      finalUrl = finalUrl.replace("/media/images/", "/media/image/");
    }

    if (finalUrl.startsWith("/media/thumbs/")) {
      finalUrl = finalUrl.replace("/media/thumbs/", "/media/thumb/");
    }

    // Evitar "//" duplicado
    if (finalUrl.startsWith("//")) {
      finalUrl = finalUrl.replace("//", "/");
    }

    // ===========================
    // PREFIXO FINAL PARA DEV
    // ===========================
    // Se já começa com /media/, não adicionar BACKEND_BASE
    if (finalUrl.startsWith("/media/")) {
      return `${BACKEND_BASE}${finalUrl}`;
    }

    return `${BACKEND_BASE}${finalUrl}`;
  } catch (err) {
    console.error("❌ resolveMediaUrl ERRO:", err);
    return url;
  }
};

/**
 * Extrai ID do vídeo do YouTube de uma URL
 * @param {string} url - URL do YouTube
 * @returns {string|null} - ID do vídeo ou null
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
};

/**
 * Detecta o tipo de vídeo baseado na URL
 * @param {string} url - URL do vídeo
 * @returns {'youtube'|'local'|null} - Tipo do vídeo
 */
export const detectVideoType = (url) => {
  if (!url) return null;

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }

  if (
    url.startsWith("data:video/") ||
    url.startsWith("blob:") ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
  ) {
    return "local";
  }

  return null;
};

/**
 * Resolve URL de mídia com cache-busting baseado em timestamp
 * @param {string} url - URL da mídia
 * @param {string} timestamp - Timestamp para cache-busting (ex: updated_at)
 * @returns {string} - URL completa com parâmetro de versão
 */
export const resolveMediaUrlWithCache = (url, timestamp) => {
  if (!url) return "";

  const resolvedUrl = resolveMediaUrl(url);

  // Se já tem query string, adiciona &v=, senão adiciona ?v=
  const separator = resolvedUrl.includes("?") ? "&" : "?";
  const cacheParam = timestamp
    ? `v=${new Date(timestamp).getTime()}`
    : `v=${Date.now()}`;

  return `${resolvedUrl}${separator}${cacheParam}`;
};
