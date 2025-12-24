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
import { X, Trash2, Download, Plus, Image as ImageIcon, Video, Youtube, FileText, Tag as TagIcon, Folder, Zap, Sparkles } from "lucide-react";

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

// ✨ ESTILOS GLASSMORPHISM MELHORADOS
// ✨ ESTILOS GLASSMORPHISM OTIMIZADOS (MUITO MAIS RÁPIDO)
const glassmorphismStyles = `
  @keyframes modalGlassEnter {
    from {
      opacity: 0;
      transform: scale(0.98) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes closeButtonPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }
  }

  .modal-glass-container {
    animation: modalGlassEnter 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    background: rgba(255, 255, 255, 0.75) !important;
    backdrop-filter: blur(25px) saturate(150%) !important;
    -webkit-backdrop-filter: blur(25px) saturate(150%) !important;
    border: 4px solid rgba(139, 92, 246, 0.6) !important;
    border-radius: 30px !important;
    box-shadow: 
      0 0 0 1px rgba(139, 92, 246, 0.4),
      0 0 100px 15px rgba(139, 92, 246, 0.6),
      0 10px 30px rgba(0, 0, 0, 0.25) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    max-height: 90vh !important;
    will-change: transform, opacity;
  }

  .dark .modal-glass-container {
    background: rgba(15, 23, 42, 0.7) !important;
    backdrop-filter: blur(25px) saturate(150%) !important;
    -webkit-backdrop-filter: blur(25px) saturate(150%) !important;
    border: 4px solid rgba(139, 92, 246, 0.7) !important;
    box-shadow: 
      0 0 0 1px rgba(139, 92, 246, 0.5),
      0 0 120px 20px rgba(139, 92, 246, 0.7),
      0 10px 30px rgba(0, 0, 0, 0.4) !important;
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
    background: rgba(255, 255, 255, 0.6) !important;
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    border: 1px solid rgba(255, 255, 255, 0.8) !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08) !important;
  }

  .dark .glass-section {
    background: rgba(30, 41, 59, 0.5) !important;
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    border: 1px solid rgba(148, 163, 184, 0.3) !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25) !important;
  }

  .glass-input {
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(203, 213, 225, 0.6) !important;
    transition: all 0.2s ease;
  }

  .dark .glass-input {
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(148, 163, 184, 0.4) !important;
  }

  .glass-content-bg {
    background: rgba(248, 250, 252, 0.4) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }

  .dark .glass-content-bg {
    background: rgba(15, 23, 42, 0.4) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
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
    background: rgba(239, 68, 68, 0.9);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    will-change: transform;
  }

  .close-button-glass:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 6px 18px rgba(239, 68, 68, 0.6);
  }

  .close-button-glass:active {
    transform: scale(0.95) rotate(90deg);
    transition: all 0.1s ease;
  }

  .dark .close-button-glass {
    background: rgba(239, 68, 68, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 4px 12px rgba(239, 68, 68, 0.5),
      0 0 15px rgba(239, 68, 68, 0.25);
  }

  .dark .close-button-glass:hover {
    background: rgba(220, 38, 38, 1);
    box-shadow: 
      0 6px 18px rgba(239, 68, 68, 0.7),
      0 0 25px rgba(239, 68, 68, 0.4);
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

  const handleMediaTypeClick = (type) => {
    setPromptForm((prev) => ({ ...prev, selectedMedia: type }));
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
              onOpenChange(false);
            }}
            className="close-button-glass"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6 text-white" strokeWidth={3} />
          </button>

          {/* ✨ HEADER FIXO - OCUPA TODO O TOPO */}
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
                  {editingPrompt ? "Atualize os detalhes do seu prompt" : "Crie um novo prompt personalizado"}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* ✨ CONTEÚDO SCROLLÁVEL */}
          <div className="glass-content-wrapper custom-scrollbar">
            <div className="glass-content-bg p-8 space-y-6">

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

                {/* Campos em coluna única */}
                <div className="space-y-5">
                  {/* Título */}
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

                  {/* Descrição */}
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

                  {/* Conteúdo do Prompt */}
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

                  {/* Tags */}
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
                    {/* Anexos Existentes */}
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
                                        console.error("   - editingPrompt:", editingPrompt);
                                        console.error("   - promptForm:", promptForm);
                                        alert("Erro: Não foi possível identificar o prompt. Por favor, feche e reabra o modal de edição.");
                                        return;
                                      }
                                      
                                      console.log("🗑️ Iniciando remoção de anexo:");
                                      console.log("   - Arquivo ID:", file.id);
                                      console.log("   - Arquivo Nome:", file.file_name);
                                      console.log("   - Prompt ID:", currentPromptId);
                                      
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

                    {/* Upload de Novos Arquivos */}
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
                        onChange={handleVideoUpload}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-700 hover:file:to-pink-700 file:cursor-pointer file:shadow-md"
                      />
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

                {/* Grid 3 colunas para os detalhes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Categoria */}
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

                  {/* Plataforma */}
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

                  {/* Favorito */}
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
                    if (!isSaving) await savePrompt();
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

        </DialogContent>
      </Dialog>
    </>
  );
}