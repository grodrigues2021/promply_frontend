// ==========================================
// src/hooks/usePromptsQuery.js
// ✅ VERSÃO FINAL — CORREÇÃO #4 APLICADA
// ==========================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// ===================================================
// 🔵 HOOK: Buscar Prompts
// ===================================================
export function usePromptsQuery() {
  return useQuery({
    queryKey: ["prompts"],

    queryFn: async () => {
      const { data } = await api.get("/prompts");
      if (!data.success) {
        throw new Error("Falha ao carregar prompts");
      }
      return data.data;
    },

    // 🔒 CONTROLE TOTAL DO CACHE (ANTI-FLICKER)
    staleTime: 30000, // Cache é considerado fresco por 30s
    gcTime: 5 * 60 * 1000, // Mantém cache por 5 minutos

    // ❌ DESABILITA REFETCH AUTOMÁTICO
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// ===================================================
// 🟢 MUTATION: Criar Prompt
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

    onMutate: async ({ optimisticPrompt }) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);

      queryClient.setQueryData(["prompts"], (old) => {
        const current = Array.isArray(old) ? old : [];
        return [optimisticPrompt, ...current];
      });

      return { previousPrompts };
    },

    onSuccess: (realPrompt, { optimisticPrompt }) => {
      queryClient.setQueryData(["prompts"], (old) => {
        if (!Array.isArray(old)) return [realPrompt];

        return old.map((p) => {
          if (p._tempId === optimisticPrompt._tempId) {
            const hasBlobImage = p.image_url?.startsWith("blob:");
            const hasBlobVideo = p.video_url?.startsWith("blob:");
            const hasBlobThumb = p.thumb_url?.startsWith("blob:");
            const hasMedia = hasBlobImage || hasBlobVideo || hasBlobThumb;

            return {
              ...realPrompt,
              _skipAnimation: true,
              _uploadingMedia: hasMedia,

              image_url: hasBlobImage
                ? p.image_url
                : realPrompt.image_url || "",

              thumb_url: hasBlobThumb
                ? p.thumb_url
                : realPrompt.thumb_url || "",

              video_url: hasBlobVideo
                ? p.video_url
                : realPrompt.video_url || "",
            };
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
