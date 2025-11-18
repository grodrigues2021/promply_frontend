// src/components/ChatModal.jsx - CORRIGIDO COM GESTÃO BROADCASTCHANNEL
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  MessageSquare,
  ExternalLink,
  Columns2,
  Loader2,
} from "lucide-react";
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
import { useDragResize } from "../hooks/useDragResize";

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

const ChatModal = ({ isOpen, onClose, onPromptSaved }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [sharedPosts, setSharedPosts] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPostToSave, setSelectedPostToSave] = useState(null);

  const [chatHasNewMessages, setChatHasNewMessages] = useState(false);
  const [chatUserScrolled, setChatUserScrolled] = useState(false);

  const modalRef = useRef(null);
  const chatFeedRef = useRef(null);

  const {
    isMaximized,
    modalStyle,
    handleMouseDownDrag,
    handleMouseDownResize,
    toggleMaximize,
  } = useDragResize({ x: 100, y: 100 }, { width: 1400, height: 500 });

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
    } catch (err) {
      console.error("Erro ao copiar:", err);
      alert("Erro ao copiar prompt");
    }
  }, []);

  /** 💾 Abrir modal de salvar */
  const handleOpenSaveModal = useCallback((post) => {
    setSelectedPostToSave(post);
    setShowSaveModal(true);
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

  /** 🪟 Popout - Abrir em janela separada */
  const handlePopout = useCallback(() => {
    const width = window.screen.availWidth;
    const height = window.screen.availHeight;

    // Tentar abrir nova janela
    const chatWindow = window.open(
      `${window.location.origin}/chat-workspace`,
      "PromplyChatWindow",
      `width=${width},height=${height},left=0,top=0,resizable=yes,scrollbars=yes`
    );

    if (!chatWindow) {
      alert("⚠️ Pop-ups bloqueados. Permita abrir nova janela.");
      return;
    }

    // ✅ Enviar sinal de que o chat foi destacado
    console.log('🚪 Abrindo janela destacada - enviando sinal...');
    const channel = new BroadcastChannel("promply-chat-status");
    channel.postMessage({ type: "chat-detached" });
    channel.close();

    // Fechar modal principal após abrir janela
    onClose?.();
    
    if (isDev) console.log('✅ Janela destacada aberta com sucesso');
  }, [onClose]);

  /** 📨 Mensagem enviada */
  const handleMessageSent = useCallback(() => {
    // apenas atualiza o chat – não recarrega a sidebar
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

  /** 📌 WebSocket listeners */
  useEffect(() => {
    if (!isOpen) return;

    loadSharedPrompts(); // apenas uma vez ao abrir
    if (isDev) console.log("📌 ChatModal: WebSocket listeners ativos");

    const handlePromptShared = (data) => {
      if (isDev) console.log('📨 prompt_shared recebido:', data);
      
      // ✅ Agora recebemos o post completo
      if (!data?.post) return;
      
      setSharedPosts((prev) => {
        const exists = prev.some((p) => p.id === data.post.id);
        if (exists) return prev;
        
        const updated = [data.post, ...prev].slice(0, 50);
        if (isDev) console.log('✅ Post adicionado à sidebar:', data.post.id, 'Autor:', data.user?.name);
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
          if (isDev) console.log('✅ Mensagem adicionada à sidebar:', data.message.id, 'Autor:', data.message.author?.name);
          return updated;
        });
      }
    };

    socket.on("prompt_shared", handlePromptShared);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("prompt_shared", handlePromptShared);
      socket.off("new_message", handleNewMessage);
      if (isDev) console.log("🧹 ChatModal: listeners removidos");
    };
  }, [isOpen, loadSharedPrompts]);

  /** 🔄 Cleanup ao fechar modal */
  useEffect(() => {
    if (!isOpen) return;

    // Quando o modal fecha, limpar estado
    return () => {
      if (isDev) console.log('🔄 ChatModal fechado - limpando estado');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  /** 📐 Layout inalterado */

  return (

    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
    <div
  ref={modalRef}
  style={modalStyle}
  className={`
    bg-white
    z-50
    flex
    flex-col
    overflow-hidden
    shadow-2xl
    ${isMaximized
      ? "fixed inset-0 w-screen h-screen border-none rounded-none mx-0"
      : "max-w-[900px] w-full mx-auto border border-gray-200 rounded-xl"
    }
  `}
>

        {/* HEADER */}
        <div
          onMouseDown={handleMouseDownDrag}
          className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white cursor-move select-none"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6" />
            <div>
              <h2 className="font-semibold text-lg">Chat da Comunidade</h2>
              <p className="text-xs text-blue-100">Converse e compartilhe prompts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePopout}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Abrir em janela separada"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMaximize}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title={isMaximized ? "Restaurar" : "Maximizar"}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat principal */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
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
            <ChatInput
              onMessageSent={handleMessageSent}
              hasNewMessages={chatHasNewMessages && chatUserScrolled}
              onScrollToBottom={scrollChatToBottom}
            />
          </div>

          {/* Sidebar de prompts compartilhados */}
          <div className="w-[520px] flex flex-col bg-gradient-to-b from-purple-50 to-white border-l border-gray-100">
            <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-100 to-indigo-100 sticky top-0 z-10">
              <div className="flex items-center gap-2 mb-1">
                <Columns2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Prompts Compartilhados</h3>
              </div>
              <p className="text-xs text-gray-600">
                Prompts públicos da comunidade ({sharedPosts.length})
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingShared ? (
                <div className="flex justify-center py-10 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : sharedPosts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Columns2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Nenhum prompt compartilhado ainda
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Seja o primeiro a compartilhar!
                  </p>
                </div>
              ) : (
                sharedPosts.map((post) => (
                  <div key={post.id} className="relative group">
                    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md overflow-hidden">
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Handle de redimensionar */}
        {!isMaximized && (
          <div
            onMouseDown={handleMouseDownResize}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize bg-gradient-to-br from-transparent to-gray-300 rounded-tl-lg"
          />
        )}
      </div>

      {/* Modais inalterados */}
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

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-3 border-b bg-white">
            <DialogTitle className="text-lg text-gray-900">
              {selectedImage?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Visualização da imagem
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full h-full max-h-[70vh] overflow-auto bg-gray-50 flex items-center justify-center p-6">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="flex justify-end gap-2 p-6 pt-3 border-t border-gray-200 bg-white">
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                const link = document.createElement("a");
                link.href = selectedImage?.url;
                link.download = `${selectedImage?.title || "imagem"}.png`;
                link.click();
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            >
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black">
          <div className="relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            {currentVideoUrl && (
              <>
                {(currentVideoUrl.includes("youtube.com") ||
                  currentVideoUrl.includes("youtu.be")) ? (
                  <div className="relative pt-[56.25%]">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${extractYouTubeId(
                        currentVideoUrl
                      )}?autoplay=1`}
                      title="YouTube player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative pt-[56.25%]">
                    <video
                      src={currentVideoUrl}
                      controls
                      autoPlay
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatModal;