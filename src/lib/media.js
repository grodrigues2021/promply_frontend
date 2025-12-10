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
    url.includes("cdn.promply.app") ||
    url.includes("file/promply") // bucket específico
  );
};

// Detectar se é URL absoluta válida
const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

// Detectar base64
const isBase64 = (url) => url.startsWith("data:");

/**
 * NORMALIZA QUALQUER URL DE MÍDIA
 * Regras:
 * 🔹 Base64 → retorna como está
 * 🔹 URLs absolutas (http/https) → retorna como está
 * 🔹 URLs do B2 → retorna como está
 * 🔹 Paths relativos → prefixar com BACKEND_BASE/media/
 * 🔹 Paths com /media/ duplicado → corrigir
 */
export const resolveMediaUrl = (url = "") => {
  try {
    if (!url) return "";

    const trimmedUrl = url.trim();

    // Log para debug
    console.log("🔍 resolveMediaUrl recebeu:", trimmedUrl.substring(0, 100));

    // Base64 → retorna direto
    if (isBase64(trimmedUrl)) {
      console.log("✅ Detectado como Base64");
      return trimmedUrl;
    }

    // URLs absolutas (http/https) → retorna direto
    if (isAbsoluteUrl(trimmedUrl)) {
      console.log("✅ Detectado como URL absoluta");
      return trimmedUrl;
    }

    // URLs do B2 detectadas → retorna direto (backup de segurança)
    if (isB2Url(trimmedUrl)) {
      console.log("✅ Detectado como B2 URL");
      return trimmedUrl;
    }

    console.log("🔧 Processando como path relativo");

    let finalUrl = trimmedUrl;

    // ===========================
    // CORREÇÃO: Remover /media/ duplicado
    // ===========================
    if (finalUrl.startsWith("/media/media/")) {
      finalUrl = finalUrl.replace("/media/media/", "/media/");
    }

    // ===========================
    // CORREÇÃO: Adicionar /media/ se não tiver
    // ===========================
    if (!finalUrl.startsWith("/media/") && !finalUrl.startsWith("media/")) {
      // Se começa com barra, remove
      if (finalUrl.startsWith("/")) {
        finalUrl = finalUrl.substring(1);
      }
      finalUrl = `/media/${finalUrl}`;
    } else if (finalUrl.startsWith("media/")) {
      // Se começar sem barra, adiciona
      finalUrl = `/${finalUrl}`;
    }

    // ===========================
    // CORREÇÕES DE CAMINHOS ANTIGOS
    // ===========================
    if (finalUrl.includes("/media/images/")) {
      finalUrl = finalUrl.replace("/media/images/", "/media/image/");
    }

    if (finalUrl.includes("/media/thumbs/")) {
      finalUrl = finalUrl.replace("/media/thumbs/", "/media/thumb/");
    }

    // Evitar "//" duplicado
    finalUrl = finalUrl.replace(/\/\//g, "/");

    // ===========================
    // PREFIXO FINAL COM BACKEND
    // ===========================
    const result = `${BACKEND_BASE}${finalUrl}`;
    console.log("✅ URL final:", result.substring(0, 100));

    return result;
  } catch (err) {
    console.error("❌ resolveMediaUrl ERRO:", err, "URL original:", url);
    return url;
  }
};

/**
 * Adiciona cache buster a uma URL
 */
export const addCacheBuster = (url, timestamp) => {
  if (!url) return "";

  try {
    const resolvedUrl = resolveMediaUrl(url);
    const separator = resolvedUrl.includes("?") ? "&" : "?";
    return `${resolvedUrl}${separator}v=${timestamp}`;
  } catch (err) {
    console.error("❌ addCacheBuster ERRO:", err);
    return resolveMediaUrl(url);
  }
};

/**
 * Resolve URL de mídia com cache buster
 */
export const resolveMediaUrlWithCache = (url, updatedAt) => {
  if (!url) return "";

  try {
    const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();

    return addCacheBuster(url, timestamp);
  } catch (err) {
    console.error("❌ resolveMediaUrlWithCache ERRO:", err);
    return resolveMediaUrl(url);
  }
};
