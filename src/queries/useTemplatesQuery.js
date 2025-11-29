// src/queries/useTemplatesQuery.js

import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";

/**
 * Hook responsável por buscar apenas os templates.
 * Agora o backend NÃO retorna mais categorias nessa rota.
 *
 * Retorna:
 * {
 *    templates: [],
 *    total: number,
 *    success: true | false
 * }
 */

export default function useTemplatesQuery() {
  return useQuery({
    queryKey: ["templates"],

    queryFn: async () => {
      const res = await api.get("/templates");

      return {
        templates: res.data?.data || [], // lista de templates
        total: res.data?.total ?? 0, // total retornado pelo backend
        success: res.data?.success ?? true,
      };
    },

    // Cache profissional de 5 minutos
    staleTime: 5 * 60 * 1000,
  });
}
