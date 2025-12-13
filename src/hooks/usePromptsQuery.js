// ==========================================
// src/hooks/usePromptsQuery.js
// ✅ VERSÃO FINAL CORRIGIDA
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
      if (!data.success) throw new Error("Falha ao carregar prompts");
      return data.data;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

// ===================================================
// 🟢 MUTATION: Criar Prompt (CORRIGIDO)
// ===================================================
export function useCreatePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ✅ CORREÇÃO: Recebe OBJETO { formData, optimisticPrompt }
    mutationFn: async ({ formData, optimisticPrompt }) => {
      console.log("📤 Enviando FormData para API...");

      // Debug do FormData
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`   - ${key}: [File] ${value.name}`);
        } else {
          console.log(`   - ${key}: ${value}`);
        }
      }

      const { data } = await api.post("/prompts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar prompt");
      }

      console.log("✅ Resposta da API:", data);
      return data.data;
    },

    onMutate: async ({ optimisticPrompt }) => {
      console.log("🔄 onMutate - Iniciando optimistic update");

      await queryClient.cancelQueries({ queryKey: ["prompts"] });

      const previousPrompts = queryClient.getQueryData(["prompts"]);

      queryClient.setQueryData(["prompts"], (old) => {
        return [optimisticPrompt, ...(old || [])];
      });

      console.log("✨ Prompt otimista adicionado:", optimisticPrompt._tempId);

      return { previousPrompts };
    },

    onSuccess: (realPrompt, { optimisticPrompt }) => {
      console.log("🔄 Substituindo otimista pelo real:", {
        tempId: optimisticPrompt._tempId,
        realId: realPrompt.id,
      });

      queryClient.setQueryData(["prompts"], (old) => {
        if (!old) return [realPrompt];

        return old.map((p) => {
          if (p._tempId === optimisticPrompt._tempId) {
            return {
              ...realPrompt,
              _skipAnimation: true,
              image_url: realPrompt.image_url || p.image_url,
              thumb_url: realPrompt.thumb_url || p.thumb_url,
              video_url: realPrompt.video_url || p.video_url,
            };
          }
          return p;
        });
      });

      console.log("✅ Prompt real inserido com sucesso!");

      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },

    onError: (error, variables, context) => {
      console.error("❌ Erro ao criar prompt:", error);

      if (context?.previousPrompts) {
        queryClient.setQueryData(["prompts"], context.previousPrompts);
        console.log("🔙 Rollback realizado - prompt otimista removido");
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

// ===================================================
// 🟡 MUTATION: Atualizar Prompt (CORRIGIDO)
// ===================================================
export function useUpdatePromptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ✅ CORREÇÃO: Recebe OBJETO { id, formData }
    mutationFn: async ({ id, formData }) => {
      console.log("📝 Atualizando prompt:", id);

      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`   - ${key}: [File] ${value.name}`);
        } else {
          console.log(`   - ${key}: ${value}`);
        }
      }

      const { data } = await api.put(`/prompts/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.success) {
        throw new Error(data.error || "Erro ao atualizar prompt");
      }

      console.log("✅ Prompt atualizado:", data);
      return data.data;
    },

    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["prompts"] });
      const previousPrompts = queryClient.getQueryData(["prompts"]);

      return { previousPrompts };
    },

    onSuccess: (updatedPrompt) => {
      queryClient.setQueryData(["prompts"], (old) => {
        if (!old) return [updatedPrompt];

        return old.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p));
      });

      queryClient.invalidateQueries({ queryKey: ["stats"] });
      console.log("✅ Prompt atualizado:", updatedPrompt.id);
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

      queryClient.setQueryData(["prompts"], (old) => {
        return old?.filter((p) => p.id !== promptId) || [];
      });

      console.log("🗑️ Prompt removido otimisticamente:", promptId);

      return { previousPrompts };
    },

    onError: (error, variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(["prompts"], context.previousPrompts);
        console.log("🔙 Rollback - prompt restaurado");
      }
      console.error("❌ Erro ao deletar prompt:", error);
    },

    onSuccess: (promptId) => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      console.log("✅ Prompt deletado:", promptId);
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

      queryClient.setQueryData(["prompts"], (old) => {
        return (
          old?.map((p) =>
            p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p
          ) || []
        );
      });

      return { previousPrompts };
    },

    onError: (error, variables, context) => {
      if (context?.previousPrompts) {
        queryClient.setQueryData(["prompts"], context.previousPrompts);
      }
      console.error("❌ Erro ao toggle favorito:", error);
    },

    onSuccess: (updatedPrompt) => {
      console.log(
        "⭐ Favorito atualizado:",
        updatedPrompt.id,
        updatedPrompt.is_favorite
      );
    },
  });
}
