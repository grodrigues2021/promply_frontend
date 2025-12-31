// ==========================================
// src/components/PromptModal.jsx
// ✅ VERSÃO CORRIGIDA - BUG-002 RESOLVIDO
// ✅ originalMediaType capturado DIRETAMENTE de editingPrompt
// ✅ Remoção de capa 100% funcional
// ✅ Grid responsivo: Empilhado mobile, lado a lado desktop
// ✅ DRY: Uma única barra universal para todas as mídias
// ✅ Produção ready
// ==========================================

import { useState, useEffect, useRef } from "react";
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
import { 
  X, 
  Trash2, 
  Download, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Youtube, 
  FileText, 
  Tag as TagIcon, 
  Folder, 
  Zap, 
  Sparkles,
  ImagePlus,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

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

// ⚡ ESTILOS GLASSMORPHISM ULTRA OTIMIZADOS
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

const safeCreateObjectURL = (file) => {
  try {
    if (file instanceof File || file instanceof Blob) {
      return URL.createObjectURL(file);
    }
    return "";
  } catch (error) {
    console.error("❌ Erro ao criar objectURL:", error);
    return "";
  }
};

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

  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [originalMediaType, setOriginalMediaType] = useState('none');

  const [forceMediaRefresh, setForceMediaRefresh] = useState(0);
  const [isRemovingCover, setIsRemovingCover] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setThumbnailBlob(null);
      setOriginalMediaType('none');
    }
  }, [isOpen]);

  const currentMediaType = (() => {
    if (promptForm.media_type && promptForm.media_type !== 'none') {
      return promptForm.media_type;
    }
    
    if (promptForm.selectedMedia && promptForm.selectedMedia !== 'none') {
      return promptForm.selectedMedia;
    }
    
    if (promptForm.youtube_url?.trim()) {
      return 'youtube';
    }
    
    if (promptForm.video_url?.trim() || promptForm.videoFile) {
      return 'video';
    }
    
    if (promptForm.image_url?.trim() || promptForm.imageFile) {
      return 'image';
    }
    
    return 'none';
  })();

  useEffect(() => {
    if (isRemovingCover) {
      if (promptForm.image_url || promptForm.video_url || promptForm.youtube_url || 
          promptForm.videoFile || promptForm.imageFile) {
        console.error('❌ ERRO: Mídia não foi completamente removida!', {
          image_url: promptForm.image_url,
          video_url: promptForm.video_url,
          youtube_url: promptForm.youtube_url,
          videoFile: !!promptForm.videoFile,
          imageFile: !!promptForm.imageFile,
        });
      }

      setIsRemovingCover(false);
    }
  }, [isRemovingCover, currentMediaType, promptForm.image_url, promptForm.video_url, promptForm.youtube_url, promptForm.videoFile, promptForm.imageFile, promptForm.media_type, promptForm.selectedMedia]);

  useEffect(() => {
    if (isOpen && editingPrompt) {
      const originalType = 
        editingPrompt.media_type || 
        (editingPrompt.youtube_url ? 'youtube' :
         editingPrompt.video_url ? 'video' :
         editingPrompt.image_url ? 'image' : 'none');
      
      setOriginalMediaType(originalType);
    } else if (isOpen && !editingPrompt) {
      setOriginalMediaType('none');
    }
  }, [isOpen, editingPrompt]);

  const handleMediaTypeSelect = (type) => {
    if (editingPrompt && originalMediaType !== 'none' && type !== originalMediaType) {
      toast.error(
        `❌ Não é possível mudar o tipo de mídia!\n\n` +
        `Tipo original: ${originalMediaType}\n` +
        `Tipo selecionado: ${type}\n\n` +
        `Remova a capa primeiro para adicionar outro tipo.`
      );
      return;
    }

    setPromptForm((prev) => ({ 
      ...prev, 
      selectedMedia: type,
      media_type: type 
    }));
    
    if (originalMediaType === 'none') {
      setOriginalMediaType(type);
    }
    
    if (type === 'image') {
      setTimeout(() => imageInputRef.current?.click(), 100);
    } else if (type === 'video') {
      setTimeout(() => videoInputRef.current?.click(), 100);
    }
  };

  const handleVideoUploadWithThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('O vídeo deve ter no máximo 20MB');
      e.target.value = '';
      return;
    }

    handleVideoUpload(e);

    try {
      const videoUrl = safeCreateObjectURL(file);
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });

      video.currentTime = Math.min(1.0, video.duration * 0.1);
      
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      const canvas = document.createElement('canvas');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setThumbnailBlob(blob);
        }
      }, 'image/jpeg', 0.85);

      URL.revokeObjectURL(videoUrl);
    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error);
    }
  };

  const handleSaveWithThumbnail = async () => {
    if (editingPrompt && originalMediaType !== 'none') {
      if (currentMediaType !== originalMediaType) {
        toast.error(
          `❌ Você não pode mudar o tipo de mídia!\n\n` +
          `Tipo original: ${originalMediaType}\n` +
          `Tipo atual: ${currentMediaType}\n\n` +
          `Para mudar o tipo, remova a capa e adicione uma nova.`
        );
        console.error('🚫 Tentativa bloqueada de salvar com tipo diferente:', {
          original: originalMediaType,
          atual: currentMediaType
        });
        return;
      }
    }

    const finalMediaType = currentMediaType !== 'none' ? currentMediaType : 'none';
    
    const updatedForm = {
      ...promptForm,
      media_type: finalMediaType,
      selectedMedia: finalMediaType,
      thumbnailBlob: thumbnailBlob
    };
    
    await savePrompt(updatedForm);
  };

  const handleRemoveCover = () => {
    if (confirm('Tem certeza que deseja remover a capa deste prompt?')) {
      setPromptForm((prev) => {
        const newState = {
          ...prev,
          selectedMedia: 'none',
          media_type: 'none',
          
          image_url: '',
          video_url: '',
          youtube_url: '',
          
          videoFile: null,
          imageFile: null,
        };
        
        return newState;
      });
      
      setThumbnailBlob(null);
      
      const oldType = originalMediaType;
      setOriginalMediaType('none');
      
      setForceMediaRefresh(prev => prev + 1);
      
      setIsRemovingCover(true);
      
      const tipoRemovido = 
        currentMediaType === 'image' ? 'Imagem' :
        currentMediaType === 'video' ? 'Vídeo MP4' :
        currentMediaType === 'youtube' ? 'YouTube' : 'Mídia';
      
      toast.success(`🗑️ ${tipoRemovido} removida! Agora você pode adicionar qualquer tipo de mídia.`);
    }
  };

  // ✅ Verifica se há mídia para exibir
  const hasMediaToShow = 
    (currentMediaType === 'image' && promptForm.image_url) ||
    (currentMediaType === 'video' && (promptForm.videoFile || promptForm.video_url)) ||
    (currentMediaType === 'youtube' && promptForm.youtube_url && extractYouTubeId(promptForm.youtube_url));

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <style>{glassmorphismStyles}</style>
      
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="modal-glass-container max-w-7xl w-full p-0">
          
          <button
            onClick={() => {
              resetPromptForm();
              setThumbnailBlob(null);
              onOpenChange(false);
            }}
            className="close-button-glass"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6 text-white" strokeWidth={3} />
          </button>

          <div className="glass-header">
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='white' stroke-opacity='0.1' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
              }}></div>
              <DialogHeader className="relative z-10 pr-12">
                <DialogTitle className="text-3xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-base mt-1">
                  {editingPrompt 
                    ? "Atualize os detalhes do seu prompt" 
                    : "Crie um novo prompt personalizado"}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="glass-content-wrapper custom-scrollbar">
            <div className="glass-content-bg p-8 space-y-6">

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                                      toast.error("Erro: Não foi possível identificar o prompt. Por favor, feche e reabra o modal de edição.");
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

                <section className="glass-section rounded-2xl shadow-lg p-6 space-y-5 border-t-4 border-green-500 h-fit">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Mídia (opcional)
                    </h3>
                  </div>

                  {currentMediaType === 'none' && (
                    <div className="space-y-4">
                      <p className="text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
                        {editingPrompt 
                          ? "📸 Este prompt não possui capa. Selecione o tipo de mídia abaixo:" 
                          : "Opcional: Escolha o tipo de capa para o card"}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          type="button"
                          onClick={() => handleMediaTypeSelect('image')}
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 md:py-8 text-base shadow-md hover:shadow-lg transition-all flex flex-row md:flex-col items-center justify-center gap-2 md:aspect-square"
                        >
                          <ImageIcon className="w-5 h-5 md:w-8 md:h-8" />
                          <span>Adicionar Imagem</span>
                        </Button>

                        <Button
                          type="button"
                          onClick={() => handleMediaTypeSelect('video')}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 md:py-8 text-base shadow-md hover:shadow-lg transition-all flex flex-row md:flex-col items-center justify-center gap-2 md:aspect-square"
                        >
                          <Video className="w-5 h-5 md:w-8 md:h-8" />
                          <span>Adicionar Vídeo MP4</span>
                        </Button>

                        <Button
                          type="button"
                          onClick={() => handleMediaTypeSelect('youtube')}
                          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-4 md:py-8 text-base shadow-md hover:shadow-lg transition-all flex flex-row md:flex-col items-center justify-center gap-2 md:aspect-square"
                        >
                          <Youtube className="w-5 h-5 md:w-8 md:h-8" />
                          <span>Adicionar YouTube</span>
                        </Button>
                      </div>

                      <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                        💡 Dica: Você pode deixar em branco para usar o placeholder padrão
                      </p>
                    </div>
                  )}

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleVideoUploadWithThumbnail}
                    className="hidden"
                  />

                  {currentMediaType !== 'none' && (
                    <div className="space-y-4">
                      {editingPrompt && originalMediaType !== 'none' && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                🔒 Tipo de Mídia Fixo
                              </p>
                              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                <strong>Tipo atual:</strong> {
                                  currentMediaType === 'image' ? '🖼️ Imagem' :
                                  currentMediaType === 'video' ? '🎥 Vídeo MP4' :
                                  '📺 YouTube'
                                }
                              </p>
                              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2 leading-relaxed">
                                ✏️ Você pode <strong>trocar</strong> a {
                                  currentMediaType === 'image' ? 'imagem por outra imagem' :
                                  currentMediaType === 'video' ? 'vídeo por outro vídeo' :
                                  'URL do YouTube'
                                }, mas <strong>não pode mudar o tipo de mídia</strong> (ex: de vídeo para imagem).<br/><br/>
                                💡 Para mudar o tipo, primeiro <strong>remova a capa</strong> e depois adicione uma nova com o tipo desejado.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ✅ PREVIEW UNIVERSAL COM BARRA ÚNICA */}
                      {hasMediaToShow ? (
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-750 dark:to-slate-700 rounded-2xl overflow-hidden">
                          <div className="relative w-full h-[400px] overflow-hidden">
                            
                            {/* 🎯 RENDERIZA A MÍDIA APROPRIADA */}
                            {currentMediaType === "image" && promptForm.image_url && (
                              <img
                                src={promptForm.image_url.startsWith("http") ? promptForm.image_url : `${apiBaseUrl}${promptForm.image_url}`}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )}

                            {currentMediaType === "video" && (promptForm.videoFile || promptForm.video_url) && (
                              <video
                                controls
                                src={promptForm.videoFile ? safeCreateObjectURL(promptForm.videoFile) : (promptForm.video_url.startsWith("http") ? promptForm.video_url : `${apiBaseUrl}${promptForm.video_url}`)}
                                className="w-full h-full object-cover"
                              />
                            )}

                            {currentMediaType === "youtube" && promptForm.youtube_url && extractYouTubeId(promptForm.youtube_url) && (
                              <img
                                src={getYouTubeThumbnail(promptForm.youtube_url)}
                                alt="YouTube Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            )}
                            
                            {/* ✨ GRADIENT OVERLAY UNIVERSAL (funciona para TODOS) */}
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent pointer-events-none" />
                            
                            {/* 🎨 BARRA DE CONTROLES UNIVERSAL */}
                            <div className="absolute bottom-4 left-0 right-0 px-5 flex justify-between items-center">
                              
                              {/* Badge dinâmico baseado no tipo */}
                              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                                {currentMediaType === 'image' && (
                                  <>
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-slate-800">Imagem</span>
                                  </>
                                )}
                                {currentMediaType === 'video' && (
                                  <>
                                    <Video className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-slate-800">Vídeo MP4</span>
                                  </>
                                )}
                                {currentMediaType === 'youtube' && (
                                  <>
                                    <Youtube className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-semibold text-slate-800">YouTube</span>
                                  </>
                                )}
                              </div>

                            {/* Botões universais */}
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Remove qualquer tipo de mídia
                                    setPromptForm((prev) => ({
                                      ...prev,
                                      videoFile: null,
                                      video_url: "",
                                      image_url: "",
                                      youtube_url: "",
                                    }));
                                    setThumbnailBlob(null);
                                  }}
                                  className="bg-white/95 backdrop-blur-sm hover:bg-red-50 border-2 border-red-400 text-red-600 font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Remover
                                </Button>
                                
                                {currentMediaType !== 'youtube' && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (currentMediaType === 'image') {
                                        imageInputRef.current?.click();
                                      } else if (currentMediaType === 'video') {
                                        videoInputRef.current?.click();
                                      }
                                    }}
                                    className="bg-white/95 backdrop-blur-sm hover:bg-blue-50 border-2 border-blue-400 text-blue-600 font-semibold shadow-lg hover:shadow-xl transition-all"
                                  >
                                    <ImagePlus className="w-4 h-4 mr-1" />
                                    Alterar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mensagem de thumbnail gerado */}
                          {thumbnailBlob && (
                            <p className="text-xs text-green-600 text-center px-5 py-3">
                              ✅ Thumbnail gerado ({Math.round(thumbnailBlob.size / 1024)}KB)
                            </p>
                          )}
                        </div>
                      ) : (
                        /* Estado vazio para YouTube ou quando não há mídia selecionada */
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-750 dark:to-slate-700 rounded-2xl p-5 space-y-3">
                          {currentMediaType === 'youtube' && (
                            <>
                              <Input
                                type="text"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={promptForm.youtube_url}
                                onChange={(e) => setPromptForm((prev) => ({ ...prev, youtube_url: e.target.value }))}
                                className="glass-input border-red-300 focus:ring-red-500 focus:border-red-500"
                              />
                              <div className="text-center py-8 text-slate-500">
                                <Youtube className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">Cole um link válido do YouTube</p>
                              </div>
                            </>
                          )}
                          
                          {currentMediaType === 'image' && !promptForm.image_url && (
                            <div className="text-center py-8 text-slate-500">
                              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p className="text-sm font-medium mb-4">Nenhuma imagem selecionada</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => imageInputRef.current?.click()}
                                className="border-blue-300 hover:bg-blue-100"
                              >
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Selecionar Imagem
                              </Button>
                            </div>
                          )}
                          
                          {currentMediaType === 'video' && !promptForm.videoFile && !promptForm.video_url && (
                            <div className="text-center py-8 text-slate-500">
                              <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p className="text-sm font-medium mb-4">Nenhum vídeo selecionado</p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => videoInputRef.current?.click()}
                                className="border-purple-300 hover:bg-purple-100"
                              >
                                <Video className="w-4 h-4 mr-2" />
                                Selecionar Vídeo
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRemoveCover}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
                      >
                        <X className="w-4 h-4 mr-2" />
                        🗑️ Remover Capa
                      </Button>
                    </div>
                  )}
                </section>
              </div>

              <section className="glass-section rounded-2xl shadow-lg p-6 space-y-5 border-t-4 border-yellow-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Detalhes do Prompt
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </section>

              <div className="relative flex justify-end gap-3 pt-8 sticky bottom-0 -mb-8 -mx-8 px-8 pb-6">
  {/* ✨ Gradient overlay no rodapé do modal */}
  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 dark:to-transparent pointer-events-none" />
  
  {/* Botões sobre o gradient */}
  <div className="relative flex gap-3">
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        resetPromptForm();
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
        if (!isSaving) await handleSaveWithThumbnail();
      }}
      className={`px-8 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold shadow-lg rounded-xl ${
        isSaving ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"
      }`}
    >
      {isSaving ? "Salvando..." : editingPrompt ? "💾 Salvar Alterações" : "✨ Criar Prompt"}
    </Button>
  </div>
</div>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}