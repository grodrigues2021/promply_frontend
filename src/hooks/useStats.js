// src/hooks/useStats.js
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

/**
 * Hook para buscar estatísticas do usuário
 * @returns {Object} Query result com dados de stats
 */
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      console.log("🔄 [useStats] Buscando estatísticas...");
      const { data } = await api.get("/stats");

      console.log("📊 [useStats] Resposta recebida:", data);

      if (!data.success) {
        throw new Error(data.error || "Falha ao carregar estatísticas");
      }

      // 🎯 Normaliza os nomes dos campos do backend
      const normalized = {
        total_prompts: data.data?.totalPrompts || data.data?.total_prompts || 0,
        total_categories:
          data.data?.totalCategories || data.data?.total_categories || 0,
        favorite_prompts:
          data.data?.favoritePrompts || data.data?.favorite_prompts || 0,
        total_generations:
          data.data?.totalGenerations || data.data?.total_generations || 0,
      };

      console.log("✅ [useStats] Stats normalizados:", normalized);
      return normalized;
    },
    staleTime: 30 * 1000, // 30 segundos (atualiza mais frequente)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export default useStats;
