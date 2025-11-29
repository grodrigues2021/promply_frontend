// src/queries/useCategoriesQuery.js

import { useQuery } from "@tanstack/react-query";
import api from "../lib/api.js";

export default function useCategoriesQuery() {
  return useQuery({
    queryKey: ["categories"],

    queryFn: async () => {
      const res = await api.get("/categories");
      const all = res.data?.data || [];

      console.log("🔍 TODAS as categorias:", all);
      console.log("🔍 Primeira categoria:", all[0]);

      const templateCategories = all.filter(
        (c) => c.is_template == true || c.is_template === 1
      );

      console.log("✅ Categorias filtradas:", templateCategories);

      return {
        categories: templateCategories,
        success: res.data?.success ?? true,
      };
    },

    staleTime: 5 * 60 * 1000,
  });
}
