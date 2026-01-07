// src/components/ChatFeed.jsx - SCROLL INTELIGENTE COMPLETO
// ✅ CORRIGIDO: Mensagens próprias sempre rolam / Mensagens de outros respeitam leitura
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';
import ChatMessage from './ChatMessage';
import api from '../lib/api';
import { getUserColor } from '../utils/chatUtils';
import { socket } from "../socket";
import { useBroadcastSync, BroadcastMessageTypes } from '../hooks/useBroadcastSync';

/**
 * Feed de conversas - Com WebSocket, Fallback e Scroll Inteligente
 * ✅ CORRIGIDO: Mensagens próprias sempre rolam, mensagens de outros respeitam leitura
 */
const ChatFeed = forwardRef(({ refreshTrigger, onScrollStateChange }, ref) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousPostsCount = useRef(0);
  const typingTimers = useRef({});
  const pollingIntervalRef = useRef(null);

  // ✅ Pega ID do usuário atual ao montar componente
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        console.log('👤 Usuário atual ID:', user.id);
      } catch (e) {
        console.error('❌ Erro ao pegar user ID:', e);
      }
    }
  }, []);

  // ✅ Verifica se usuário está no fundo da página
  const isUserAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Considera "no fundo" se estiver a menos de 100px do final
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // 📜 SCROLL INTELIGENTE
  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
      setUserScrolled(false);
    }
  }, [userScrolled]);

  // ✅ Expõe função para o componente pai
  useImperativeHandle(ref, () => ({
    scrollToBottom: (force = false) => {
      scrollToBottom(force);
    }
  }), [scrollToBottom]);

  // 👀 DETECTA SE USUÁRIO ROLOU PRA CIMA
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const atBottom = isUserAtBottom();

    // Usuário saiu do fundo
    if (!atBottom && !userScrolled) {
      setUserScrolled(true);
      console.log('👆 Usuário rolou para cima - auto-scroll desativado');
    }
    
    // Usuário voltou ao fundo
    if (atBottom && userScrolled) {
      setUserScrolled(false);
      setHasNewMessages(false);
      console.log('👇 Usuário voltou ao fundo - auto-scroll reativado');
    }
  }, [userScrolled, isUserAtBottom]);

  // ✅ Notifica mudanças no estado
  useEffect(() => {
    if (onScrollStateChange) {
      onScrollStateChange(userScrolled, hasNewMessages);
    }
  }, [userScrolled, hasNewMessages, onScrollStateChange]);

  // 🆕 Nova mensagem recebida - COM DETECÇÃO DE AUTOR
  const handleNewMessage = useCallback((message) => {
    console.log("🔥 Processando nova mensagem:", message);
    
    setPosts(prev => {
      // Evitar duplicatas
      if (prev.some(p => p.id === message.id)) {
        console.log("⚠️ Mensagem duplicada ignorada:", message.id);
        return prev;
      }
      console.log("✅ Mensagem adicionada ao estado");
      return [...prev, message];
    });

    // ✅ NOVA LÓGICA: Verifica se mensagem é do usuário atual
    const isMyMessage = message.author?.id === currentUserId;

    if (isMyMessage) {
      // 🟢 MENSAGEM PRÓPRIA: Sempre rolar automaticamente
      console.log('📤 Mensagem própria - rolando automaticamente');
      setTimeout(() => scrollToBottom(true), 100);
    } else {
      // 🟡 MENSAGEM DE OUTRO: Aplicar lógica inteligente
      if (!userScrolled && isUserAtBottom()) {
        // Usuário está no fundo - rolar
        console.log('📥 Mensagem de outro - usuário no fundo - rolando');
        setTimeout(() => scrollToBottom(), 100);
      } else if (userScrolled) {
        // Usuário está lendo mensagens antigas - mostrar badge
        console.log('📬 Mensagem de outro - usuário lendo - mostrando badge');
        setHasNewMessages(true);
      }
    }
  }, [currentUserId, userScrolled, isUserAtBottom, scrollToBottom]);

  // 🗑️ Mensagem deletada
  const handleMessageDeleted = useCallback((messageId) => {
    setPosts(prev => prev.filter(p => p.id !== messageId));
  }, []);

  // ⌨️ Usuário digitando
  const handleUserTyping = useCallback((userId, userName) => {
    setTypingUsers(prev => {
      if (!prev.find(u => u.id === userId)) {
        return [...prev, { id: userId, name: userName }];
      }
      return prev;
    });

    // Remove após 3 segundos de inatividade
    if (typingTimers.current[userId]) {
      clearTimeout(typingTimers.current[userId]);
    }

    typingTimers.current[userId] = setTimeout(() => {
      handleUserStoppedTyping(userId);
    }, 3000);
  }, []);

  // ⌨️ Usuário parou de digitar
  const handleUserStoppedTyping = useCallback((userId) => {
    setTypingUsers(prev => prev.filter(u => u.id !== userId));
    if (typingTimers.current[userId]) {
      clearTimeout(typingTimers.current[userId]);
      delete typingTimers.current[userId];
    }
  }, []);

  // ✅ fetchPosts – Carregar mensagens
  const fetchPosts = useCallback(async (shouldScroll = false) => {
    try {
      setError(null);

      const response = await api.get('/chat/posts');
      const newPosts = response.data?.data || [];

      if (Array.isArray(newPosts)) {
        // ✅ NOVA LÓGICA: Detecta se última mensagem é do usuário atual
        const lastPost = newPosts[newPosts.length - 1];
        const isLastPostMine = lastPost && lastPost.author?.id === currentUserId;

        setPosts(newPosts);
        console.log("📬 Mensagens atualizadas:", newPosts.length);

        // Se última mensagem é minha, sempre rolar
        if (isLastPostMine && newPosts.length > previousPostsCount.current) {
          console.log('📤 Última mensagem é minha - rolando automaticamente');
          setTimeout(() => scrollToBottom(true), 100);
        }
        // Senão, aplicar lógica inteligente
        else if (shouldScroll && !userScrolled && isUserAtBottom()) {
          setTimeout(() => scrollToBottom(), 100);
        } else if (newPosts.length > previousPostsCount.current && userScrolled) {
          // Nova mensagem de outro usuário, mas estou lendo - mostra badge
          setHasNewMessages(true);
        }

        previousPostsCount.current = newPosts.length;
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar mensagens:', err);
      setError(err.response?.data?.message || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, userScrolled, isUserAtBottom, scrollToBottom]);

  // 🔥 BROADCAST SYNC - Escuta notificações de outras janelas
  const handleBroadcastMessage = useCallback((message) => {
    console.log('📡 [ChatFeed] Mensagem recebida via Broadcast:', message);
    
    switch (message.type) {
      case BroadcastMessageTypes.CHAT_MESSAGE_SENT:
        console.log('💬 [ChatFeed] Nova mensagem detectada - Recarregando...');
        // ✅ CORREÇÃO: fetchPosts vai detectar se é mensagem própria
        fetchPosts(false);
        break;
        
      case BroadcastMessageTypes.PROMPT_SHARED:
        console.log('✨ [ChatFeed] Prompt compartilhado - Recarregando chat...');
        // ✅ CORREÇÃO: fetchPosts vai detectar se é mensagem própria
        fetchPosts(false);
        break;
        
      default:
        break;
    }
  }, [fetchPosts]);

  // Conecta ao BroadcastChannel
  useBroadcastSync(handleBroadcastMessage);

  // 🔐 AUTENTICAÇÃO NO WEBSOCKET
  useEffect(() => {
    if (socket.connected) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log("🔐 Autenticando no WebSocket:", user.name);
          
          socket.emit('authenticate', {
            userId: user.id,
            userName: user.name
          });

          socket.once('authenticated', (data) => {
            console.log("✅ Autenticado no WebSocket:", data);
          });
        } catch (e) {
          console.error("❌ Erro ao autenticar:", e);
        }
      }
    }
  }, [socket.connected]);

  // 📡 MONITORAMENTO DE CONEXÃO WEBSOCKET
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ WebSocket conectado");
      setIsSocketConnected(true);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log("⏸️ Polling desativado (WebSocket ativo)");
      }

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          socket.emit('authenticate', {
            userId: user.id,
            userName: user.name
          });
        } catch (e) {
          console.error("❌ Erro ao autenticar:", e);
        }
      }
    };

    const handleDisconnect = () => {
      console.log("❌ WebSocket desconectado");
      setIsSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.error("❌ Erro de conexão WebSocket:", error);
      setIsSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  // ⚠️ FALLBACK: Polling quando WebSocket desconectar
  useEffect(() => {
    const shouldPoll = !isSocketConnected;
    
    if (shouldPoll && !loading) {
      console.log("🔄 Polling ativo a cada 5 segundos");
      
      pollingIntervalRef.current = setInterval(() => {
        console.log("🔄 Polling: Verificando novas mensagens...");
        fetchPosts(false);
      }, 5000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [loading, isSocketConnected, fetchPosts]);

  // 🧠 EVENTOS DO WEBSOCKET
  useEffect(() => {
    socket.on("new_message", (data) => {
      console.log("📩 Nova mensagem recebida via WebSocket:", data);
      if (data && data.message) {
        handleNewMessage(data.message);
      }
    });

    socket.on("prompt_shared", (data) => {
      console.log("✨ Prompt compartilhado por outro usuário via WebSocket:", data);
      fetchPosts(false);
    });

    socket.on("message_deleted", (data) => {
      console.log("🗑️ Mensagem deletada:", data);
      handleMessageDeleted(data.messageId);
    });

    socket.on("user_typing", (data) => {
      handleUserTyping(data.userId, data.userName);
    });

    socket.on("user_stopped_typing", (data) => {
      handleUserStoppedTyping(data.userId);
    });

    return () => {
      socket.off("new_message");
      socket.off("prompt_shared");
      socket.off("message_deleted");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, [handleNewMessage, handleMessageDeleted, handleUserTyping, handleUserStoppedTyping, fetchPosts]);

  // ✅ Scroll inicial APENAS na primeira carga
  useEffect(() => {
    if (posts.length > 0 && previousPostsCount.current === 0) {
      console.log('📜 Primeira carga - scrolling para o fundo');
      setTimeout(() => scrollToBottom(true), 200);
      previousPostsCount.current = posts.length;
    }
  }, [posts.length, scrollToBottom]);

  const handlePostUpdate = useCallback(() => {
    fetchPosts(false);
  }, [fetchPosts]);

  // 🚀 Carrega mensagens iniciais ao montar o componente
  useEffect(() => {
    console.log("[INIT] Carregando mensagens recentes...");
    fetchPosts(false);
  }, [fetchPosts]);

  // 🔄 Atualiza quando refreshTrigger mudar
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("[REFRESH] Trigger acionado, recarregando...");
      const shouldScroll = !userScrolled && isUserAtBottom();
      fetchPosts(shouldScroll);
    }
  }, [refreshTrigger, fetchPosts, userScrolled, isUserAtBottom]);

  // 🎨 Memoizar posts processados
  const processedPosts = useMemo(() => {
    return posts
      .filter((p) => p && p.id && p.author)
      .map((post) => ({
        ...post,
        userColor: getUserColor(post.author?.id || 0),
      }));
  }, [posts]);

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#E5DDD5]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#E5DDD5]">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-2">Erro ao carregar chat</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchPosts(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#E5DDD5]">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-gray-700 text-lg font-medium mb-2">
            Nenhuma mensagem ainda
          </p>
          <p className="text-gray-600 text-sm">
            Seja o primeiro a iniciar uma conversa!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ✅ INDICADOR DE CONEXÃO */}
      {!isSocketConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
          <WifiOff className="w-4 h-4" />
          <span>Conexão em tempo real indisponível - Usando modo fallback</span>
        </div>
      )}
     
      {/* 📜 Área de mensagens */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#E5DDD5]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        {/* Data de hoje */}
        <div className="flex justify-center mb-4 sticky top-0 z-10">
          <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs text-gray-700 shadow-sm font-medium">
            {new Date().toLocaleDateString('pt-BR', { 
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Mensagens */}
        {processedPosts.map((post) => {
          if (!post || !post.id || !post.author) {
            return null;
          }

          return (
            <ChatMessage
              key={post.id}
              post={post}
              userColor={post.userColor}
              onUpdate={handlePostUpdate}
            />
          );
        })}

        {/* Indicador de digitação */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].name} está digitando...`
                : `${typingUsers.length} pessoas estão digitando...`}
            </span>
          </div>
        )}

        {/* Elemento invisível para scroll */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

ChatFeed.displayName = 'ChatFeed';

export default ChatFeed;
