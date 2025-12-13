// ==========================================
// src/lib/media.js
// ✅ CORRIGIDO - NÃO PROCESSA BLOB URLs
// ==========================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_BASE = API_BASE_URL.replace("/api", "");

const isB2Url = (url) => {
  return (
    url.includes("backblazeb2.com") ||
    url.includes("f005.backblazeb2.com") ||
    url.includes("s3.us-east-005.backblazeb2.com") ||
    url.includes("file/prompt")
  );
};

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

const isBase64 = (url) => url.startsWith("data:");

// ✅ NOVA: Detecta blob URLs
const isBlobUrl = (url) => url.startsWith("blob:");

/**
 * NORMALIZA QUALQUER URL DE MÍDIA
 *
 * ✅ CORREÇÃO: NÃO processa blob: URLs
 */
export const resolveMediaUrl = (url = "") => {
  try {
    if (!url) return "";

    // ✅ Base64 → retorna
    if (isBase64(url)) return url;

    // ✅ BLOB → retorna DIRETO (NÃO processar!)
    if (isBlobUrl(url)) {
      console.log(
        "🔵 Blob URL detectada, retornando sem processar:",
        url.substring(0, 50)
      );
      return url;
    }

    // ✅ URLs absolutas (http/https) → retorna
    if (isAbsoluteUrl(url)) return url;

    // ✅ URLs do B2 → retorna
    if (isB2Url(url)) return url;

    let finalUrl = url.trim();

    // Correção de duplicações
    finalUrl = finalUrl.replace(/\/media\/\/media\//g, "/media/");
    finalUrl = finalUrl.replace(/\/media\/media\//g, "/media/");
    finalUrl = finalUrl.replace(/\/\/media\//g, "/media/");

    // Correções de caminhos antigos
    if (finalUrl.startsWith("/media/images/")) {
      finalUrl = finalUrl.replace("/media/images/", "/media/image/");
    }

    if (finalUrl.startsWith("/media/thumbs/")) {
      finalUrl = finalUrl.replace("/media/thumbs/", "/media/thumb/");
    }

    if (finalUrl.startsWith("//")) {
      finalUrl = finalUrl.replace("//", "/");
    }

    if (finalUrl.startsWith("/media/")) {
      return `${BACKEND_BASE}${finalUrl}`;
    }

    return `${BACKEND_BASE}${finalUrl}`;
  } catch (err) {
    console.error("❌ resolveMediaUrl ERRO:", err);
    return url;
  }
};

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
 * ✅ CORRIGIDO: NÃO processa blob URLs
 */
export const resolveMediaUrlWithCache = (url, timestamp) => {
  if (!url) return "";

  // ✅ BLOB → retorna DIRETO
  if (isBlobUrl(url)) {
    console.log("🔵 Blob URL com cache, retornando sem processar");
    return url;
  }

  const resolvedUrl = resolveMediaUrl(url);

  const separator = resolvedUrl.includes("?") ? "&" : "?";
  const cacheParam = timestamp
    ? `v=${new Date(timestamp).getTime()}`
    : `v=${Date.now()}`;

  return `${resolvedUrl}${separator}${cacheParam}`;
};
