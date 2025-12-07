// ==========================================
// src/lib/media.js  (ou o caminho que você usa)
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
    return `${BACKEND_BASE}${finalUrl}`;
  } catch (err) {
    console.error("❌ resolveMediaUrl ERRO:", err);
    return url;
  }
};
