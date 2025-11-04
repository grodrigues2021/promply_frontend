// src/components/ChatWorkspace.jsx - CORRIGIDO COM CLEANUP BROADCASTCHANNEL
import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Columns2, Loader2, X } from "lucide-react";
import ChatFeed from "./ChatFeed";
import ChatInput from "./ChatInput";
import PromptCard from "./PromptCard";
import SaveToCategory from "./SaveToCategory";
import api from "../lib/api";
import socket from "../socket";
import { useBroadcastSync, BroadcastMessageTypes } from "../hooks/useBroadcastSync";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

export default function ChatWorkspace() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sharedPosts, setSharedPosts] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPostToSave, setSelectedPostToSave] = useState(null);
  
  // Estados dos modais de mídia
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  
  // Controle de scroll do chat
  const [chatHasNewMessages, setChatHasNewMessages] = useState(false);
  const [chatUserScrolled, setChatUserScrolled] = useState(false);
  const chatFeedRef = useRef(null);

  // Broadcast Sync
  const handleBroadcastMessage = useCallback((message) => {
    console.log('📡 Recebido na janela destacada:', message);
    
    switch (message.type) {
      case BroadcastMessageTypes.CHAT_MESSAGE_SENT:
        console.log('💬 Nova mensagem - Atualizando chat...');
        setRefreshTrigger((prev) => prev + 1);
        window.toast?.success('💬 Nova mensagem!');
        break;
        
      case BroadcastMessageTypes.PROMPT_SHARED:
        console.log('✨ Prompt compartilhado - Atualizando sidebar...');
        loadSharedPrompts();
        window.toast?.success('✨ Novo prompt compartilhado!');
        break;
        
      case BroadcastMessageTypes.PROMPT_SAVED:
        console.log('💾 Prompt salvo - Atualizando...');
        loadSharedPrompts();
        break;
        
      default:
        console.log('📨 Mensagem não tratada:', message.type);
    }
  }, []);

  useBroadcastSync(handleBroadcastMessage);

  // ✅ CRÍTICO: Enviar sinal quando janela fechar
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🚪 Janela destacada fechando - enviando sinal...');
      const channel = new BroadcastChannel('promply-chat-status');
      channel.postMessage({ type: 'chat-closed' });
      channel.close();
    };

    const handleUnload = () => {
      console.log('🚪 Janela destacada fechada completamente');
      const channel = new BroadcastChannel('promply-chat-status');
      channel.postMessage({ type: 'chat-closed' });
      channel.close();
    };

    // Registrar ambos os eventos para garantir
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    // Enviar sinal de que a janela está aberta
    const channel = new BroadcastChannel('promply-chat-status');
    channel.postMessage({ type: 'chat-detached' });
    console.log('✅ Sinal "chat-detached" enviado');
    channel.close();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // Configuração inicial da página
  useEffect(() => {
    document.body.style.margin = 0;
    document.body.style.background = "#fff";
    document.body.style.overflow = "hidden";
    document.title = "Promply Chat - Janela Destacada";
    
    return () => {
      document.body.style.overflow = "auto";
      document.title = "Promply";
    };
  }, []);

  // Carregar prompts compartilhados
  const loadSharedPrompts = useCallback(async () => {
    try {
      setLoadingShared(true);
      const res = await api.get("/chat/posts?limit=200");
      if (res.data?.success) {
        console.log('📥 Posts recebidos (janela destacada):', res.data.data.length);
        
        const posts = res.data.data.filter((p) => p.shared_prompt);
        posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSharedPosts(posts);
        console.log('📊 Sidebar destacada atualizada:', posts.length, 'prompts');
      } else {
        setSharedPosts([]);
      }
    } catch (err) {
      console.error("Erro ao carregar prompts compartilhados:", err);
      setSharedPosts([]);
    } finally {
      setLoadingShared(false);
    }
  }, []);

  // WebSocket Listeners
  useEffect(() => {
    console.log('🔌 ChatWorkspace: Conectando listeners WebSocket...');

    loadSharedPrompts();

    const handlePromptShared = (data) => {
      console.log('🎯 WebSocket (janela destacada): Prompt compartilhado!', data);
      
      if (!data?.post) return;
      
      setSharedPosts((prev) => {
        const exists = prev.some((p) => p.id === data.post.id);
        if (exists) return prev;
        
        const updated = [data.post, ...prev].slice(0, 50);
        console.log('✅ Post adicionado à sidebar (destacada):', data.post.id);
        return updated;
      });
    };

    const handleNewMessage = (data) => {
      console.log('📨 WebSocket (janela destacada): Nova mensagem');
      
      if (data.message?.shared_prompt) {
        setSharedPosts((prev) => {
          const exists = prev.some((p) => p.id === data.message.id);
          if (exists) return prev;
          
          const updated = [data.message, ...prev].slice(0, 50);
          console.log('✅ Mensagem adicionada à sidebar (destacada):', data.message.id);
          return updated;
        });
      }
    };

    socket.on('prompt_shared', handlePromptShared);
    socket.on('new_message', handleNewMessage);

    console.log('✅ Listeners WebSocket registrados na janela destacada!');

    return () => {
      console.log('🔌 ChatWorkspace: Removendo listeners WebSocket...');
      socket.off('prompt_shared', handlePromptShared);
      socket.off('new_message', handleNewMessage);
    };
  }, [loadSharedPrompts]);

  const handleMessageSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const scrollChatToBottom = () => {
    setChatUserScrolled(false);
    setChatHasNewMessages(false);
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollToBottom?.(true);
    }
  };

  const handleOpenSaveModal = (post) => {
    setSelectedPostToSave(post);
    setShowSaveModal(true);
  };

  const handleSaveToCategory = async (data) => {
    try {
      const res = await api.post(`/chat/posts/${selectedPostToSave.id}/save`, data);
      if (res.data?.success) {
        window.toast?.success("✅ Prompt salvo nas suas categorias!") || alert("Prompt salvo!");
        setShowSaveModal(false);
        setSelectedPostToSave(null);
      } else {
        window.toast?.error(res.data?.message || "Erro ao salvar prompt.");
      }
    } catch (err) {
      console.error("Erro ao salvar prompt:", err);
      window.toast?.error(err.response?.data?.message || "Erro ao salvar prompt.");
    }
  };

  const handleCopyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      window.toast?.success("📋 Prompt copiado!") || alert("Prompt copiado!");
    } catch (err) {
      console.error("Erro ao copiar:", err);
      alert("Erro ao copiar prompt");
    }
  };

  return (
    <>
      <div className="flex h-screen w-screen bg-white overflow-hidden">
        {/* ÁREA PRINCIPAL DO CHAT */}
        <div className="flex-1 flex flex-col bg-[#E5DDD5]">
          {/* Header do Chat */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6" />
              <div>
                <h2 className="font-semibold text-lg">Chat da Comunidade</h2>
                <p className="text-xs text-blue-100">Converse e compartilhe prompts</p>
              </div>
            </div>
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
        </div>

        {/* SIDEBAR DE PROMPTS COMPARTILHADOS */}
        <div className="w-[520px] flex flex-col bg-gradient-to-b from-purple-50 to-white border-l border-gray-200 shadow-lg">
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-100 to-indigo-100 sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-1">
              <Columns2 className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Prompts Compartilhados</h3>
            </div>
            <p className="text-xs text-gray-600">
              Prompts públicos da comunidade ({sharedPosts.length})
            </p>
          </div>

          {/* Lista de Prompts */}
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
                <p className="text-sm text-gray-500 font-medium">Nenhum prompt compartilhado ainda</p>
                <p className="text-xs text-gray-400 mt-1">Seja o primeiro a compartilhar!</p>
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
                        console.log('🖼️ Abrindo imagem:', url);
                        setSelectedImage({ url, title });
                        setIsImageModalOpen(true);
                      }}
                      onOpenVideo={(url) => {
                        console.log('🎬 Abrindo vídeo:', url);
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
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-white z-[9999]">
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

      {/* Modal de Vídeo */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black z-[9999]">
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
}