// src/lib/thumbnailCache.js
// ========================================
// THUMBNAIL CACHE COM INDEXEDDB - Persistência permanente
// ========================================

import { openDB } from "idb";

class ThumbnailCache {
  constructor() {
    this.dbName = "promply-thumbnails";
    this.storeName = "thumbnails";
    this.version = 1;
    this.db = null;
    this.cache = new Map(); // Cache em RAM para acesso rápido
    this.maxSize = 500;
    this.initPromise = this.init();
  }

  /**
   * Inicializa o IndexedDB
   */
  async init() {
    try {
      // ✅ Detecta dispositivo móvel
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        console.log("📱 Mobile detectado: usando cache RAM apenas");
        return; // Mobile não precisa de persistência
      }

      console.log("🗄️ ThumbnailCache inicializado (Desktop)");

      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("thumbnails")) {
            db.createObjectStore("thumbnails");
            console.log('✅ Object store "thumbnails" criado');
          }
        },
      });

      console.log("✅ IndexedDB inicializado");

      // ✅ Carrega thumbnails do IndexedDB para RAM
      await this.loadFromIndexedDB();
    } catch (error) {
      console.warn("⚠️ Erro ao inicializar IndexedDB, usando RAM:", error);
      this.db = null; // Fallback para RAM
    }
  }

  /**
   * Carrega todas as thumbnails do IndexedDB para o cache RAM
   */
  async loadFromIndexedDB() {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const allKeys = await store.getAllKeys();

      console.log(`💻 Desktop: carregando ${allKeys.length} thumbnails...`);
      const startTime = performance.now();

      const promises = allKeys.map(async (key) => {
        const value = await store.get(key);
        if (value) {
          this.cache.set(key, value);
        }
      });

      await Promise.all(promises);
      await tx.done;

      const elapsed = Math.round(performance.now() - startTime);
      console.log(
        `✅ Desktop: ${allKeys.length} thumbnails carregadas em ${elapsed}ms`
      );
    } catch (error) {
      console.warn("⚠️ Erro ao carregar do IndexedDB:", error);
    }
  }

  /**
   * Salva thumbnail no cache (RAM + IndexedDB)
   * @param {string} templateId - ID único do template
   * @param {string} thumbnailUrl - Data URL do thumbnail
   */
  async set(templateId, thumbnailUrl) {
    if (!templateId || !thumbnailUrl) return;

    // ✅ LRU: Remove mais antigo se cache RAM cheio
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // ✅ Salva em RAM (instantâneo)
    this.cache.set(templateId, thumbnailUrl);

    // ✅ Salva no IndexedDB (assíncrono, não bloqueia UI)
    if (this.db) {
      try {
        await this.db.put(this.storeName, thumbnailUrl, templateId);
        console.log(`💾 Thumbnail persistida: ${templateId}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao persistir thumbnail ${templateId}:`, error);
      }
    } else {
      console.log(`📦 Cache RAM: ${templateId}`);
    }
  }

  /**
   * Recupera thumbnail do cache
   * @param {string} templateId - ID do template
   * @returns {string|null} URL do thumbnail ou null
   */
  get(templateId) {
    if (!templateId) return null;

    const cached = this.cache.get(templateId);

    if (cached) {
      console.log(`⚡ Cache HIT: [${templateId}]`);
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
   * Remove thumbnail do cache (RAM + IndexedDB)
   * @param {string} templateId
   */
  async delete(templateId) {
    this.cache.delete(templateId);

    if (this.db) {
      try {
        await this.db.delete(this.storeName, templateId);
        console.log(`🗑️ Thumbnail removida: ${templateId}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao remover do IndexedDB:`, error);
      }
    }
  }

  /**
   * Limpa todo o cache (RAM + IndexedDB)
   */
  async clear() {
    this.cache.clear();

    if (this.db) {
      try {
        await this.db.clear(this.storeName);
        console.log("🧹 Cache limpo completamente (RAM + IndexedDB)");
      } catch (error) {
        console.warn("⚠️ Erro ao limpar IndexedDB:", error);
      }
    } else {
      console.log("🧹 Cache RAM limpo");
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hasIndexedDB: !!this.db,
      items: Array.from(this.cache.keys()),
    };
  }
}

// ✅ Singleton - mesma instância em toda aplicação
const thumbnailCache = new ThumbnailCache();

export default thumbnailCache;
