// ==========================================
// src/utils/media.js
// NORMALIZAÇÃO GLOBAL DE URL DE MÍDIA
// Usa a API_BASE_URL vinda do api.js
// ==========================================

import { apiBaseUrl } from "./api";

// Remove "/api" do backend (ex: https://backend.com)
const BACKEND_BASE = apiBaseUrl.replace("/api", "");

// Detecta URL absoluta (já começa com http/https)
const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

// Detecta base64
const isBase64 = (url) => url.startsWith("data:");

// Detecta domínio do B2 (independente de bucket)
const isB2Url = (url) => {
  return (
    url.includes("backblazeb2.com") ||
    url.includes("s3") ||
    url.includes("file/prompt")
  );
};

/**
 * NORMALIZA QUALQUER URL DE MÍDIA
 */
export const resolveMediaUrl = (url = "") => {
  try {
    if (!url) return "";

    // Base64 → retorna como está
    if (isBase64(url)) return url;

    // URLs absolutas (http/https) → retorna como está
    if (isAbsoluteUrl(url)) return url;

    // URLs do B2 → manter como está
    if (isB2Url(url)) return url;

    let finalUrl = url.trim();

    // Correções antigas
    if (finalUrl.startsWith("/media/images/")) {
      finalUrl = finalUrl.replace("/media/images/", "/media/image/");
    }

    if (finalUrl.startsWith("/media/thumbs/")) {
      finalUrl = finalUrl.replace("/media/thumbs/", "/media/thumb/");
    }

    // Evita "//" duplicado
    if (finalUrl.startsWith("//")) {
      finalUrl = finalUrl.replace("//", "/");
    }

    // Prefixo final com o backend correto
    return `${BACKEND_BASE}${finalUrl}`;
  } catch (err) {
    console.error("❌ resolveMediaUrl ERRO:", err);
    return url;
  }
};
