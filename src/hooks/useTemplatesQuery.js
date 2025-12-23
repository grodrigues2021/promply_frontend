// ==========================================
// src/hooks/useTemplatesQuery.js
// ✅ CACHE PARA TEMPLATES COM CORREÇÃO DE THUMBNAILS
// ==========================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import thumbnailCache from "../lib/thumbnailCache";

// ===================================================
// 🔵 HOOK: Buscar Templates
// ===================================================
export function useTemplatesQuery() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data } = await api.get("/templates");
      if (!data.success) throw new Error("Falha ao carregar templates");
      return data.data;
    },
    // ✅ CACHE: Dados ficam "fresh" por 5 minutos
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// ===================================================
// 🟢 MUTATION: Criar Template
// ===================================================
export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData }) => {
      console.log("📤 Criando template...");

      const { data } = await api.post("/templates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar template");
      }

      console.log("✅ Template criado:", data);
      return data.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },

    onError: (error) => {
      console.error("❌ Erro ao criar template:", error);
    },
  });
}

// ===================================================
// 🟡 MUTATION: Atualizar Template
// ===================================================
export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      console.log("🔄 Atualizando template:", id);

      const { data } = await api.put(`/templates/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.success) {
        throw new Error(data.error || "Erro ao atualizar template");
      }

      console.log("✅ Template atualizado:", data);
      return data.data;
    },

    onSuccess: (updatedTemplate) => {
      queryClient.setQueryData(["templates"], (old) => {
        if (!old) return [updatedTemplate];

        return old.map((t) => {
          if (t.id !== updatedTemplate.id) return t;

          return {
            ...t,
            ...updatedTemplate,
            category:
              updatedTemplate.category !== undefined
                ? updatedTemplate.category
                : t.category,
          };
        });
      });

      queryClient.invalidateQueries({ queryKey: ["stats"] });
      console.log("✅ Template atualizado no cache!");
    },

    onError: (error) => {
      console.error("❌ Erro ao atualizar template:", error);
    },
  });
}

// ===================================================
// 🔴 MUTATION: Deletar Template
// ===================================================
export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId) => {
      const { data } = await api.delete(`/templates/${templateId}`);

      if (!data.success) {
        throw new Error(data.error || "Erro ao deletar template");
      }

      return templateId;
    },

    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ["templates"] });

      const previousTemplates = queryClient.getQueryData(["templates"]);

      queryClient.setQueryData(["templates"], (old) => {
        return old?.filter((t) => t.id !== templateId) || [];
      });

      console.log("🗑️ Template removido otimisticamente:", templateId);

      return { previousTemplates };
    },

    onError: (error, variables, context) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(["templates"], context.previousTemplates);
        console.log("🔙 Rollback - template restaurado");
      }
      console.error("❌ Erro ao deletar template:", error);
    },

    onSuccess: (templateId) => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      console.log("✅ Template deletado:", templateId);
    },
  });
}

// ===================================================
// ⭐ MUTATION: Toggle Favorito
// ===================================================
export function useToggleFavoriteTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId) => {
      const { data } = await api.post(`/templates/${templateId}/favorite`);

      if (!data.success) {
        throw new Error("Erro ao atualizar favorito");
      }

      return data; // Retorna { is_favorite, favorites_count }
    },

    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ["templates"] });

      const previousTemplates = queryClient.getQueryData(["templates"]);

      queryClient.setQueryData(["templates"], (old) => {
        return (
          old?.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  is_favorite: !t.is_favorite,
                  favorites_count:
                    (t.favorites_count || 0) + (t.is_favorite ? -1 : 1),
                }
              : t
          ) || []
        );
      });

      return { previousTemplates };
    },

    onError: (error, variables, context) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(["templates"], context.previousTemplates);
      }
      console.error("❌ Erro ao toggle favorito:", error);
    },

    onSuccess: (data, templateId) => {
      // Atualizar com dados reais do servidor
      queryClient.setQueryData(["templates"], (old) => {
        return (
          old?.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  is_favorite: data.is_favorite,
                  favorites_count: data.favorites_count,
                }
              : t
          ) || []
        );
      });

      console.log("⭐ Favorito atualizado:", templateId, data.is_favorite);
    },
  });
}

// ===================================================
// 🔥 MUTATION: Usar Template (incrementa usage_count)
// ✅ CORREÇÃO: Copia thumbnail do cache do template para o prompt
// ===================================================
export function useTemplateUsageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, payload }) => {
      console.log("🔥 Usando template:", templateId);

      const { data } = await api.post(`/templates/${templateId}/use`, payload);

      if (!data.success) {
        throw new Error(data.error || "Erro ao usar template");
      }

      console.log("✅ Backend retornou prompt:", data.data);

      return { templateId, prompt: data.data };
    },

    onSuccess: ({ templateId, prompt }) => {
      console.log("🎯 onSuccess - Prompt criado:", prompt);

      // ============================================================
      // 🆕 CORREÇÃO CRÍTICA: Copiar thumbnail do template para prompt
      // ============================================================

      // PASSO 1: Verificar se backend enviou thumb_url
      if (prompt?.thumb_url && prompt?.id) {
        console.log(`💾 [BACKEND] Salvando thumb_url no cache:`);
        console.log(`   - Prompt ID: ${prompt.id}`);
        console.log(
          `   - Thumbnail URL: ${prompt.thumb_url.substring(0, 60)}...`
        );

        try {
          thumbnailCache.set(prompt.id, prompt.thumb_url);
          console.log(`✅ Thumbnail do backend salva com sucesso!`);
        } catch (error) {
          console.error(`❌ Erro ao salvar thumbnail do backend:`, error);
        }
      }
      // PASSO 2: Se backend não enviou, copiar do cache do template
      else if (prompt?.video_url && prompt?.id && templateId) {
        console.log(`🔄 [CACHE COPY] Backend não enviou thumb_url`);
        console.log(
          `   - Buscando thumbnail do template ${templateId} no cache...`
        );

        // Busca thumbnail do template no cache
        const templateThumbnail = thumbnailCache.get(templateId);

        if (templateThumbnail) {
          console.log(`✅ Thumbnail encontrada no cache do template!`);
          console.log(`   - Copiando para prompt ID: ${prompt.id}`);
          console.log(
            `   - Thumbnail URL: ${templateThumbnail.substring(0, 60)}...`
          );

          try {
            // Copia thumbnail do template para o prompt
            thumbnailCache.set(prompt.id, templateThumbnail);
            console.log(`✅ Thumbnail copiada com sucesso!`);

            // Verifica se salvou
            const verificacao = thumbnailCache.get(prompt.id);
            if (verificacao) {
              console.log(`✅ Verificação: thumbnail recuperada do cache`);
            } else {
              console.warn(`⚠️ Verificação falhou: thumbnail não encontrada`);
            }
          } catch (error) {
            console.error(`❌ Erro ao copiar thumbnail:`, error);
          }
        } else {
          console.warn(`⚠️ Template ${templateId} não tem thumbnail no cache`);
          console.log(`   - Frontend gerará thumbnail sob demanda`);
        }
      } else {
        console.warn("⚠️ Prompt não tem vídeo ou dados incompletos:", {
          prompt_id: prompt?.id,
          thumb_url: prompt?.thumb_url,
          video_url: prompt?.video_url,
        });
      }

      // ============================================================
      // 📊 Atualizar contadores no cache
      // ============================================================

      // Incrementar usage_count do template
      queryClient.setQueryData(["templates"], (old) => {
        return (
          old?.map((t) =>
            t.id === templateId
              ? { ...t, usage_count: (t.usage_count || 0) + 1 }
              : t
          ) || []
        );
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });

      console.log("✅ Template usado, usage_count incrementado:", templateId);
    },

    onError: (error) => {
      console.error("❌ Erro ao usar template:", error);
    },
  });
}
