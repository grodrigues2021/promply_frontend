import React, { useMemo } from "react";
import { Loader2, FolderOpen } from "lucide-react";
import PromptCard from "./PromptCard";

/**
 * PromptGrid otimizado
 * - Mantém comportamento atual
 * - Usa React.memo para evitar re-renderizações desnecessárias
 * - Usa useMemo para memorizar a lista renderizada
 */
function PromptGrid({
  prompts = [],
  isLoading = false,
  emptyMessage = "Nenhum prompt encontrado",
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite,
  onShare,
  onOpenImage,
  onOpenVideo,
  CardComponent = PromptCard,
}) {
  // 🔹 Memoriza a renderização da lista
  const renderedGrid = useMemo(() => {
    // === Estado de carregamento ===
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Carregando...</p>
          </div>
        </div>
      );
    }

    // === Nenhum item encontrado ===
    if (!prompts || prompts.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    // === GRID COM KEYS ESTÁVEIS PARA EVITAR PISCADA ===
    return (
      <div className="grid grid-cols-1 min-[1200px]:grid-cols-2 min-[1680px]:grid-cols-3 min-[2240px]:grid-cols-4 gap-6 auto-rows-fr">
        {prompts.map((prompt) => {
          const stableKey = prompt._tempId || prompt.id;
          return (
            <div
              key={stableKey}
              className={
                prompt._skipAnimation ? "" : "animate-in fade-in duration-200"
              }
            >
              <CardComponent
                prompt={prompt}
                onEdit={onEdit}
                onDelete={onDelete}
                onCopy={onCopy}
                onToggleFavorite={onToggleFavorite}
                onShare={onShare}
                onOpenImage={onOpenImage}
                onOpenVideo={onOpenVideo}
              />
            </div>
          );
        })}
      </div>
    );
  }, [
    prompts,
    isLoading,
    emptyMessage,
    onEdit,
    onDelete,
    onCopy,
    onToggleFavorite,
    onShare,
    onOpenImage,
    onOpenVideo,
    CardComponent,
  ]);

  return renderedGrid;
}

// ✅ Evita re-renderizações desnecessárias quando props não mudam
export default React.memo(PromptGrid);
