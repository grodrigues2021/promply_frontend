// src/components/ChatContainer.jsx - GERENCIADOR DE NAVEGAÇÃO MOBILE/DESKTOP
import React from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import ChatModal from "./ChatModal";
import ChatMobileView from "./ChatMobileView";

/**
 * Container inteligente que decide como renderizar o chat
 * - Mobile: Tela cheia que substitui a view principal
 * - Desktop: Modal flutuante
 */
export default function ChatContainer({ isOpen, onClose, onPromptSaved }) {
  
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  // 📱 MOBILE: Renderiza tela cheia
  if (isMobile) {
    return (
      <ChatMobileView 
        onClose={onClose} 
        onPromptSaved={onPromptSaved}
      />
    );
  }

  // 🖥️ DESKTOP: Renderiza modal
  return (
    <ChatModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onPromptSaved={onPromptSaved}
    />
  );
}
