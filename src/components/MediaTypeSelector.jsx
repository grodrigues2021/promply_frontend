import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, VideoIcon, TypeIcon, YoutubeIcon } from 'lucide-react';

/**
 * MediaTypeSelector - Componente para seleção do tipo de capa do prompt
 * 
 * Permite escolher entre:
 * - none: Apenas texto (usa placeholder do Promply)
 * - image: Imagem como capa
 * - video: Vídeo MP4 (disponível no preview)
 * - youtube: Link do YouTube (com thumbnail)
 */
const MediaTypeSelector = ({ onSelect, selectedType }) => {
  const mediaTypes = [
    {
      id: 'none',
      icon: TypeIcon,
      title: 'Sem Capa',
      description: 'Apenas texto, sem mídia',
      detail: 'Exibe o placeholder padrão do Promply',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'hover:bg-gray-50',
    },
    {
      id: 'image',
      icon: ImageIcon,
      title: 'Imagem',
      description: 'Adicionar foto como capa',
      detail: 'Formatos: JPG, PNG, GIF, WebP',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'hover:bg-blue-50',
    },
    {
      id: 'video',
      icon: VideoIcon,
      title: 'Vídeo MP4',
      description: 'Upload de vídeo (máx 5MB)',
      detail: 'Preview disponível no card',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'hover:bg-purple-50',
    },
    {
      id: 'youtube',
      icon: YoutubeIcon,
      title: 'YouTube',
      description: 'Link de vídeo do YouTube',
      detail: 'Thumbnail extraído automaticamente',
      color: 'from-red-500 to-red-600',
      bgColor: 'hover:bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          Escolha o tipo de capa para o card
        </h3>
        <p className="text-gray-600">
          Selecione como o seu prompt será exibido visualmente
        </p>
      </div>

      {/* Grid de Opções */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mediaTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <Card
              key={type.id}
              className={`
                cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'ring-2 ring-offset-2 ring-purple-500 shadow-lg scale-105' 
                  : 'hover:shadow-md'
                }
                ${type.bgColor}
              `}
              onClick={() => onSelect(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Ícone */}
                  <div className={`
                    p-3 rounded-lg bg-gradient-to-br ${type.color}
                    flex items-center justify-center
                  `}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 space-y-1">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {type.title}
                      {isSelected && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs">
                          ✓
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {type.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {type.detail}
                    </p>
                  </div>
                </div>

                {/* Preview do Card */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Preview do card:</p>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                      <div className="space-y-2">
                        {/* Simulação da capa */}
                        <div className={`
                          w-full h-32 rounded-md flex items-center justify-center
                          ${type.id === 'none' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-gray-100 border-2 border-dashed border-gray-300'
                          }
                        `}>
                          {type.id === 'none' ? (
                            <div className="text-white text-center">
                              <div className="text-2xl font-bold mb-1">💬</div>
                              <div className="text-xs">Promply</div>
                            </div>
                          ) : (
                            <Icon className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Simulação do título */}
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informação Adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              ℹ️ Importante
            </h4>
            <p className="text-sm text-blue-800">
              O tipo de capa <strong>não pode ser alterado</strong> após criar o prompt. 
              Escolha com atenção antes de continuar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaTypeSelector;