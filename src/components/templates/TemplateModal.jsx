import React, { useEffect, useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { X, Upload, ImageIcon, Video, Youtube } from "lucide-react";

import api from "../../lib/api";




// ============================================================
// 🔵 PLATAFORMAS DISPONÍVEIS
// ============================================================
const PLATFORMS = [
    { value: "chatgpt", label: "ChatGPT", icon: "🤖", color: "#10a37f" },
    { value: "claude", label: "Claude", icon: "🧠", color: "#6366f1" },
    { value: "gemini", label: "Gemini", icon: "✨", color: "#8e44ad" },
    { value: "copilot", label: "Copilot", icon: "🔷", color: "#0078d4" },
    { value: "perplexity", label: "Perplexity", icon: "🔍", color: "#1fb6ff" },
    { value: "midjourney", label: "Midjourney", icon: "🎨", color: "#ff6b6b" },
    { value: "dall-e", label: "DALL-E", icon: "🖼️", color: "#ff9500" },
    { value: "other", label: "Outro", icon: "⚡", color: "#64748b" },
];

// ============================================================
// 🔵 Helpers
// ============================================================

// Extrai ID de YouTube de qualquer URL
function extractYouTubeId(url) {
    if (!url) return null;

    try {
        let regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|youtube.com\/watch\?v=)([^#&?]*).*/;
        let match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    } catch {
        return null;
    }
}

// Detecta se uma string é URL completa
function isValidHttpUrl(str) {
    try {
        let url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

// Detecta MIME do arquivo
function detectFileType(file) {
    if (!file) return null;
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return null;
}

// ============================================================
// 🔵 Componente TemplateModal
// ============================================================

export default function TemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
  categories = [],
  extraFiles,
  setExtraFiles,
  handleExtraFilesChange,
}) {

    // ------------------------------------------------------------
    // 🟡 ESTADOS – UNIFICADOS
    // ------------------------------------------------------------

    const [title, setTitle] = useState(template?.title || "");
    const [description, setDescription] = useState(template?.description || "");
    const [content, setContent] = useState(template?.content || "");

    const [selectedCategories, setSelectedCategories] = useState(
        template?.categories_ids || []
    );
    const [tagsInput, setTagsInput] = useState("");
    const [platform, setPlatform] = useState(template?.platform || "");
    
    const [imageUrl, setImageUrl] = useState(template?.image_url || null);
    const [videoUrl, setVideoUrl] = useState(template?.video_url || null);
    const [youtubeUrl, setYoutubeUrl] = useState(template?.youtube_url || "");

    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);

    const [thumbUrl, setThumbUrl] = useState(template?.thumb_url || null);

    const [preview, setPreview] = useState(null);

    const [isSaving, setIsSaving] = useState(false);

    // 🔵 Arquivos extras já existentes no template (TemplateFile)
    const [existingFiles, setExistingFiles] = useState([]);

    const isEdit = !!template?.id;

    // ------------------------------------------------------------
    // 🟡 RESET – ao abrir modal
    // ------------------------------------------------------------
    useEffect(() => {
        if (!isOpen) return;

        setTitle(template?.title || "");
        setDescription(template?.description || "");
        setContent(template?.content || "");
        setSelectedCategories(template?.categories_ids || []);
        setPlatform(template?.platform || "");
        
        // ✅ Converter tags para string
        // 🟣 Normalização definitiva das tags (corrige JSON, aspas internas e arrays)
        const templateTags = template?.tags || [];

        if (Array.isArray(templateTags)) {
            // ex: ["teste 1", "teste 2"]
            setTagsInput(templateTags.join(", "));
        }
        else if (typeof templateTags === "string") {
            const raw = templateTags.trim();

            if (raw.startsWith("[")) {
                // ex: "["teste 1","teste 2"]"
                try {
                    const parsed = JSON.parse(raw);
                    setTagsInput(parsed.join(", "));
                } catch {
                    // remove aspas e brackets por segurança
                    setTagsInput(raw.replace(/[\[\]"]/g, "").trim());
                }
            } else {
                // string comum (ex: "teste 1, teste 2")
                setTagsInput(raw.replace(/[\[\]"]/g, "").trim());
            }
        }
        else {
            setTagsInput("");
        }

        setImageUrl(template?.image_url || null);
        setVideoUrl(template?.video_url || null);
        setYoutubeUrl(template?.youtube_url || "");
        setThumbUrl(template?.thumb_url || null);

        setImageFile(null);
        setVideoFile(null);
        setPreview(null);

        // 🔥 CORREÇÃO: limpar anexos ao criar novo template
if (template?.id) {
    loadExistingFiles(template.id);
} else {
    setExistingFiles([]);      // ← ZERA ANEXOS ANTIGOS
    setExtraFiles([]);         // ← ZERA ARQUIVOS SELECIONADOS
}

    }, [isOpen, template]);

    // ------------------------------------------------------------
    // 🟣 Atualiza preview automaticamente
    // ------------------------------------------------------------
    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setPreview({ type: "video", src: url });
            return;
        }

        const ytId = extractYouTubeId(youtubeUrl);
        if (ytId) {
            setPreview({ type: "youtube", src: ytId });
            return;
        }

        if (videoUrl) {
            setPreview({ type: "video", src: videoUrl, poster: thumbUrl });
            return;
        }

        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setPreview({ type: "image", src: url });
            return;
        }

        if (imageUrl) {
            setPreview({ type: "image", src: imageUrl });
            return;
        }

        setPreview(null);
    }, [videoFile, youtubeUrl, videoUrl, imageFile, imageUrl, thumbUrl]);



    // ============================================================
    // 🔵 Carrega arquivos extras existentes do Template (GET)
    // ============================================================
    const loadExistingFiles = async (templateId) => {
    try {
        const response = await api.get(`/templates/${templateId}/files`);
        setExistingFiles(response.data.data || []);
    } catch (error) {
        console.error("Erro ao carregar arquivos extras:", error);
    }
    };
    // ------------------------------------------------------------
    // 🔵 handleFileSelect
    // ------------------------------------------------------------
    const handleFileSelect = useCallback((event) => {


        const file = event.target.files?.[0];
        if (!file) return;

        const type = detectFileType(file);

        if (type === "image") {
            setImageFile(file);
            setImageUrl(null);
            setVideoFile(null);
            setVideoUrl(null);
            setYoutubeUrl("");
        }

        if (type === "video") {
            setVideoFile(file);
            setVideoUrl(null);
            setImageFile(null);
            setImageUrl(null);
            setYoutubeUrl("");
        }
    }, []);

    // ============================================================
    // 🟦 PREVIEW INTELIGENTE – JSX
    // ============================================================
    const renderPreview = () => {
        if (!preview) {
            return (
                <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                        Nenhuma mídia selecionada
                    </p>
                </div>
            );
        }

        if (preview.type === "video") {
            return (
                <div className="relative w-full h-56 rounded-lg overflow-hidden bg-black">
                    <video
                        controls
                        className="w-full h-full object-contain"
                        src={preview.src}
                        poster={preview.poster || undefined}
                    />
                    <button
                        type="button"
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        onClick={() => {
                            setVideoFile(null);
                            setVideoUrl(null);
                            setPreview(null);
                        }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        if (preview.type === "youtube") {
            return (
                <div className="relative w-full h-56 rounded-lg overflow-hidden bg-black">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${preview.src}`}
                        title="YouTube video"
                        allowFullScreen
                    ></iframe>

                    <button
                        type="button"
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        onClick={() => {
                            setYoutubeUrl("");
                            setPreview(null);
                        }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        if (preview.type === "image") {
            return (
                <div className="relative w-full h-56 rounded-lg overflow-hidden">
                    <img
                        src={preview.src}
                        alt="Preview"
                        className="w-full h-full object-contain bg-muted"
                    />

                    <button
                        type="button"
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        onClick={() => {
                            setImageFile(null);
                            setImageUrl(null);
                            setPreview(null);
                        }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            );
        }

        return (
            <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg border">
                <p className="text-sm text-muted-foreground">Preview indisponível</p>
            </div>
        );
    };

        // ============================================================
    // 🟦 HANDLE SAVE – PATCH FINAL E CORRIGIDO
    // ============================================================
    const handleSave = async () => {
        if (!title.trim()) {
            alert("Título é obrigatório.");
            return;
        }
        if (!content.trim()) {
            alert("Conteúdo é obrigatório.");
            return;
        }

        setIsSaving(true);

        try {
            // ---------------------------------------------------------
            // 🔵 PREPARAR TAGS
            // ---------------------------------------------------------
            const tagsArray = tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

            // ---------------------------------------------------------
            // 🔵 IDENTIFICADORES
            // ---------------------------------------------------------
            const hasNewMedia = imageFile || videoFile;              // imagem/vídeo novos
            const hasYouTube = extractYouTubeId(youtubeUrl);         // youtube ativo
            const hasExtraFiles = extraFiles && extraFiles.length > 0; // arquivos extras novos

            // ---------------------------------------------------------
            // 🔵 NECESSIDADE DE FORMDATA
            // ---------------------------------------------------------
            const mustUseFormData = hasNewMedia || hasYouTube || hasExtraFiles;

            let payload;

            // ============================================================
            // 🔵 CASO 1 — FORM DATA (upload de qualquer arquivo)
            // ============================================================
            if (mustUseFormData) {
                payload = new FormData();

                payload.append("title", title);
                payload.append("description", description);
                payload.append("content", content);
                payload.append("categories", JSON.stringify(selectedCategories));
                payload.append("tags", JSON.stringify(tagsArray));
                payload.append("platform", platform || "");

                // 🔵 MÍDIA NOVA (somente novas!)
                if (imageFile) {
                    payload.append("image", imageFile);
                }
                if (videoFile) {
                    payload.append("video", videoFile);
                }

                // 🔵 YouTube → inclui URL e gera thumbnail
                if (hasYouTube) {
                    payload.append("youtube_url", youtubeUrl);

                    const ytId = extractYouTubeId(youtubeUrl);
                    if (ytId) {
                        const ytThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                        payload.append("thumb_url", ytThumb);
                    }
                }

                // 🔵 ARQUIVOS EXTRAS (somente os novos)
                if (hasExtraFiles) {
                    extraFiles.forEach((file) => {
                        payload.append("extra_files", file);
                    });
                }

                // ❌ NÃO ENVIAR image_url / video_url / thumb_url NO PUT
                //    O backend mantém tudo automaticamente.

            }

            // ============================================================
            // 🔵 CASO 2 — JSON (nenhuma mídia envolvida)
            // ============================================================
            else {
                let finalThumbUrl = thumbUrl;

                if (youtubeUrl) {
                    const ytId = extractYouTubeId(youtubeUrl);
                    if (ytId) {
                        finalThumbUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                    }
                }

                payload = {
                    title,
                    description,
                    content,
                    categories: selectedCategories,
                    tags: tagsArray,
                    platform: platform || null,
                    youtube_url: youtubeUrl || null,
                    thumb_url: finalThumbUrl || null,

                    // 🔴 NÃO ENVIAR mídias existentes → backend já mantém
                    image_url: imageUrl || null,
                    video_url: videoUrl || null,
                };
            }

            // ============================================================
            // 🔵 EXECUTAR SALVAMENTO
            // ============================================================
            await onSave(payload, template?.id || null);

            setIsSaving(false);
            onClose();
        } catch (err) {
            console.error("❌ Erro ao salvar template:", err);
            alert("Erro ao salvar template.");
            setIsSaving(false);
        }
    };


// ============================================================
// 🔴 Remover arquivo extra existente (DELETE)
// ============================================================
const handleDeleteExistingFile = async (fileId) => {
  if (!window.confirm("Deseja remover este arquivo?")) return;

  try {
    await api.delete(`/templates/files/${fileId}`);
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
  } catch (error) {
    console.error("Erro ao remover arquivo extra:", error);
  }
};



    // ============================================================
    // 🟦 JSX FINAL – FORMULÁRIO + BOTÕES
    // ============================================================
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {isEdit ? "Editar Template" : "Criar Template"}
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os campos abaixo para criar ou editar o template.
                    </DialogDescription>
                </DialogHeader>

                {/* LAYOUT 2 COLUNAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    
                    {/* ========== COLUNA ESQUERDA - MÍDIA ========== */}
                    <div className="space-y-4">
                        {/* PREVIEW */}
                         <div>
                            {renderPreview()}
                        </div>

                        
                   {/* UPLOAD BUTTONS */}
                        <div className="flex flex-col gap-3 relative z-10 bg-white pt-2">
                            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md">
                                <ImageIcon className="w-5 h-5" />
                                <span className="font-medium">Upload Imagem</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>

                            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md">
                                <Video className="w-5 h-5" />
                                <span className="font-medium">Upload Vídeo</span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        </div>

{/* ===== ARQUIVOS EXTRAS (PNG/JPG) ===== */}
<div className="mt-4">
  <label className="text-sm font-semibold mb-2 block">
    Arquivos Extras (PNG/JPG)
  </label>

  <input
    type="file"
    accept="image/png, image/jpeg"
    multiple
    onChange={handleExtraFilesChange}
    className="block w-full border border-gray-300 rounded-lg p-2"
  />

{/* 🔵 LISTA DE ARQUIVOS JÁ EXISTENTES NO TEMPLATE */}
{existingFiles.length > 0 && (
  <div className="mt-3 space-y-2">
    <label className="text-sm font-semibold block">
      Arquivos já anexados:
    </label>

    {existingFiles.map((file) => (
  <div
    key={file.id}
    className="flex items-center justify-between w-full py-1 px-2 border rounded-md bg-gray-50"
  >
    <span className="text-sm truncate">{file.file_name}</span>

    <div className="flex items-center gap-3">
      {/* Botão Baixar */}
      {/* Botão Baixar - SEM PISCADA */}
{/* Botão Baixar - CORRIGIDO */}
<button
  onClick={async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // ✅ CORREÇÃO: file.file_url (não file.url)
      const response = await fetch(file.file_url, { method: "GET" });
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.file_name;  // ✅ Também corrigir: file_name
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
    }
  }}
  className="text-blue-600 hover:text-blue-800 text-sm underline cursor-pointer bg-transparent border-0 p-0"
>
  Baixar
</button>


      {/* Botão Remover */}
      <button
        onClick={() => handleDeleteExistingFile(file.id)}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Remover
      </button>
    </div>
  </div>
))}

  </div>
)}



  {/* LISTA DOS ARQUIVOS SELECIONADOS */}
  {extraFiles && extraFiles.length > 0 && (
    <div className="mt-3 space-y-2">
      {extraFiles.map((file, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2 text-sm"
        >
          <span className="truncate max-w-[70%]">📎 {file.name}</span>

          <button
            type="button"
            onClick={() => {
              const updated = extraFiles.filter((_, idx) => idx !== i);
              setExtraFiles(updated);
            }}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            Remover
          </button>
        </div>
      ))}

      {/* BOTÃO LIMPAR TODOS */}
      <button
        type="button"
        onClick={() => setExtraFiles([])}
        className="text-xs text-red-600 hover:text-red-800 mt-1"
      >
        Limpar Todos
      </button>
    </div>
  )}
</div>




                        {/* YOUTUBE URL */}
                        <div>
                            <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                                <Youtube className="w-5 h-5 text-red-600" /> 
                                <span>URL do YouTube</span>
                            </label>
                            <Input
                                placeholder="https://www.youtube.com/watch?v=XXXX"
                                value={youtubeUrl}
                                onChange={(e) => {
                                    setYoutubeUrl(e.target.value);
                                    setImageFile(null);
                                    setVideoFile(null);
                                }}
                                className="border-gray-300"
                            />
                        </div>
                    </div>

                    {/* ========== COLUNA DIREITA - FORMULÁRIO ========== */}
                    <div className="space-y-4">
                        {/* TITLE */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Título <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="Digite o título do template"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="border-gray-300"
                            />
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Descrição
                            </label>
                            <Textarea
                                placeholder="Digite uma descrição..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-gray-300 min-h-[80px]"
                                rows={3}
                            />
                        </div>

                        {/* CONTENT */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Conteúdo <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                placeholder="Digite o conteúdo (prompt)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="border-gray-300 min-h-[120px]"
                                rows={5}
                            />
                        </div>

                        {/* PLATFORM DROPDOWN */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Plataforma
                            </label>
                            
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            >
                                <option value="">Selecione uma plataforma</option>
                                
                                {PLATFORMS.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.icon} {p.label}
                                    </option>
                                ))}
                            </select>
                            
                            {/* Preview da plataforma selecionada */}
                            {platform && PLATFORMS.find(p => p.value === platform) && (
                                <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-lg">
                                        {PLATFORMS.find(p => p.value === platform)?.icon}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {PLATFORMS.find(p => p.value === platform)?.label}
                                    </span>
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                                Escolha a plataforma de IA para este template
                            </p>
                        </div>

                        {/* CATEGORIES */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Categoria
                            </label>
                            
                            <select
                                value={selectedCategories[0] || "none"}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "none") {
                                        setSelectedCategories([]);
                                    } else {
                                        setSelectedCategories([Number(value)]);
                                    }
                                }}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            >
                                <option value="none" className="text-gray-500">
                                    Sem categoria
                                </option>
                                
                                {categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Nenhuma categoria disponível</option>
                                )}
                            </select>
                            
                            {/* Preview da categoria selecionada */}
                            {selectedCategories.length > 0 && categories.find(c => c.id === selectedCategories[0]) && (
                                <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    <div 
                                        className="w-3 h-3 rounded-full border border-gray-300"
                                        style={{ backgroundColor: categories.find(c => c.id === selectedCategories[0])?.color || '#6366f1' }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        {categories.find(c => c.id === selectedCategories[0])?.name}
                                    </span>
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-500 mt-2">
                                Selecione uma categoria para organizar este template
                            </p>
                        </div>

                        {/* TAGS */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Tags
                            </label>
                            <Input
                                placeholder="Ex: marketing, vendas, email"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                className="border-gray-300"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Separe as tags por vírgula
                            </p>
                        </div>
                    </div>
                </div>  

                {/* FOOTER - BOTÕES */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-2 -mb-6 -mx-6 px-6 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 px-6"
                    >
                        {isSaving
                            ? "Salvando..."
                            : isEdit
                            ? "Salvar Alterações"
                            : "Criar Template"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}