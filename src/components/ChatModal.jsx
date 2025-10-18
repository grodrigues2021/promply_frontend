import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import ChatFeed from './ChatFeed';
import ChatInput from './ChatInput';

const ChatModal = ({ isOpen, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    
    if (isDragging || isResizing) {
      const handleMouseMove = (e) => {
        if (isDragging && !isMaximized) {
          setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
          });
        }
        if (isResizing) {
          setSize({
            width: Math.max(400, e.clientX - position.x),
            height: Math.max(300, e.clientY - position.y)
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
    }
  }, [isOpen, isDragging, isResizing, isMaximized, dragStart.x, dragStart.y, position.x, position.y]);

  const handleMouseDownDrag = (e) => {
    if (isMaximized) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleMessageSent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isOpen) return null;

  const modalStyle = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0
      }
    : {
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`
      };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        style={modalStyle}
        className="bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white cursor-move select-none"
          onMouseDown={handleMouseDownDrag}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Chat da Comunidade</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMaximize}
              className="p-1.5 hover:bg-white/20 rounded transition"
              type="button"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded transition"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feed de mensagens */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatFeed refreshTrigger={refreshTrigger} />
        </div>

        {/* Input fixo no rodapé */}
        <ChatInput onMessageSent={handleMessageSent} />

        {/* Handle de redimensionar */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
            }}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #cbd5e0 50%)'
            }}
          />
        )}
      </div>
    </>
  );
};

export default ChatModal;
