// ==========================================
// src/hooks/usePromptsQuery.js
// ✅ VERSÃO CORRIGIDA - ANTI-FLICKER + YOUTUBE
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
    // ✅ onSuccess - SUBSTITUI OTIMISTA PELO REAL
    // ===================================================
    onSuccess: (realPrompt, { optimisticPrompt }) => {
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

              // 📝 MERGE INTELIGENTE DE URLS
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
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },

    // ===================================================
    // ❌ onError - ROLLBACK
    // ===================================================
    onError: (error, variables, context) => {
      console.error("❌ [onError] Erro ao criar prompt:", error);

      if (context?.previousPrompts) {
        console.log("↩️ [onError] Fazendo rollback do cache");
        queryClient.setQueryData(["prompts"], context.previousPrompts);
      }
    },
  });
}

// ===================================================
// 🟡 MUTATION: Atualizar Prompt
// ===================================================
export function useUpdatePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ✅ CORREÇÃO: Adicionar header Content-Type
      const { data: response } = await api.put(`/prompts/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (!response.success) {
        throw new Error(response.error || "Erro ao atualizar prompt");
      }
      return response.data;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });
      const previousPrompts = queryClient.getQueryData(["prompts"]);
      return { previousPrompts };
    },

    onSuccess: (updatedPrompt) => {
      queryClient.setQueryData(["prompts"], (old) => {
        if (!Array.isArray(old)) return [updatedPrompt];
        return old.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p));
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
      const { data } = await api.delete(`/prompts/${promptId}`);
      if (!data.success) {
        throw new Error(data.error || "Erro ao deletar prompt");
      }
      return promptId;
    },

    onMutate: async (promptId) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);

      queryClient.setQueryData(["prompts"], (old) =>
        Array.isArray(old) ? old.filter((p) => p.id !== promptId) : []
      );

      return { previousPrompts };
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
      const { data } = await api.post(`/prompts/${promptId}/favorite`, {});
      if (!data.success) {
        throw new Error("Erro ao atualizar favorito");
      }
      return data.data;
    },

    onMutate: async (promptId) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);

      queryClient.setQueryData(["prompts"], (old) =>
        Array.isArray(old)
          ? old.map((p) =>
              p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
            )
          : []
      );

      return { previousPrompts };
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
