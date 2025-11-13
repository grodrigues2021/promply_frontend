import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ CACHE: Dados ficam "fresh" por 5 minutos
      // Isso evita refetch desnecessário ao navegar entre páginas
      staleTime: 5 * 60 * 1000, // 5 minutos

      // ✅ RETENÇÃO: Mantém dados em cache por 10 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (cacheTime no v4)

      // ✅ Não refaz request ao focar na janela
      refetchOnWindowFocus: false,

      // ✅ Não refaz request ao reconectar
      refetchOnReconnect: false,

      // ✅ CRÍTICO: Não refaz request ao montar SE já tem dados fresh
      refetchOnMount: false,

      // ✅ Retry apenas 1 vez em caso de erro
      retry: 1,
    },
  },
});

console.log("⚙️ React Query: Cache otimizado ativo");
