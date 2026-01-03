// ==========================================
// src/hooks/usePromptsQuery.js
// ✅ VERSÃO CORRIGIDA - ANTI-FLICKER + YOUTUBE + ID RESOLUTION
// ✅ Sistema de resolução de IDs temporários → reais
// 🔍 COM LOGS CRÍTICOS PARA DEBUG
// ==========================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// =========================================================
// 🔒 FLAG GLOBAL: Bloqueia refetch durante uploads
// =========================================================
let uploadingMediaCount = 0;

function startMediaUpload() {
  uploadingMediaCount++;
}

function endMediaUpload() {
  uploadingMediaCount = Math.max(0, uploadingMediaCount - 1);
}

function hasActiveUploads() {
  return uploadingMediaCount > 0;
}

// =========================================================
// 🆔 MAP GLOBAL: Rastreia IDs temporários → IDs reais
// =========================================================
const tempIdToRealIdMap = new Map();

/**
 * 🎯 Resolve ID real a partir de um ID que pode ser temporário
 * @param {string|number} id - ID que pode ser temporário ou real
 * @returns {string|number} - ID real ou o próprio ID se não for temporário
 */
export function resolveRealId(id) {
  if (!id) return id;

  const idStr = String(id);

  // Se é temporário e temos mapeamento, retorna o ID real
  if (idStr.startsWith("temp-") && tempIdToRealIdMap.has(idStr)) {
    const realId = tempIdToRealIdMap.get(idStr);
    console.log(`🔄 [resolveRealId] ${idStr} → ${realId}`);
    return realId;
  }

  // Se não é temporário ou não tem mapeamento, retorna o próprio ID
  return id;
}

/**
 * 🗑️ Remove mapeamento de ID temporário (para limpeza)
 * @param {string} tempId - ID temporário para remover
 */
export function clearTempIdMapping(tempId) {
  if (tempIdToRealIdMap.has(tempId)) {
    console.log(`🗑️ [clearTempIdMapping] Removendo ${tempId}`);
    tempIdToRealIdMap.delete(tempId);
  }
}

/**
 * 📊 Debug: Mostra todos os mapeamentos ativos
 */
export function debugTempIdMap() {
  console.table(
    [...tempIdToRealIdMap.entries()].map(([temp, real]) => ({
      temporary: temp,
      real: real,
    }))
  );
}

// ===================================================
// 🔵 HOOK: Buscar Prompts
// ===================================================
export function usePromptsQuery() {
  return useQuery({
    queryKey: ["prompts"],

    queryFn: async () => {
      // ✅ BLOQUEIO: Não refetch se há uploads ativos
      if (hasActiveUploads()) {
        throw new Error("SKIP_REFETCH_DURING_UPLOAD");
      }

      const { data } = await api.get("/prompts");

      if (!data.success) {
        throw new Error("Falha ao carregar prompts");
      }

      return data.data;
    },

    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    retry: (failureCount, error) => {
      if (error.message === "SKIP_REFETCH_DURING_UPLOAD") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// ===================================================
// 🟢 MUTATION: Criar Prompt (UNIFICADA)
// ===================================================
export function useCreatePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }) => {
      // ✅ DETECTA SE É YOUTUBE PELO PAYLOAD
      const isYouTube = Boolean(payload.youtube_url);

      let response;

      if (isYouTube) {
        // 🎥 YOUTUBE: Usa endpoint /prompts com FormData

        const formData = new FormData();
        formData.append("title", payload.title);
        formData.append("content", payload.content);
        formData.append("description", payload.description || "");
        formData.append("tags", payload.tags || "");
        formData.append("platform", payload.platform || "chatgpt");
        formData.append("youtube_url", payload.youtube_url);

        if (payload.category_id) {
          formData.append("category_id", payload.category_id);
        }

        response = await api.post("/prompts", formData);
      } else {
        // 📝 TEXTO/IMAGEM/VÍDEO: Usa endpoint /prompts/text

        response = await api.post("/prompts/text", payload);
      }

      const { data } = response;

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar prompt");
      }

      return data.data || data.prompt;
    },

    // ===================================================
    // 🧪 onMutate - INSERE PROMPT OTIMISTA
    // ===================================================
    onMutate: async ({ optimisticPrompt }) => {
      // ✅ Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      // ✅ Salva estado anterior (para rollback)
      const previousPrompts = queryClient.getQueryData(["prompts"]);

      // ✅ Insere prompt otimista no TOPO
      queryClient.setQueryData(["prompts"], (old) => {
        const current = Array.isArray(old) ? old : [];

        // 🔍 VERIFICA SE JÁ EXISTE (segurança extra)
        const exists = current.some(
          (p) => p._clientId === optimisticPrompt._clientId
        );

        if (exists) {
          console.warn(
            "⚠️ [onMutate] Prompt otimista já existe, ignorando duplicação"
          );
          return current;
        }

        return [optimisticPrompt, ...current];
      });

      return { previousPrompts };
    },

    // ===================================================
    // ✅ onSuccess - SUBSTITUI OTIMISTA PELO REAL + MAPEIA ID
    // ===================================================
    onSuccess: (realPrompt, { optimisticPrompt }) => {
      // 🆔 CRÍTICO: Mapeia ID temporário → ID real
      if (optimisticPrompt._tempId && realPrompt.id) {
        tempIdToRealIdMap.set(optimisticPrompt._tempId, realPrompt.id);
        console.log(
          `✅ [onSuccess] Mapeamento criado: ${optimisticPrompt._tempId} → ${realPrompt.id}`
        );
      }

      queryClient.setQueryData(["prompts"], (old) => {
        if (!Array.isArray(old)) {
          return [
            {
              ...realPrompt,
              _skipAnimation: true,
              _clientId: optimisticPrompt._clientId,
            },
          ];
        }

        return old.map((p) => {
          // 🎯 ENCONTRA O PROMPT OTIMISTA PELO _clientId
          if (p._clientId === optimisticPrompt._clientId) {
            // 🔍 DETECTA SE TEM BLOBS (mídia ainda não enviada)
            const hasBlobImage = p.image_url?.startsWith("blob:");
            const hasBlobVideo = p.video_url?.startsWith("blob:");
            const hasBlobThumb = p.thumb_url?.startsWith("blob:");

            // 🎯 PRESERVA THUMBNAIL DO YOUTUBE
            const isYouTube = Boolean(p.youtube_url || realPrompt.youtube_url);
            let finalThumbUrl = "";

            if (isYouTube) {
              // ✅ YouTube: preserva thumbnail otimista ou usa do backend
              finalThumbUrl = p.thumb_url || realPrompt.thumb_url || "";
              console.log(
                "🎥 [onSuccess] YouTube - thumb preservado:",
                finalThumbUrl
              );
            } else if (hasBlobThumb) {
              // ✅ Blob: mantém thumbnail local até upload completar
              finalThumbUrl = p.thumb_url;
              console.log("🖼️ [onSuccess] Blob thumb mantido:", finalThumbUrl);
            } else {
              // ✅ Backend: usa thumbnail do servidor
              finalThumbUrl = realPrompt.thumb_url || "";
              console.log("☁️ [onSuccess] Thumb do backend:", finalThumbUrl);
            }

            const mergedPrompt = {
              ...realPrompt,
              _skipAnimation: true,
              _uploadingMedia: hasBlobImage || hasBlobVideo || hasBlobThumb,
              _clientId: p._clientId,

              // 🔍 MERGE INTELIGENTE DE URLS
              image_url: hasBlobImage
                ? p.image_url
                : realPrompt.image_url || p.image_url || "",

              video_url: hasBlobVideo
                ? p.video_url
                : realPrompt.video_url || p.video_url || "",

              thumb_url: finalThumbUrl,
            };

            console.log("✅ [onSuccess] Merge completo:", {
              id: mergedPrompt.id,
              _uploadingMedia: mergedPrompt._uploadingMedia,
              thumb_url: mergedPrompt.thumb_url,
              youtube_url: mergedPrompt.youtube_url,
            });

            return mergedPrompt;
          }

          return p;
        });
      });

      // ✅ Atualiza stats
      queryClient.invalidateQueries({ queryKey: ["prompts"] });

      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },

    // ===================================================
    // ❌ onError - ROLLBACK + LIMPA MAPEAMENTO
    // ===================================================
    onError: (error, variables, context) => {
      console.error("❌ [onError] Erro ao criar prompt:", error);

      // 🗑️ Remove mapeamento em caso de erro
      if (variables?.optimisticPrompt?._tempId) {
        clearTempIdMapping(variables.optimisticPrompt._tempId);
      }

      if (context?.previousPrompts) {
        console.log("↩️ [onError] Fazendo rollback do cache");
        queryClient.setQueryData(["prompts"], context.previousPrompts);
      }
    },
  });
}

// ===================================================
// 🟡 MUTATION: Atualizar Prompt
// 🔍 VERSÃO COM LOGS CRÍTICOS PARA DEBUG
// ===================================================
export function useUpdatePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // 🆔 RESOLVE ID REAL antes de fazer requisição
      const realId = resolveRealId(id);

      console.log(
        `📝 [useUpdatePromptMutation] Atualizando prompt ${id} → ${realId}`
      );

      // ============================================================
      // 🔍 LOG CRÍTICO 1: Verificar se mutationFn foi chamada
      // ============================================================
      console.log(
        "%c🚀 [mutationFn] CHAMADA INICIADA",
        "background: orange; color: white; padding: 4px; font-weight: bold;"
      );
      console.log("  ID:", id, "→", realId);
      console.log("  Data type:", data?.constructor?.name);
      console.log("  Data is FormData?", data instanceof FormData);

      if (data instanceof FormData) {
        console.log("  FormData keys:", Array.from(data.keys()));
        console.log(
          "  FormData entries count:",
          Array.from(data.entries()).length
        );

        // Log dos valores
        for (let [key, value] of data.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}:`, value.name, value.size, "bytes");
          } else {
            console.log(`  ${key}:`, value);
          }
        }
      } else {
        console.log("  Data:", data);
      }

      console.log(
        "%c📡 [mutationFn] FAZENDO API.PUT AGORA...",
        "background: blue; color: white; padding: 4px;"
      );

      try {
        // ✅ CORREÇÃO: Adicionar header Content-Type
        const { data: response } = await api.put(`/prompts/${realId}`, data);

        console.log(
          "%c✅ [mutationFn] RESPOSTA RECEBIDA",
          "background: green; color: white; padding: 4px;"
        );
        console.log("  Success:", response.success);
        console.log("  Data:", response.data);

        if (!response.success) {
          throw new Error(response.error || "Erro ao atualizar prompt");
        }
        return response.data;
      } catch (error) {
        console.log(
          "%c❌ [mutationFn] ERRO NA REQUISIÇÃO",
          "background: red; color: white; padding: 4px;"
        );
        console.error("  Error:", error);
        console.error("  Error message:", error.message);
        console.error("  Error stack:", error.stack);
        throw error;
      }
    },

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });
      const previousPrompts = queryClient.getQueryData(["prompts"]);

      // 🆔 Resolve ID real para optimistic update
      const realId = resolveRealId(id);

      return { previousPrompts, resolvedId: realId };
    },

    onSuccess: (updatedPrompt, variables, context) => {
      queryClient.setQueryData(["prompts"], (old) => {
        if (!Array.isArray(old)) return [updatedPrompt];

        // Usa o ID resolvido do contexto ou tenta resolver novamente
        const targetId = context?.resolvedId || resolveRealId(variables.id);

        return old.map((p) => {
          // Compara tanto com ID original quanto com ID resolvido
          if (p.id === updatedPrompt.id || p.id === targetId) {
            return updatedPrompt;
          }
          return p;
        });
      });

      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },

    onError: (error, variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(["prompts"], context.previousPrompts);
      }
      console.error("❌ Erro ao atualizar prompt:", error);
    },
  });
}

// ===================================================
// 🔴 MUTATION: Deletar Prompt
// ===================================================
export function useDeletePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promptId) => {
      // 🆔 RESOLVE ID REAL antes de deletar
      const realId = resolveRealId(promptId);

      console.log(
        `🗑️ [useDeletePromptMutation] Deletando prompt ${promptId} → ${realId}`
      );

      const { data } = await api.delete(`/prompts/${realId}`);
      if (!data.success) {
        throw new Error(data.error || "Erro ao deletar prompt");
      }
      return realId;
    },

    onMutate: async (promptId) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);
      const realId = resolveRealId(promptId);

      queryClient.setQueryData(["prompts"], (old) =>
        Array.isArray(old)
          ? old.filter((p) => p.id !== promptId && p.id !== realId)
          : []
      );

      return { previousPrompts, resolvedId: realId };
    },

    onError: (error, variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(["prompts"], context.previousPrompts);
      }
      console.error("❌ Erro ao deletar prompt:", error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// ===================================================
// ⭐ MUTATION: Toggle Favorito
// ===================================================
export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promptId) => {
      // 🆔 RESOLVE ID REAL antes de favoritar
      const realId = resolveRealId(promptId);

      console.log(
        `⭐ [useToggleFavoriteMutation] Toggle favorito ${promptId} → ${realId}`
      );

      const { data } = await api.post(`/prompts/${realId}/favorite`, {});
      if (!data.success) {
        throw new Error("Erro ao atualizar favorito");
      }
      return data.data;
    },

    onMutate: async (promptId) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);
      const realId = resolveRealId(promptId);

      queryClient.setQueryData(["prompts"], (old) =>
        Array.isArray(old)
          ? old.map((p) =>
              p.id === promptId || p.id === realId
                ? { ...p, is_favorite: !p.is_favorite }
                : p
            )
          : []
      );

      return { previousPrompts, resolvedId: realId };
    },

    onError: (error, variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(["prompts"], context.previousPrompts);
      }
      console.error("❌ Erro ao toggle favorito:", error);
    },
  });
}

// ===================================================
// 📤 EXPORT: Controle de uploads
// ===================================================
export { startMediaUpload, endMediaUpload, hasActiveUploads };
