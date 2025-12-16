// src/lib/thumbnailCache.js
import { openDB } from "idb";

/**
 * Sistema de cache de thumbnails com persistência em IndexedDB
 *
 * Características:
 * - Cache em RAM (rápido, temporário)
 * - Persistência em IndexedDB (disco, permanente)
 * - Carregamento otimizado por dispositivo (desktop vs mobile)
 * - Fallback para RAM se IndexedDB falhar
 */
class ThumbnailCache {
  constructor() {
    // Cache primário em RAM (acesso instantâneo)
    this.cache = new Map();

    // Estado de carregamento
    this.loading = false;
    this.loaded = false;
    this.initializationError = null;

    // Detecta se é mobile
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Estatísticas (para debug)
    this.stats = {
      hits: 0,
      misses: 0,
      diskLoads: 0,
      saves: 0,
    };

    // Inicializa banco de dados
    this.dbPromise = this.initDB();

    // Carrega cache do disco (se existir)
    this.autoLoad();

    console.log(
      `🗄️ ThumbnailCache inicializado (${this.isMobile ? "Mobile" : "Desktop"})`
    );
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async initDB() {
    try {
      const db = await openDB("promply-thumbnails", 1, {
        upgrade(db) {
          // Cria object store (equivalente a "tabela")
          if (!db.objectStoreNames.contains("thumbnails")) {
            const store = db.createObjectStore("thumbnails");
            console.log('✅ Object store "thumbnails" criado');
          }
        },
      });

      console.log("✅ IndexedDB inicializado");
      return db;
    } catch (error) {
      console.error("❌ Erro ao inicializar IndexedDB:", error);
      this.initializationError = error;
      return null;
    }
  }

  /**
   * Carrega automaticamente cache do disco na inicialização
   */
  autoLoad() {
    if (this.isMobile) {
      // Mobile: carrega em chunks (não trava UI)
      this.loadFromIndexedDBChunked().catch((err) => {
        console.warn("⚠️ Erro ao carregar cache (mobile):", err);
      });
    } else {
      // Desktop: carrega tudo de uma vez
      this.loadFromIndexedDB().catch((err) => {
        console.warn("⚠️ Erro ao carregar cache (desktop):", err);
      });
    }
  }

  /**
   * Salva thumbnail no cache (RAM + IndexedDB)
   * @param {string} id - ID do template
   * @param {string} dataUrl - Data URL da thumbnail (base64)
   */
  async set(id, dataUrl) {
    if (!id || !dataUrl) {
      console.warn("⚠️ ID ou dataUrl inválido:", {
        id,
        dataUrl: dataUrl?.substring(0, 50),
      });
      return;
    }

    // Salva em RAM (instantâneo)
    this.cache.set(id, dataUrl);
    this.stats.saves++;

    // Salva em IndexedDB (persistente)
    try {
      const db = await this.dbPromise;
      if (db) {
        await db.put("thumbnails", dataUrl, id);
        console.log(`💾 Thumbnail persistida: ${id}`);
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao persistir thumbnail ${id}:`, error);
      // Não é crítico - continua funcionando com RAM
    }
  }

  /**
   * Busca thumbnail no cache
   * @param {string} id - ID do template
   * @returns {string|null} Data URL da thumbnail ou null
   */
  get(id) {
    const value = this.cache.get(id);

    if (value) {
      this.stats.hits++;
      console.log(`⚡ Cache HIT: ${id}`);
    } else {
      this.stats.misses++;
      console.log(`❌ Cache MISS: ${id}`);
    }

    return value || null;
  }

  /**
   * Verifica se thumbnail existe no cache
   * @param {string} id - ID do template
   * @returns {boolean}
   */
  has(id) {
    return this.cache.has(id);
  }

  /**
   * Remove thumbnail do cache
   * @param {string} id - ID do template
   */
  async delete(id) {
    // Remove da RAM
    this.cache.delete(id);

    // Remove do IndexedDB
    try {
      const db = await this.dbPromise;
      if (db) {
        await db.delete("thumbnails", id);
        console.log(`🗑️ Thumbnail removida: ${id}`);
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao remover thumbnail ${id}:`, error);
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear() {
    // Limpa RAM
    this.cache.clear();

    // Limpa IndexedDB
    try {
      const db = await this.dbPromise;
      if (db) {
        await db.clear("thumbnails");
        console.log("🗑️ Cache completamente limpo");
      }
    } catch (error) {
      console.warn("⚠️ Erro ao limpar cache:", error);
    }

    // Reseta estatísticas
    this.stats = { hits: 0, misses: 0, diskLoads: 0, saves: 0 };
  }

  /**
   * Carrega cache do IndexedDB (DESKTOP - tudo de uma vez)
   */
  async loadFromIndexedDB() {
    if (this.loading || this.loaded) return;

    this.loading = true;
    const startTime = performance.now();

    try {
      const db = await this.dbPromise;
      if (!db) {
        console.warn("⚠️ IndexedDB não disponível, usando apenas RAM");
        return;
      }

      const keys = await db.getAllKeys("thumbnails");
      console.log(`💻 Desktop: carregando ${keys.length} thumbnails...`);

      if (keys.length === 0) {
        console.log("ℹ️ Cache vazio - primeira vez");
        this.loaded = true;
        return;
      }

      // Carrega todas de uma vez
      await Promise.all(
        keys.map(async (key) => {
          try {
            const value = await db.get("thumbnails", key);
            if (value) {
              this.cache.set(key, value);
              this.stats.diskLoads++;
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao carregar thumbnail ${key}:`, error);
          }
        })
      );

      const elapsed = (performance.now() - startTime).toFixed(1);
      console.log(
        `✅ Desktop: ${keys.length} thumbnails carregadas em ${elapsed}ms`
      );

      this.loaded = true;
    } catch (error) {
      console.error("❌ Erro ao carregar cache:", error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carrega cache do IndexedDB (MOBILE - em chunks)
   */
  async loadFromIndexedDBChunked() {
    if (this.loading || this.loaded) return;

    this.loading = true;
    const startTime = performance.now();

    try {
      const db = await this.dbPromise;
      if (!db) {
        console.warn("⚠️ IndexedDB não disponível, usando apenas RAM");
        return;
      }

      const keys = await db.getAllKeys("thumbnails");
      console.log(
        `📱 Mobile: carregando ${keys.length} thumbnails em chunks...`
      );

      if (keys.length === 0) {
        console.log("ℹ️ Cache vazio - primeira vez");
        this.loaded = true;
        return;
      }

      // Carrega em lotes de 5 (mais suave para mobile)
      const CHUNK_SIZE = 5;
      const PAUSE_MS = 10; // Pausa entre chunks

      for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
        const chunk = keys.slice(i, i + CHUNK_SIZE);

        await Promise.all(
          chunk.map(async (key) => {
            try {
              const value = await db.get("thumbnails", key);
              if (value) {
                this.cache.set(key, value);
                this.stats.diskLoads++;
              }
            } catch (error) {
              console.warn(`⚠️ Erro ao carregar thumbnail ${key}:`, error);
            }
          })
        );

        // Pequena pausa para liberar UI
        if (i + CHUNK_SIZE < keys.length) {
          await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
        }

        const progress = Math.min(i + CHUNK_SIZE, keys.length);
        console.log(
          `📦 Chunk ${Math.ceil(progress / CHUNK_SIZE)}/${Math.ceil(
            keys.length / CHUNK_SIZE
          )} carregado`
        );
      }

      const elapsed = (performance.now() - startTime).toFixed(1);
      console.log(
        `✅ Mobile: ${keys.length} thumbnails carregadas em ${elapsed}ms`
      );

      this.loaded = true;
    } catch (error) {
      console.error("❌ Erro ao carregar cache:", error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Retorna tamanho do cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (
            (this.stats.hits / (this.stats.hits + this.stats.misses)) *
            100
          ).toFixed(1)
        : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${hitRate}%`,
      loaded: this.loaded,
      loading: this.loading,
      device: this.isMobile ? "Mobile" : "Desktop",
    };
  }

  /**
   * Imprime estatísticas no console
   */
  printStats() {
    const stats = this.getStats();
    console.table(stats);
  }

  /**
   * Estima tamanho em MB do cache
   */
  estimateSize() {
    let totalBytes = 0;

    for (const [key, value] of this.cache.entries()) {
      // Aproximação: cada char em string base64 = ~1 byte
      totalBytes += (key.length + value.length) * 1;
    }

    const mb = (totalBytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  }
}

// Exporta singleton (instância única global)
const thumbnailCache = new ThumbnailCache();

// Expõe no window para debug
if (typeof window !== "undefined") {
  window.thumbnailCache = thumbnailCache;

  // Comandos úteis para debug no console:
  console.log(`
🔧 ThumbnailCache Debug Commands:
- window.thumbnailCache.getStats() - Ver estatísticas
- window.thumbnailCache.printStats() - Imprimir tabela
- window.thumbnailCache.estimateSize() - Ver tamanho em MB
- window.thumbnailCache.clear() - Limpar cache
  `);
}

export default thumbnailCache;
