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
import { toast } from "sonner";

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
// 🔵 HELPERS
// ============================================================

function extractYouTubeId(url) {
    if (!url) return null;
    try {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|youtube.com\/watch\?v=)([^#&?]*).*/;
        let match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    } catch {
        return null;
    }
}

function detectFileType(file) {
    if (!file) return null;
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return null;
}

// ============================================================
// 🆕 FUNÇÃO PARA GERAR THUMBNAIL DO VÍDEO
// ============================================================
async function generateVideoThumbnail(videoFile) {
    return new Promise((resolve, reject) => {
        console.log("🎬 Gerando thumbnail do vídeo...");
        
        const video = document.createElement('video');
        const objectUrl = URL.createObjectURL(videoFile);
        
        video.src = objectUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        
        // Timeout de 10 segundos
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout ao gerar thumbnail'));
        }, 10000);
        
        const cleanup = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(objectUrl);
            video.remove();
        };
        
        video.addEventListener('loadedmetadata', () => {
            // Vai para 1 segundo do vídeo (ou 10% da duração)
            const seekTime = Math.min(1, video.duration * 0.1);
            video.currentTime = seekTime;
        });
        
        video.addEventListener('seeked', () => {
            try {
                const canvas = document.createElement('canvas');
                
                // Mantém aspect ratio, max 1280x720
                const maxWidth = 1280;
                const maxHeight = 720;
                let width = video.videoWidth;
                let height = video.videoHeight;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (maxHeight / height) * width;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, width, height);
                
                // Converte para Blob JPEG (qualidade 85%)
                canvas.toBlob(
                    (blob) => {
                        cleanup();
                        if (blob) {
                            console.log(`✅ Thumbnail gerada: ${width}x${height}, ${(blob.size / 1024).toFixed(2)} KB`);
                            resolve(blob);
                        } else {
                            reject(new Error('Falha ao converter canvas para blob'));
                        }
                    },
                    'image/jpeg',
                    0.85
                );
            } catch (error) {
                cleanup();
                reject(error);
            }
        });
        
        video.addEventListener('error', (e) => {
            cleanup();
            reject(new Error('Erro ao carregar vídeo: ' + e.message));
        });
        
        video.load();
    });
}

// ============================================================
// 🔵 COMPONENTE TEMPLATEMODAL
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
    // ============================================================
    // 🟡 ESTADOS
    // ============================================================

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [tagsInput, setTagsInput] = useState("");
    const [platform, setPlatform] = useState("");
    
    const [imageUrl, setImageUrl] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [thumbUrl, setThumbUrl] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null); // 🆕 Thumbnail gerada

    const [preview, setPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false); // 🆕
    const [existingFiles, setExistingFiles] = useState([]);

    const isEdit = !!template?.id;

    // ============================================================
    // 🟡 RESET - Ao abrir modal
    // ============================================================
    useEffect(() => {
        if (!isOpen) return;

        console.log("📄 [TemplateModal] Reset - Modal aberto");
        console.log("   🔎 Template:", template?.id ? `ID ${template.id}` : "NOVO");

        setTitle(template?.title || "");
        setDescription(template?.description || "");
        setContent(template?.content || "");
        setSelectedCategories(
            template?.category_id ? [Number(template.category_id)] : []
        );
        setPlatform(template?.platform || "");
        
        // 🟣 Normalização de tags
        const templateTags = template?.tags || [];
        if (Array.isArray(templateTags)) {
            setTagsInput(templateTags.join(", "));
        } else if (typeof templateTags === "string") {
            const raw = templateTags.trim();
            if (raw.startsWith("[")) {
                try {
                    const parsed = JSON.parse(raw);
                    setTagsInput(parsed.join(", "));
                } catch {
                    setTagsInput(raw.replace(/[\[\]"]/g, "").trim());
                }
            } else {
                setTagsInput(raw.replace(/[\[\]"]/g, "").trim());
            }
        } else {
            setTagsInput("");
        }

        setImageUrl(template?.image_url || null);
        setVideoUrl(template?.video_url || null);
        setYoutubeUrl(template?.youtube_url || "");
        setThumbUrl(template?.thumb_url || null);

        setImageFile(null);
        setVideoFile(null);
        setThumbnailFile(null); // 🆕
        setPreview(null);

        // 🔵 ARQUIVOS EXTRAS
        if (template?.id) {
            console.log("   🔎 Carregando arquivos extras existentes...");
            loadExistingFiles(template.id);
            setExtraFiles([]);
        } else {
            console.log("   🔎 Zerando arquivos extras (novo template)");
            setExistingFiles([]);
            setExtraFiles([]);
        }
    }, [isOpen, template]);

    // ============================================================
    // 🟣 ATUALIZA PREVIEW AUTOMATICAMENTE
    // ============================================================
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
    // 🔵 CARREGA ARQUIVOS EXTRAS EXISTENTES
    // ============================================================
    const loadExistingFiles = async (templateId) => {
        try {
            const response = await api.get(`/templates/${templateId}/files`);
            const files = response.data.data || [];
            console.log(`   ✅ ${files.length} arquivo(s) extra(s) carregado(s)`);
            setExistingFiles(files);
        } catch (error) {
            console.error("   ❌ Erro ao carregar arquivos extras:", error);
        }
    };

    // ============================================================
    // 🆕 HANDLE VIDEO SELECT - COM GERAÇÃO AUTOMÁTICA DE THUMBNAIL
    // ============================================================
    const handleVideoSelect = useCallback(async (file) => {
        console.log(`📹 Vídeo selecionado: ${file.name}`);
        
        setVideoFile(file);
        setVideoUrl(null);
        setImageFile(null);
        setImageUrl(null);
        setYoutubeUrl("");
        
        // 🎨 GERA THUMBNAIL AUTOMATICAMENTE
        setIsGeneratingThumbnail(true);
        
        try {
            const thumbnailBlob = await generateVideoThumbnail(file);
            
            if (thumbnailBlob) {
                // Converte Blob para File
                const thumbnailFileObj = new File(
                    [thumbnailBlob],
                    'thumbnail.jpg',
                    { type: 'image/jpeg' }
                );
                
                setThumbnailFile(thumbnailFileObj);
                toast.success('✅ Vídeo e thumbnail prontos!');
                console.log("✅ Thumbnail gerada e armazenada");
            } else {
                toast.warning('⚠️ Não foi possível gerar thumbnail');
            }
        } catch (error) {
            console.error("❌ Erro ao gerar thumbnail:", error);
            toast.error('❌ Erro ao gerar thumbnail, mas vídeo foi adicionado');
        } finally {
            setIsGeneratingThumbnail(false);
        }
    }, []);

    // ============================================================
    // 🔵 HANDLE FILE SELECT (Imagem/Vídeo principal)
    // ============================================================
    const handleFileSelect = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const type = detectFileType(file);
        console.log(`🔎 Arquivo selecionado: ${file.name} (${type})`);

        if (type === "image") {
            setImageFile(file);
            setImageUrl(null);
            setVideoFile(null);
            setVideoUrl(null);
            setYoutubeUrl("");
            setThumbnailFile(null);
        }

        if (type === "video") {
            await handleVideoSelect(file);
        }
    }, [handleVideoSelect]);

    // ============================================================
    // 🟦 RENDER PREVIEW
    // ============================================================
    const renderPreview = () => {
        // 🆕 Mostra loading enquanto gera thumbnail
        if (isGeneratingThumbnail) {
            return (
                <div className="w-full h-48 flex flex-col items-center justify-center bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-purple-600 font-medium">
                        Gerando thumbnail do vídeo...
                    </p>
                </div>
            );
        }

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
                    
                    {/* 🆕 Badge indicando que thumbnail foi gerada */}
                    {thumbnailFile && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            ✅ Thumbnail gerada
                        </div>
                    )}
                    
                    <button
                        type="button"
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        onClick={() => {
                            setVideoFile(null);
                            setVideoUrl(null);
                            setThumbnailFile(null); // 🆕 Limpa thumbnail
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
    // 🟦 HANDLE SAVE - VERSÃO FINAL COM THUMBNAIL
    // ============================================================
    const handleSave = async () => {
        console.log("💾 [TemplateModal] handleSave INICIADO");

        if (!title.trim()) {
            toast.error("Título é obrigatório");
            return;
        }

        if (!content.trim()) {
            toast.error("Conteúdo é obrigatório");
            return;
        }

        setIsSaving(true);

        try {
            // ============================================================
            // 🏷️ TAGS
            // ============================================================
            const tagsArray = tagsInput
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

            // ============================================================
            // 🟢 CATEGORY_ID
            // ============================================================
            const categoryId =
                selectedCategories.length > 0
                    ? Number(selectedCategories[0])
                    : null;

            // ============================================================
            // 📦 FORMDATA (SEMPRE USADO AGORA)
            // ============================================================
            const formData = new FormData();

            formData.append("title", title);
            formData.append("description", description);
            formData.append("content", content);
            formData.append("tags", JSON.stringify(tagsArray));
            formData.append("platform", platform || "");
            formData.append(
                "category_id",
                categoryId !== null ? String(categoryId) : ""
            );

            // 🖼️ IMAGEM
            if (imageFile) {
                formData.append("image", imageFile);
                console.log("📎 Anexando imagem");
            }

            // 🎬 VÍDEO + THUMBNAIL
            if (videoFile) {
                formData.append("video", videoFile);
                console.log("📎 Anexando vídeo");
                
                // 🆕 ENVIA THUMBNAIL GERADA
                if (thumbnailFile) {
                    formData.append("thumbnail", thumbnailFile);
                    console.log("📎 Anexando thumbnail gerada");
                } else {
                    console.warn("⚠️ Vídeo sem thumbnail!");
                }
            }

            // ▶️ YOUTUBE
            const ytId = extractYouTubeId(youtubeUrl);
            if (ytId) {
                formData.append("youtube_url", youtubeUrl);
                formData.append(
                    "thumb_url",
                    `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                );
                console.log("📎 Anexando YouTube URL");
            }

            // 📎 ARQUIVOS EXTRAS
            if (extraFiles && extraFiles.length > 0) {
                extraFiles.forEach(file => {
                    formData.append("extra_files", file);
                });
                console.log(`📎 Anexando ${extraFiles.length} arquivos extras`);
            }

            // ============================================================
            // 🚀 SALVAR
            // ============================================================
            console.log("🚀 Enviando FormData para backend...");
            await onSave(formData, template?.id || null);

            setIsSaving(false);
            onClose();

        } catch (err) {
            console.error("❌ Erro ao salvar template:", err);
            toast.error("Erro ao salvar template");
            setIsSaving(false);
        }
    };

    // ============================================================
    // 🔴 REMOVER ARQUIVO EXTRA EXISTENTE
    // ============================================================
    const handleDeleteExistingFile = async (fileId) => {
        if (!window.confirm("Deseja remover este arquivo?")) return;

        try {
            console.log(`🗑️ Removendo arquivo ID ${fileId}...`);
            await api.delete(`/templates/files/${fileId}`);
            setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
            toast.success("Arquivo removido");
            console.log("   ✅ Arquivo removido com sucesso");
        } catch (error) {
            console.error("   ❌ Erro ao remover arquivo:", error);
            toast.error("Erro ao remover arquivo");
        }
    };

    // ============================================================
    // 🟦 JSX - FORMULÁRIO COMPLETO
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
                        {videoFile && !thumbnailFile && (
                            <span className="block mt-2 text-yellow-600 font-medium">
                                ⚠️ Thumbnail não gerada para este vídeo
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* LAYOUT 2 COLUNAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                    
                    {/* ========== COLUNA ESQUERDA - MÍDIA ========== */}
                    <div className="space-y-4">
                        {/* PREVIEW */}
                        <div>{renderPreview()}</div>

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
                                    disabled={isGeneratingThumbnail}
                                />
                            </label>

                            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md">
                                <Video className="w-5 h-5" />
                                <span className="font-medium">
                                    {isGeneratingThumbnail ? "Processando..." : "Upload Vídeo"}
                                </span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    disabled={isGeneratingThumbnail}
                                />
                            </label>
                            
                            {isGeneratingThumbnail && (
                                <p className="text-xs text-purple-600 text-center font-medium">
                                    🎬 Gerando thumbnail automaticamente...
                                </p>
                            )}
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

                            {/* 🔵 ARQUIVOS JÁ EXISTENTES */}
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
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();

                                                        try {
                                                            const response = await fetch(file.file_url, { method: "GET" });
                                                            const blob = await response.blob();
                                                            const blobUrl = window.URL.createObjectURL(blob);

                                                            const a = document.createElement("a");
                                                            a.href = blobUrl;
                                                            a.download = file.file_name;
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

                            {/* LISTA DOS ARQUIVOS SELECIONADOS (NOVOS) */}
                            {extraFiles && extraFiles.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <label className="text-sm font-semibold block">
                                        Novos arquivos a adicionar:
                                    </label>

                                    {extraFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
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
                                    setThumbnailFile(null);
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

                        {/* PLATFORM */}
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
                        disabled={isSaving || isGeneratingThumbnail}
                        className="px-6"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isGeneratingThumbnail}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 px-6"
                    >
                        {isSaving
                            ? "Salvando..."
                            : isGeneratingThumbnail
                            ? "Processando vídeo..."
                            : isEdit
                            ? "Salvar Alterações"
                            : "Criar Template"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}