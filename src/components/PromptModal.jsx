import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { X, Trash2, Download, Plus, Image as ImageIcon, Video, Youtube, FileText, Tag as TagIcon, Folder, Zap, Sparkles, ArrowLeft, TypeIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

// ✅ SCROLLBAR CUSTOMIZADA
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
    transition: all 0.3s ease;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #764ba2 0%, #f093fb 100%);
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #667eea transparent;
  }

  .custom-scrollbar-inner::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar-inner::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .custom-scrollbar-inner::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-radius: 10px;
  }

  .custom-scrollbar-inner::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
  }
`;

// ⚡ ESTILOS GLASSMORPHISM ULTRA OTIMIZADOS (BOTÃO AZUL)
const glassmorphismStyles = `
  @keyframes fastFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-glass-container {
    animation: fastFadeIn 0.1s ease-out;
    background: rgba(255, 255, 255, 0.95) !important;
    border: 4px solid rgba(139, 92, 246, 0.6) !important;
    border-radius: 30px !important;
    box-shadow: 
      0 0 0 1px rgba(139, 92, 246, 0.4),
      0 0 80px 12px rgba(139, 92, 246, 0.5),
      0 20px 40px rgba(0, 0, 0, 0.2) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    max-height: 90vh !important;
  }

  .dark .modal-glass-container {
    background: rgba(15, 23, 42, 0.98) !important;
    border: 4px solid rgba(139, 92, 246, 0.7) !important;
    box-shadow: 
      0 0 0 1px rgba(139, 92, 246, 0.5),
      0 0 100px 15px rgba(139, 92, 246, 0.6),
      0 20px 40px rgba(0, 0, 0, 0.4) !important;
  }

  .glass-header {
    position: relative;
    z-index: 20;
    flex-shrink: 0;
  }

  .glass-content-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .glass-section {
    background: rgba(255, 255, 255, 0.8) !important;
    border: 1px solid rgba(226, 232, 240, 0.8) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
  }

  .dark .glass-section {
    background: rgba(30, 41, 59, 0.7) !important;
    border: 1px solid rgba(148, 163, 184, 0.3) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  }

  .glass-input {
    background: rgba(255, 255, 255, 0.95) !important;
    border: 1px solid rgba(203, 213, 225, 0.7) !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .dark .glass-input {
    background: rgba(15, 23, 42, 0.8) !important;
    border: 1px solid rgba(148, 163, 184, 0.5) !important;
  }

  .glass-content-bg {
    background: rgba(248, 250, 252, 0.6) !important;
  }

  .dark .glass-content-bg {
    background: rgba(15, 23, 42, 0.5) !important;
  }

  .close-button-glass {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 30;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(59, 130, 246, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.12s ease;
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.35);
  }

  .close-button-glass:hover {
    background: rgb(37, 99, 235);
    transform: scale(1.08) rotate(90deg);
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.5);
  }

  .close-button-glass:active {
    transform: scale(0.96) rotate(90deg);
  }

  .dark .close-button-glass {
    background: rgba(59, 130, 246, 1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 
      0 3px 10px rgba(59, 130, 246, 0.4),
      0 0 12px rgba(59, 130, 246, 0.2);
  }

  .dark .close-button-glass:hover {
    background: rgb(37, 99, 235);
    box-shadow: 
      0 5px 15px rgba(59, 130, 246, 0.6),
      0 0 20px rgba(59, 130, 246, 0.35);
  }
`;

export default function PromptModal({
  isOpen,
  onOpenChange,
  promptForm,
  setPromptForm,
  formErrors,
  setFormErrors,
  editingPrompt,
  isEditMode,
  myCategories,
  handleImageUpload,
  removeImage,
  handleVideoUpload,
  extractYouTubeId,
  getYouTubeThumbnail,
  attachments,
  removeAttachment,
  extraFiles,
  extraFilesInputRef,
  handleExtraFiles,
  removeExtraFile,
  clearAllExtraFiles,
  isSaving,
  savePrompt,
  resetPromptForm,
}) {

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  // ✅ NOVO: Estados para controle de steps e media_type
  const [step, setStep] = useState(1); // 1 = seleção tipo, 2 = formulário
  const [mediaType, setMediaType] = useState('none');
  const [thumbnailBlob, setThumbnailBlob] = useState(null);

  // ✅ NOVO: Resetar ao abrir/fechar
  useEffect(() => {
    if (isOpen && !editingPrompt) {
      // Criar novo: volta para seleção de tipo
      setStep(1);
      setMediaType('none');
    } else if (isOpen && editingPrompt) {
      // Editar existente: pula seleção, já tem tipo definido
      setStep(2);
      setMediaType(editingPrompt.media_type || 'none');
      
      // Mapear media_type para selectedMedia
      if (editingPrompt.media_type === 'image' || editingPrompt.image_url) {
        setPromptForm(prev => ({ ...prev, selectedMedia: 'image' }));
      } else if (editingPrompt.media_type === 'video' || editingPrompt.video_url) {
        setPromptForm(prev => ({ ...prev, selectedMedia: 'video' }));
      } else if (editingPrompt.media_type === 'youtube' || editingPrompt.youtube_url) {
        setPromptForm(prev => ({ ...prev, selectedMedia: 'youtube' }));
      } else {
        setPromptForm(prev => ({ ...prev, selectedMedia: 'none' }));
      }
    }
  }, [isOpen, editingPrompt]);

  // ✅ NOVO: Handler de seleção de tipo
  const handleTypeSelect = (type) => {
    setMediaType(type);
    setPromptForm(prev => ({ ...prev, selectedMedia: type }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBackStep = () => {
    if (step === 2 && !editingPrompt) {
      setStep(1);
    }
  };

  const handleMediaTypeClick = (type) => {
    setPromptForm((prev) => ({ ...prev, selectedMedia: type }));
  };

  // ✅ NOVO: Handler de upload de vídeo com thumbnail
  const handleVideoUploadWithThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('O vídeo deve ter no máximo 5MB');
      return;
    }

    // Usar a função original
    handleVideoUpload(e);

    // Gerar thumbnail no frontend
    try {
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });

      video.currentTime = Math.min(1.0, video.duration * 0.1);
      
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        setThumbnailBlob(blob);
        console.log('✅ Thumbnail gerado no frontend:', blob.size, 'bytes');
      }, 'image/jpeg', 0.85);

    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error);
    }
  };

  // ✅ NOVO: Wrapper do savePrompt que adiciona media_type
  const handleSaveWithMediaType = async () => {
    // Adicionar media_type ao promptForm antes de salvar
    const updatedForm = {
      ...promptForm,
      media_type: mediaType,
      thumbnailBlob: thumbnailBlob // Para enviar junto
    };
    
    // Chamar a função original passando o formulário atualizado
    await savePrompt(updatedForm);
  };

  // ✅ NOVO: Componente de seleção de tipo
  const MediaTypeSelector = () => {
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
        icon: Video,
        title: 'Vídeo MP4',
        description: 'Upload de vídeo (máx 5MB)',
        detail: 'Preview disponível no card',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'hover:bg-purple-50',
      },
      {
        id: 'youtube',
        icon: Youtube,
        title: 'YouTube',
        description: 'Link de vídeo do YouTube',
        detail: 'Thumbnail extraído automaticamente',
        color: 'from-red-500 to-red-600',
        bgColor: 'hover:bg-red-50',
      },
    ];

    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Escolha o tipo de capa para o card
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Selecione como o seu prompt será exibido visualmente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediaTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = mediaType === type.id;

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
                onClick={() => handleTypeSelect(type.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`
                      p-3 rounded-lg bg-gradient-to-br ${type.color}
                      flex items-center justify-center
                    `}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {type.title}
                        {isSelected && (
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs">
                            ✓
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {type.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {type.detail}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Preview do card:</p>
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                        <div className="space-y-2">
                          <div className={`
                            w-full h-32 rounded-md flex items-center justify-center
                            ${type.id === 'none' 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                              : 'bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600'
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
                          
                          <div className="space-y-1">
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                ℹ️ Importante
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                O tipo de capa <strong>não pode ser alterado</strong> após criar o prompt. 
                Escolha com atenção antes de continuar.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <style>{glassmorphismStyles}</style>
      
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="modal-glass-container max-w-7xl w-full p-0">
          
          {/* ✨ BOTÃO DE FECHAR MELHORADO */}
          <button
            onClick={() => {
              resetPromptForm();
              setStep(1);
              setMediaType('none');
              setThumbnailBlob(null);
              onOpenChange(false);
            }}
            className="close-button-glass"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6 text-white" strokeWidth={3} />
          </button>

          {/* ✨ HEADER FIXO */}
          <div className="glass-header">
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='white' stroke-opacity='0.1' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
              }}></div>
              <DialogHeader className="relative z-10 pr-12">
                <DialogTitle className="text-3xl font-bold text-white flex items-center gap-3">
                  {step === 2 && !editingPrompt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackStep}
                      className="mr-2 hover:bg-white/20"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </Button>
                  )}
                  <Sparkles className="w-7 h-7" />
                  {editingPrompt ? "Editar Prompt" : step === 1 ? "Escolha o Tipo" : "Novo Prompt"}
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-base mt-1">
                  {editingPrompt 
                    ? "Atualize os detalhes do seu prompt" 
                    : step === 1 
                      ? "Selecione o tipo de capa para o card"
                      : "Crie um novo prompt personalizado"}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* ✨ CONTEÚDO SCROLLÁVEL */}
          <div className="glass-content-wrapper custom-scrollbar">
            
            {/* STEP 1: Seleção de Tipo (só para criação) */}
            {step === 1 && !editingPrompt && (
              <div className="space-y-6">
                <MediaTypeSelector />
                
                <div className="flex justify-end px-6 pb-6">
                  <Button
                    onClick={handleNextStep}
                    disabled={!mediaType}
                    className="px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Formulário */}
            {step === 2 && (
              <div className="glass-content-bg p-8 space-y-6">

                {/* ✅ Indicador do tipo selecionado */}
                {mediaType && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <p className="text-sm text-purple-900 dark:text-purple-300">
                      <strong>Tipo de capa:</strong> {
                        mediaType === 'none' ? '📝 Sem capa (apenas texto)' :
                        mediaType === 'image' ? '🖼️ Imagem' :
                        mediaType === 'video' ? '🎥 Vídeo MP4' :
                        '📺 YouTube'
                      }
                      {editingPrompt && (
                        <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                          (não pode ser alterado)
                        </span>
                      )}
                    </p>
                  </div>
                )}

              {/* ========== TOPO - INFORMAÇÕES BÁSICAS (largura total) ========== */}
              <section className="glass-section rounded-2xl shadow-lg p-6 space-y-5 border-t-4 border-blue-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Informações Básicas
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="text-red-500">*</span> Título
                    </Label>
                    <Input
                      value={promptForm.title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPromptForm((prev) => ({ ...prev, title: value }));
                        if (!value.trim()) {
                          setFormErrors((prev) => ({ ...prev, title: "Título é obrigatório" }));
                        } else {
                          setFormErrors((prev) => ({ ...prev, title: "" }));
                        }
                      }}
                      placeholder="Ex: Gerador de ideias criativas..."
                      className={`glass-input transition-all duration-200 ${
                        formErrors.title 
                          ? "border-red-500 focus:ring-red-500" 
                          : "focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.title && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      value={promptForm.description}
                      onChange={(e) => setPromptForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Adicione uma breve descrição..."
                      rows={2}
                      className="glass-input focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <span className="text-red-500">*</span> Conteúdo do Prompt
                    </Label>
                    <Textarea
                      value={promptForm.content}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPromptForm((prev) => ({ ...prev, content: value }));
                        if (!value.trim()) {
                          setFormErrors((prev) => ({ ...prev, content: "Conteúdo é obrigatório" }));
                        } else {
                          setFormErrors((prev) => ({ ...prev, content: "" }));
                        }
                      }}
                      rows={5}
                      placeholder="Descreva o prompt em detalhes..."
                      className={`glass-input custom-scrollbar-inner transition-all duration-200 font-mono text-sm ${
                        formErrors.content 
                          ? "border-red-500 focus:ring-red-500" 
                          : "focus:ring-blue-500 focus:border-blue-500"
                      }`}
                    />
                    {formErrors.content && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.content}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <TagIcon className="w-4 h-4" />
                      Tags
                    </Label>
                    <Input
                      value={promptForm.tags}
                      onChange={(e) => setPromptForm((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="Ex: marketing, criativo, redes sociais"
                      className="glass-input focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Separe as tags com vírgula</p>
                  </div>
                </div>
              </section>

              {/* ========== MEIO - GRID 2 COLUNAS (Arquivos + Mídia) ========== */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* COLUNA ESQUERDA - ARQUIVOS EXTRAS */}
                <section className="glass-section rounded-2xl shadow-lg p-6 space-y-5 border-t-4 border-purple-500 h-fit">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Folder className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Arquivos Extras
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {attachments.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          📎 Arquivos anexados ({attachments.length})
                        </Label>
                        <div className="custom-scrollbar-inner space-y-2 max-h-48 overflow-y-auto">
                          {attachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-750 rounded-xl hover:shadow-md transition-all"
                            >
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                                📄 {file.file_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(file.file_url, { mode: "cors" });
                                      if (!response.ok) throw new Error(`HTTP ${response.status}`);

                                      const blob = await response.blob();
                                      const blobUrl = window.URL.createObjectURL(blob);

                                      const link = document.createElement("a");
                                      link.href = blobUrl;
                                      link.download = file.file_name;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);

                                      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
                                    } catch (err) {
                                      console.error("Erro ao baixar arquivo:", err);
                                      window.open(file.file_url, "_blank");
                                    }
                                  }}
                                >
                                  Baixar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                      const currentPromptId = editingPrompt?.id || promptForm?.id;
                                      
                                      if (!currentPromptId) {
                                        console.error("❌ Não foi possível determinar o ID do prompt");
                                        alert("Erro: Não foi possível identificar o prompt. Por favor, feche e reabra o modal de edição.");
                                        return;
                                      }
                                      
                                      removeAttachment(file.id, currentPromptId);
                                    }}
                                    className="text-red-600 hover:text-red-700 text-xs font-semibold"
                                  >
                                    Remover
                                  </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-750 dark:to-slate-700 border-2 border-dashed border-purple-300 dark:border-slate-600 rounded-2xl p-5 space-y-3">
                      <input
                        ref={extraFilesInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        multiple
                        onChange={handleExtraFiles}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-purple-300 hover:bg-purple-100 dark:hover:bg-slate-600 transition-all font-semibold"
                        onClick={() => extraFilesInputRef.current?.click()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Arquivos (PNG/JPG)
                      </Button>

                      {extraFiles.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {extraFiles.length} arquivo(s) selecionado(s)
                            </span>
                            <button
                              type="button"
                              onClick={clearAllExtraFiles}
                              className="text-xs text-red-600 hover:underline font-semibold"
                            >
                              Limpar todos
                            </button>
                          </div>

                          <div className="custom-scrollbar-inner max-h-32 overflow-y-auto space-y-2">
                            {extraFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                              >
                                <span className="text-xs truncate flex-1 text-slate-700 dark:text-slate-300">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeExtraFile(index)}
                                  className="ml-2 text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {extraFiles.length === 0 && attachments.length === 0 && (
                        <p className="text-xs text-center text-slate-500">
                          Nenhum arquivo adicionado ainda
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* COLUNA DIREITA - MÍDIA */}
                <section className="glass-section rounded-2xl shadow-lg p-6 space-y-5 border-t-4 border-green-500 h-fit">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Mídia (opcional)
                    </h3>
                  </div>

                  {/* Botões de seleção */}
                  {mediaType !== 'none' && (
                    <div className="flex flex-wrap gap-2 md:flex-nowrap">
                      {[
                        { type: "image", icon: ImageIcon, label: "Imagem", gradient: "from-blue-500 to-cyan-500" },
                        { type: "video", icon: Video, label: "Vídeo", gradient: "from-purple-500 to-pink-500" },
                        { type: "youtube", icon: Youtube, label: "YouTube", gradient: "from-red-500 to-orange-500" },
                      ].map(({ type, icon: Icon, label, gradient }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleMediaTypeClick(type)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                            promptForm.selectedMedia === type
                              ? `bg-gradient-to-r ${gradient} text-white shadow-lg scale-105`
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Preview de Imagem */}
                  {promptForm.selectedMedia === "image" && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-750 dark:to-slate-700 rounded-2xl p-5 space-y-3">
                      {promptForm.image_url ? (
                        <div className="relative group">
                          <img
                            src={promptForm.image_url.startsWith("http") ? promptForm.image_url : `${apiBaseUrl}${promptForm.image_url}`}
                            alt="Preview"
                            className="w-full rounded-xl shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">Nenhuma imagem selecionada</p>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-cyan-600 file:text-white hover:file:from-blue-700 hover:file:to-cyan-700 file:cursor-pointer file:shadow-md"
                      />
                    </div>
                  )}

                  {/* Preview de Vídeo */}
                  {promptForm.selectedMedia === "video" && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-750 dark:to-slate-700 rounded-2xl p-5 space-y-3">
                      {promptForm.videoFile ? (
                        <div className="relative group">
                          <video controls src={URL.createObjectURL(promptForm.videoFile)} className="w-full rounded-xl shadow-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setPromptForm((prev) => ({
                                ...prev,
                                videoFile: null,
                                video_url: "",
                                image_url: "",
                              }));
                              setThumbnailBlob(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : promptForm.video_url ? (
                        <div className="relative group">
                          <video
                            controls
                            src={promptForm.video_url.startsWith("http") ? promptForm.video_url : `${apiBaseUrl}${promptForm.video_url}`}
                            className="w-full rounded-xl shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPromptForm((prev) => ({
                                ...prev,
                                video_url: "",
                                videoFile: null,
                              }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">Nenhum vídeo selecionado</p>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={handleVideoUploadWithThumbnail}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-700 hover:file:to-pink-700 file:cursor-pointer file:shadow-md"
                      />
                      {thumbnailBlob && (
                        <p className="text-xs text-green-600">
                          ✅ Thumbnail gerado ({Math.round(thumbnailBlob.size / 1024)}KB)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preview de YouTube */}
                  {promptForm.selectedMedia === "youtube" && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-750 dark:to-slate-700 rounded-2xl p-5 space-y-3">
                      <Input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={promptForm.youtube_url}
                        onChange={(e) => setPromptForm((prev) => ({ ...prev, youtube_url: e.target.value }))}
                        className="glass-input border-red-300 focus:ring-red-500 focus:border-red-500"
                      />
                      {promptForm.youtube_url && extractYouTubeId(promptForm.youtube_url) ? (
                        <img
                          src={getYouTubeThumbnail(promptForm.youtube_url)}
                          alt="YouTube Thumbnail"
                          className="w-full rounded-xl shadow-lg"
                        />
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <Youtube className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">Cole um link válido do YouTube</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tipo "none" */}
                  {promptForm.selectedMedia === "none" && (
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📝 Este prompt usará apenas texto, sem capa visual.
                        O card exibirá o placeholder padrão do Promply.
                      </p>
                    </div>
                  )}
                </section>
              </div>

              {/* ========== BAIXO - DETALHES DO PROMPT (largura total) ========== */}
              <section className="glass-section rounded-2xl shadow-lg p-6 space-y-5 border-t-4 border-yellow-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Detalhes do Prompt
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Categoria
                    </Label>
                    <Select
                      value={promptForm.category_id}
                      onValueChange={(value) => setPromptForm((prev) => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger className="glass-input focus:ring-yellow-500">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {myCategories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Plataforma
                    </Label>
                    <Select
                      value={promptForm.platform}
                      onValueChange={(value) => setPromptForm((prev) => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger className="glass-input focus:ring-yellow-500">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chatgpt">🤖 ChatGPT</SelectItem>
                        <SelectItem value="nanobanana">🌙 Nano Banana</SelectItem>
                        <SelectItem value="gemini">✨ Gemini</SelectItem>
                        <SelectItem value="veo3">🎥 VEO3</SelectItem>
                        <SelectItem value="manus">📝 Manus</SelectItem>
                        <SelectItem value="claude">🧠 Claude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Favorito
                    </Label>
                    <label className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-slate-700 dark:to-slate-750 rounded-xl cursor-pointer hover:shadow-md transition-all h-10">
                      <input
                        type="checkbox"
                        checked={promptForm.is_favorite}
                        onChange={(e) => setPromptForm((prev) => ({ ...prev, is_favorite: e.target.checked }))}
                        className="form-checkbox h-5 w-5 text-yellow-600 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        ⭐ Marcar como favorito
                      </span>
                    </label>
                  </div>
                </div>
              </section>

              {/* BOTÕES DE AÇÃO - FIXOS */}
              <div className="flex justify-end gap-3 pt-6 sticky bottom-0 glass-content-bg pb-2 -mb-8 -mx-8 px-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetPromptForm();
                    setStep(1);
                    setMediaType('none');
                    setThumbnailBlob(null);
                    onOpenChange(false);
                  }}
                  className="glass-input px-8 py-2 border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    if (!isSaving) await handleSaveWithMediaType();
                  }}
                  className={`px-8 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold shadow-lg rounded-xl ${
                    isSaving ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"
                  }`}
                >
                  {isSaving ? "Salvando..." : editingPrompt ? "💾 Salvar Alterações" : "✨ Criar Prompt"}
                </Button>
              </div>
            </div>
            )}

          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}