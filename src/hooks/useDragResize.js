// src/hooks/useDragResize.js
import { useState, useEffect, useCallback } from 'react';

/**
 * 🎯 Hook para controlar drag e resize de modais
 */
export const useDragResize = (initialPosition = { x: 100, y: 100 }, initialSize = { width: 1400, height: 700 }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 🖱️ Handler de movimento do mouse
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      // 🚚 Drag
      if (isDragging && !isMaximized) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Limitar para não sair da tela
        const maxX = window.innerWidth - 200; // Deixar pelo menos 200px visível
        const maxY = window.innerHeight - 100;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
      
      // 📏 Resize
      if (isResizing) {
        const newWidth = e.clientX - position.x;
        const newHeight = e.clientY - position.y;
        
        // Limites de tamanho
        const minWidth = 900;
        const minHeight = 500;
        const maxWidth = window.innerWidth - position.x - 20;
        const maxHeight = window.innerHeight - position.y - 20;
        
        setSize({
          width: Math.max(minWidth, Math.min(newWidth, maxWidth)),
          height: Math.max(minHeight, Math.min(newHeight, maxHeight)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isMaximized, dragStart, position]);

  // 🖱️ Iniciar drag
  const handleMouseDownDrag = useCallback((e) => {
    if (isMaximized) return;
    
    // Ignorar se clicou em botões/inputs
    if (e.target.closest('button, input, textarea, select')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [isMaximized, position]);

  // 📏 Iniciar resize
  const handleMouseDownResize = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
  }, []);

  // ⛶ Alternar maximizar/restaurar
  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  // 📍 Centralizar modal
  const centerModal = useCallback(() => {
    const newX = (window.innerWidth - size.width) / 2;
    const newY = (window.innerHeight - size.height) / 2;
    
    setPosition({
      x: Math.max(0, newX),
      y: Math.max(0, newY),
    });
  }, [size]);

  // 🎨 Resetar para valores iniciais
  const reset = useCallback(() => {
    setPosition(initialPosition);
    setSize(initialSize);
    setIsMaximized(false);
  }, [initialPosition, initialSize]);

  // 📱 Ajustar para tela pequena
  const adjustForSmallScreen = useCallback(() => {
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 40;
    
    if (size.width > maxWidth || size.height > maxHeight) {
      setSize({
        width: Math.min(size.width, maxWidth),
        height: Math.min(size.height, maxHeight),
      });
    }
    
    // Reposicionar se estiver fora da tela
    const maxX = window.innerWidth - size.width - 20;
    const maxY = window.innerHeight - size.height - 20;
    
    setPosition({
      x: Math.max(20, Math.min(position.x, maxX)),
      y: Math.max(20, Math.min(position.y, maxY)),
    });
  }, [size, position]);

  // 📐 Ajustar ao redimensionar janela
  useEffect(() => {
    const handleResize = () => {
      if (!isMaximized) {
        adjustForSmallScreen();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMaximized, adjustForSmallScreen]);

  // 🎨 Estilo do modal
  const modalStyle = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        transition: 'all 0.2s ease',
      }
    : {
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
      };

  return {
    // Estados
    isMaximized,
    position,
    size,
    isDragging,
    isResizing,
    
    // Handlers
    handleMouseDownDrag,
    handleMouseDownResize,
    toggleMaximize,
    centerModal,
    reset,
    
    // Estilo
    modalStyle,
  };
};

export default useDragResize;