import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function usePromptsQuery() {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data } = await api.get("/prompts");
      if (!data.success) throw new Error("Falha ao carregar prompts");
      return data.data;
    },
  });
}
