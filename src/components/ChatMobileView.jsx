// src/components/ChatMobileView.jsx - TELA CHEIA MOBILE ESTILO WHATSAPP
import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Menu, MessageSquare, Columns2, Loader2 } from "lucide-react";
import ChatFeed from "./ChatFeed";
import ChatInput from "./ChatInput";
import PromptCard from "./PromptCard";
import SaveToCategory from "./SaveToCategory";
import api from "../lib/api";
import socket from "../socket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";



const isDev = import.meta.env.MODE === "development";

const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

/**
 * 📱 CHAT MOBILE - TELA CHEIA ESTILO WHATSAPP
 * Substitui completamente a view principal
 */
export default function ChatMobileView({ onClose, onPromptSaved }) {
  // Estados do chat
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sharedPosts, setSharedPosts] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPostToSave, setSelectedPostToSave] = useState(null);
  const [chatHasNewMessages, setChatHasNewMessages] = useState(false);
  const [chatUserScrolled, setChatUserScrolled] = useState(false);
  
  // Estados de mídia
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  
  // 📱 Estado da sidebar mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const chatFeedRef = useRef(null);

  /** 🔧 Scroll inteligente */
  const scrollChatToBottom = useCallback(() => {
    setChatUserScrolled(false);
    setChatHasNewMessages(false);
    chatFeedRef.current?.scrollToBottom?.(true);
  }, []);

  /** 📋 Copiar prompt */
  const handleCopyPrompt = useCallback(async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      window.toast?.success("📋 Prompt copiado!") || alert("Prompt copiado!");
      setIsSidebarOpen(false); // Fecha sidebar após copiar
    } catch (err) {
      console.error("Erro ao copiar:", err);
      alert("Erro ao copiar prompt");
    }
  }, []);

  /** 💾 Abrir modal de salvar */
  const handleOpenSaveModal = useCallback((post) => {
    setSelectedPostToSave(post);
    setShowSaveModal(true);
    setIsSidebarOpen(false); // Fecha sidebar ao abrir modal
  }, []);

  /** 💾 Salvar prompt em categoria */
  const handleSaveToCategory = useCallback(
    async (data) => {
      try {
        const res = await api.post(`/chat/posts/${selectedPostToSave.id}/save`, data);
        if (res.data?.success) {
          window.toast?.success("✅ Prompt salvo nas suas categorias!") || alert("Prompt salvo!");
          setShowSaveModal(false);
          setSelectedPostToSave(null);
          onPromptSaved?.();
        } else {
          window.toast?.error(res.data?.message || "Erro ao salvar prompt.");
        }
      } catch (err) {
        console.error("Erro ao salvar prompt:", err);
        window.toast?.error(err.response?.data?.message || "Erro ao salvar prompt.");
      }
    },
    [selectedPostToSave, onPromptSaved]
  );

  /** 📨 Mensagem enviada */
  const handleMessageSent = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  /** 📄 Carregar prompts (API) */
  const loadSharedPrompts = useCallback(async () => {
    try {
      setLoadingShared(true);
      const res = await api.get("/chat/posts?limit=200");
      if (res.data?.success) {
        const posts = res.data.data
          .filter((p) => p.shared_prompt)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 50);
        setSharedPosts(posts);
        if (isDev) console.log("📊 Prompts carregados:", posts.length);
      } else {
        setSharedPosts([]);
      }
    } catch (err) {
      console.error("Erro ao carregar prompts:", err);
      setSharedPosts([]);
    } finally {
      setLoadingShared(false);
    }
  }, []);

  /** 🔌 WebSocket listeners */
  useEffect(() => {
    loadSharedPrompts();
    if (isDev) console.log("🔌 ChatMobileView: WebSocket listeners ativos");

    const handlePromptShared = (data) => {
      if (isDev) console.log('📨 prompt_shared recebido:', data);
      
      if (!data?.post) return;
      
      setSharedPosts((prev) => {
        const exists = prev.some((p) => p.id === data.post.id);
        if (exists) return prev;
        
        const updated = [data.post, ...prev].slice(0, 50);
        if (isDev) console.log('✅ Post adicionado à sidebar:', data.post.id);
        return updated;
      });
    };

    const handleNewMessage = (data) => {
      if (isDev) console.log('📨 new_message recebido:', data);
      
      if (data.message?.shared_prompt) {
        setSharedPosts((prev) => {
          const exists = prev.some((p) => p.id === data.message.id);
          if (exists) return prev;
          
          const updated = [data.message, ...prev].slice(0, 50);
          return updated;
        });
      }
    };

    socket.on("prompt_shared", handlePromptShared);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("prompt_shared", handlePromptShared);
      socket.off("new_message", handleNewMessage);
      if (isDev) console.log("🧹 ChatMobileView: listeners removidos");
    };
  }, [loadSharedPrompts]);

  /** 🔒 Bloquear scroll do body quando chat está aberto */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <>
      {/* 📱 TELA CHEIA MOBILE - SUBSTITUI A VIEW PRINCIPAL */}
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header Mobile - Estilo WhatsApp */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
          {/* Botão Voltar */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
            aria-label="Voltar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Título */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <MessageSquare className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Chat da Comunidade</h2>
          </div>

          {/* Botão Menu (Prompts) */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
            aria-label="Ver prompts compartilhados"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Feed de Mensagens */}
        <div className="flex-1 overflow-hidden">
          <ChatFeed
            ref={chatFeedRef}
            refreshTrigger={refreshTrigger}
            onScrollStateChange={(isScrolled, hasNew) => {
              setChatUserScrolled(isScrolled);
              setChatHasNewMessages(hasNew);
            }}
          />
        </div>

        {/* Input de Mensagem */}
        <ChatInput
          onMessageSent={handleMessageSent}
          hasNewMessages={chatHasNewMessages && chatUserScrolled}
          onScrollToBottom={scrollChatToBottom}
        />

        {/* 📱 SIDEBAR OVERLAY - Prompts Compartilhados */}
        <>
          {/* Overlay escuro */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar deslizante da direita */}
          <div
  className={`fixed top-0 left-0 h-full w-[90vw] max-w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
  }`}
>
            {/* Header da Sidebar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 border-b border-purple-200">
              <h3 className="font-semibold text-gray-900">Prompts Compartilhados</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors active:scale-95"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Contador de prompts */}
            <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
              <p className="text-xs text-gray-600">
                {loadingShared ? 'Carregando...' : `${sharedPosts.length} prompts disponíveis`}
              </p>
            </div>

            {/* Lista de Prompts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingShared ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                </div>
              ) : sharedPosts.length === 0 ? (
                <div className="text-center py-10">
                  <Columns2 className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Nenhum prompt compartilhado</p>
                  <p className="text-xs text-gray-400 mt-1">Seja o primeiro!</p>
                </div>
              ) : (
                sharedPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all active:scale-[0.98]">
                    <PromptCard
                      prompt={post.shared_prompt}
                      authorName={post.author?.name}
                      onCopy={handleCopyPrompt}
                      onSave={() => handleOpenSaveModal(post)}
                      isInChat
                      onOpenImage={(url, title) => {
                        setSelectedImage({ url, title });
                        setIsImageModalOpen(true);
                      }}
                      onOpenVideo={(url) => {
                        setCurrentVideoUrl(url);
                        setShowVideoModal(true);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      </div>

      {/* MODAIS */}

      {/* Modal de Salvar Prompt */}
      {showSaveModal && selectedPostToSave && (
        <SaveToCategory
          isOpen={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            setSelectedPostToSave(null);
          }}
          prompt={selectedPostToSave.shared_prompt}
          onSave={handleSaveToCategory}
        />
      )}

      {/* Modal de Imagem */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 z-[100]">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base">{selectedImage?.title}</DialogTitle>
            <DialogDescription className="text-sm">Visualização da imagem</DialogDescription>
          </DialogHeader>
          <div className="p-4 flex items-center justify-center bg-gray-50 max-h-[60vh] overflow-auto">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-2 p-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsImageModalOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = selectedImage?.url;
                link.download = `${selectedImage?.title || "imagem"}.png`;
                link.click();
              }}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vídeo */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-[95vw] p-0 bg-black z-[100]">
          <div className="relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-2 right-2 z-50 p-2 bg-black/50 rounded-full active:scale-95"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {currentVideoUrl && (
              <>
                {(currentVideoUrl.includes("youtube.com") || currentVideoUrl.includes("youtu.be")) ? (
                  <div className="relative pt-[56.25%]">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(currentVideoUrl)}?autoplay=1`}
                      title="YouTube player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video src={currentVideoUrl} controls autoPlay className="w-full" />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
