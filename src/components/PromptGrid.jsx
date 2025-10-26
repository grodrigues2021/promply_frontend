import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import PromptCard from "./PromptCard";
import { Loader2, FolderOpen } from "lucide-react";

/**
 * PromptGrid
 * Componente genérico para renderizar uma grade de cards.
 *
 * Pode receber qualquer componente de card via prop `CardComponent`,
 * permitindo reuso tanto para PromptCard (página principal)
 * quanto TemplateCard (página de templates).
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
  CardComponent = PromptCard, // 👈 permite usar outro componente de card
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

  // === GRID ANIMADO ===
  return (
    <motion.div
      layout
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="grid grid-cols-1 min-[1200px]:grid-cols-2 min-[1680px]:grid-cols-3 min-[2240px]:grid-cols-4 gap-6 auto-rows-fr"
    >
      <AnimatePresence>
        {prompts.map((prompt) => (
          <motion.div
            key={prompt.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* 👇 Usa o componente de card definido (PromptCard ou TemplateCard) */}
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
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
