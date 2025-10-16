import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import api from '../lib/api';

const ChatFeed = ({ refreshTrigger }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Scroll para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPosts = async () => {
    try {
      setError(null);
      const response = await api.get('/chat/posts');
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setPosts(response.data.data);
        
        // Scroll automático após carregar
        setTimeout(scrollToBottom, 100);
      } else {
        console.warn('Resposta inesperada da API:', response.data);
        setPosts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err.response?.data?.message || 'Erro ao carregar mensagens. Tente novamente.');
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  };

  // Carregar posts ao montar
  useEffect(() => {
    fetchPosts();
  }, [refreshTrigger]);

  // Polling a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Scroll inicial
  useEffect(() => {
    if (posts.length > 0 && isFirstLoad) {
      setTimeout(scrollToBottom, 200);
    }
  }, [posts, isFirstLoad]);

  const handlePostUpdate = () => {
    fetchPosts();
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-2">Erro ao carregar chat</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            Nenhuma mensagem ainda
          </p>
          <p className="text-gray-400 text-sm">
            Seja o primeiro a compartilhar um prompt com a comunidade!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {/* Data de hoje */}
      <div className="flex justify-center mb-4">
        <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Mensagens (mais antigas primeiro) */}
      {posts.map((post) => {
        if (!post || !post.id || !post.author) {
          console.warn('Post com estrutura inválida:', post);
          return null;
        }

        return (
          <ChatMessage
            key={post.id}
            post={post}
            onUpdate={handlePostUpdate}
          />
        );
      })}

      {/* Elemento invisível para scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatFeed;