// ==========================================
// src/components/MediaTypeSelectorModal.jsx
// ✅ VERSÃO FINAL - Apenas 3 opções
// ==========================================

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Image as ImageIcon, Video, Youtube, X } from 'lucide-react';

const MediaTypeSelectorModal = ({ isOpen, onClose, onSelect, currentType = 'none' }) => {
  const mediaTypes = [
    {
      id: 'image',
      icon: ImageIcon,
      title: 'Imagem',
      description: 'Foto como capa',
      detail: 'JPG, PNG, GIF, WebP',
      color: 'from-blue-500 to-blue-600',
      bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    },
    {
      id: 'video',
      icon: Video,
      title: 'Vídeo MP4',
      description: 'Upload de vídeo',
      detail: 'Máximo 20MB',
      color: 'from-purple-500 to-purple-600',
      bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    },
    {
      id: 'youtube',
      icon: Youtube,
      title: 'YouTube',
      description: 'Link do vídeo',
      detail: 'Thumbnail extraído automaticamente',
      color: 'from-red-500 to-red-600',
      bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ];

  const handleSelect = (typeId) => {
    onSelect(typeId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-purple-200 dark:border-purple-800 shadow-2xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white pr-10">
            📎 Escolha o tipo de capa
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selecione como o seu prompt será exibido visualmente
          </p>
          
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {mediaTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = currentType === type.id;

            return (
              <Card
                key={type.id}
                className={`
                  cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'ring-2 ring-offset-2 ring-purple-500 shadow-lg scale-105' 
                    : 'hover:shadow-md hover:scale-102'
                  }
                  ${type.bgHover}
                `}
                onClick={() => handleSelect(type.id)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`
                      p-4 rounded-xl bg-gradient-to-br ${type.color}
                      flex items-center justify-center
                      shadow-lg
                      ${isSelected ? 'scale-110' : ''}
                      transition-transform duration-200
                    `}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        {type.title}
                        {isSelected && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500 text-white text-xs animate-pulse">
                            ✓
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {type.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {type.detail}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-full pt-2 border-t border-purple-200 dark:border-purple-700">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          ✨ Selecionado
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">
                Importante
              </h5>
              <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                O tipo de capa <strong>não pode ser alterado</strong> após criar o prompt. 
                Você poderá editar a capa escolhida, mas não mudar de tipo.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
            💡 <strong>Dica:</strong> Se não quiser capa, basta fechar este modal e salvar. 
            O card usará o placeholder padrão do Promply.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaTypeSelectorModal;