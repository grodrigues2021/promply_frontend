// src/lib/thumbnailCache.js
// ========================================
// THUMBNAIL CACHE - Persistência entre navegações
// ========================================

class ThumbnailCache {
  constructor() {
    // Map para armazenar thumbnails: key = templateId, value = thumbnailUrl
    this.cache = new Map();

    // Limite de memória (500 thumbnails, ~50MB)
    this.maxSize = 500;
  }

  /**
   * Salva thumbnail no cache
   * @param {string} templateId - ID único do template
   * @param {string} thumbnailUrl - URL ou data URL do thumbnail
   */
  set(templateId, thumbnailUrl) {
    if (!templateId || !thumbnailUrl) return;

    // Se cache estiver cheio, remover mais antigo (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(templateId, thumbnailUrl);

    // Debug (pode remover em produção)
    console.log(`📦 Cache: Salvando thumbnail [${templateId}]`);
  }

  /**
   * Recupera thumbnail do cache
   * @param {string} templateId - ID do template
   * @returns {string|null} URL do thumbnail ou null se não existir
   */
  get(templateId) {
    if (!templateId) return null;

    const cached = this.cache.get(templateId);

    if (cached) {
      console.log(`✅ Cache HIT: [${templateId}]`);
    }

    return cached || null;
  }

  /**
   * Verifica se thumbnail existe no cache
   * @param {string} templateId
   * @returns {boolean}
   */
  has(templateId) {
    return this.cache.has(templateId);
  }

  /**
   * Remove thumbnail específico do cache
   * @param {string} templateId
   */
  delete(templateId) {
    this.cache.delete(templateId);
    console.log(`🗑️ Cache: Removendo [${templateId}]`);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
    console.log("🧹 Cache limpo completamente");
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      items: Array.from(this.cache.keys()),
    };
  }
}

// Singleton - mesma instância em toda aplicação
const thumbnailCache = new ThumbnailCache();

export default thumbnailCache;
