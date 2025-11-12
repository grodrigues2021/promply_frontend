import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      if (!data.success) throw new Error("Falha ao carregar categorias");
      return {
        my: data.categories || [],
        templates: data.templates || [],
      };
    },
  });
}
