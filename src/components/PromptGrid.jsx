import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PromptCard from "./PromptCard";
import { Loader2, FolderOpen } from "lucide-react";

/**
 * PromptGrid - Otimizado para Optimistic Updates
 * Componente genérico para renderizar uma grade de cards.
 */
export default function PromptGrid({
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

  // === GRID OTIMIZADO SEM PISCAR ===
  return (
    <div className="grid grid-cols-1 min-[1200px]:grid-cols-2 min-[1680px]:grid-cols-3 min-[2240px]:grid-cols-4 gap-6 auto-rows-fr">
      <AnimatePresence mode="sync" initial={false}>
        {prompts.map((prompt, index) => {
          // ✅ Usa título+índice como chave estável para evitar piscar
          // Quando o ID temporário vira real, o título permanece o mesmo
          const stableKey = prompt._isOptimistic 
            ? `temp-${prompt.title}-${index}`
            : `prompt-${prompt.id}`;
          
          // ✅ Desabilita animação inicial para prompts otimistas
          const shouldAnimate = !prompt._isOptimistic;

          return (
            <motion.div
              key={stableKey}
              layout="position"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.15,
                ease: "easeOut"
              }}
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
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}