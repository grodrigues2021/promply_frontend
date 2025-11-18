import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useTemplatesQuery() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await api.get("/templates");
      return res.data?.data || [];
    },

    staleTime: 1000 * 60 * 5, // 5 min - cache fresco
    gcTime: 1000 * 60 * 20, // mantém cache por 20 min
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
