// ==========================================
// src/hooks/usePromptsQuery.js
// ✅ DEBUG ANTI-LOOPING — YOUTUBE + OPTIMISTIC
// ==========================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// =========================================================
// 🔒 FLAG GLOBAL: Bloqueia refetch durante uploads
// =========================================================
let uploadingMediaCount = 0;

function startMediaUpload() {
  uploadingMediaCount++;
  console.log(`📤 Upload iniciado (${uploadingMediaCount} em andamento)`);
}

function endMediaUpload() {
  uploadingMediaCount = Math.max(0, uploadingMediaCount - 1);
  console.log(`✅ Upload finalizado (${uploadingMediaCount} restantes)`);
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
        console.warn("⏸️ Refetch bloqueado: upload em andamento");
        throw new Error("SKIP_REFETCH_DURING_UPLOAD");
      }

      const { data } = await api.get("/prompts");

      if (!data.success) {
        throw new Error("Falha ao carregar prompts");
      }

      return data.data;
    },

    staleTime: 30000,
    gcTime: 5 * 60 * 1000,

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
// 🟢 MUTATION: Criar Prompt (ANTI-LOOPING YOUTUBE)
// ===================================================
export function useCreatePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload }) => {
      console.log("📤 Criando prompt (somente texto)...");
      const { data } = await api.post("/prompts/text", payload);

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar prompt");
      }

      return data.data || data.prompt;
    },

    // ===================================================
    // 🧪 ETAPA 2 — onMutate (PROMPT OTIMISTA)
    // ===================================================
    onMutate: async ({ optimisticPrompt }) => {
      console.log("🧪 [ETAPA 2] onMutate chamado");
      console.log("🧪 [ETAPA 2] youtube_url =", optimisticPrompt.youtube_url);
      console.log("🧪 [ETAPA 2] thumb_url =", optimisticPrompt.thumb_url);

      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);

      queryClient.setQueryData(["prompts"], (old) => {
        const current = Array.isArray(old) ? old : [];
        console.log(
          "🧪 [ETAPA 2] Inserindo no cache thumb_url =",
          optimisticPrompt.thumb_url
        );
        return [optimisticPrompt, ...current];
      });

      return { previousPrompts };
    },

    // ===================================================
    // 🧪 ETAPA 4 + 5 — onSuccess (MERGE FINAL)
    // ===================================================
    onSuccess: (realPrompt, { optimisticPrompt }) => {
      console.log("🧪 [ETAPA 4] onSuccess chamado");
      console.log("🧪 [ETAPA 4] realPrompt.id =", realPrompt?.id);
      console.log(
        "🧪 [ETAPA 4] realPrompt.youtube_url =",
        realPrompt?.youtube_url
      );
      console.log("🧪 [ETAPA 4] realPrompt.thumb_url =", realPrompt?.thumb_url);

      queryClient.setQueryData(["prompts"], (old) => {
        if (!Array.isArray(old)) {
          console.warn("🧪 Cache vazio, usando realPrompt direto");
          return [realPrompt];
        }

        return old.map((p) => {
          if (p._tempId === optimisticPrompt._tempId) {
            const hasBlobImage = p.image_url?.startsWith("blob:");
            const hasBlobVideo = p.video_url?.startsWith("blob:");
            const hasBlobThumb = p.thumb_url?.startsWith("blob:");

            console.log("🧪 [ETAPA 5] Merge", {
              optimistic_thumb: p.thumb_url,
              backend_thumb: realPrompt?.thumb_url,
              hasBlobThumb,
            });

            const mergedPrompt = {
              ...realPrompt,
              _skipAnimation: true,
              _uploadingMedia: hasBlobImage || hasBlobVideo || hasBlobThumb,
              _clientId: p._clientId,

              image_url: hasBlobImage
                ? p.image_url
                : realPrompt.image_url || p.image_url || "",

              video_url: hasBlobVideo
                ? p.video_url
                : realPrompt.video_url || p.video_url || "",

              thumb_url: hasBlobThumb
                ? p.thumb_url
                : realPrompt.thumb_url || p.thumb_url || "",
            };

            console.log(
              "🧪 [ETAPA 5] Resultado final thumb_url =",
              mergedPrompt.thumb_url
            );

            return mergedPrompt;
          }

          return p;
        });
      });

      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },

    onError: (error, variables, context) => {
      console.error("❌ Erro ao criar prompt:", error);
      if (context?.previousPrompts) {
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
      const { data: response } = await api.put(`/prompts/${id}`, data);
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
