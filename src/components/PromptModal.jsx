// FASE 0 — PARTE 1/4
// Arquivo: src/components/PromptModal.jsx
// Este arquivo ainda NÃO tem lógica interna.
// Apenas define a estrutura do componente e as props necessárias.

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
import { X, Trash2, Download, Plus } from "lucide-react";




export default function PromptModal({
  // 🔵 CONTROLE DE ABERTURA
  isOpen,
  onOpenChange,

  // 🔵 FORMULÁRIO (estados vêm do PromptManager)
  promptForm,
  setPromptForm,
  formErrors,
  setFormErrors,

  // 🔵 EDIT MODE
  editingPrompt,
  isEditMode,

  // 🔵 CATEGORIAS
  myCategories,

  // 🔵 FUNÇÕES DE MÍDIA
  handleImageUpload,
  removeImage,
  handleVideoUpload,
  extractYouTubeId,
  getYouTubeThumbnail,

  // 🔵 ANEXOS EXISTENTES
  attachments,
  removeAttachment,

  // 🔵 ARQUIVOS EXTRAS
  extraFiles,
  extraFilesInputRef,
  handleExtraFiles,
  removeExtraFile,
  clearAllExtraFiles,

  // 🔵 SALVAR / CANCELAR
  isSaving,
  savePrompt,
  resetPromptForm,
}) {


  useEffect(() => {
  if (!promptForm) {
    console.log("⚠️ promptForm ainda não foi inicializado");
    return;
  }
  
  console.log("🟧 PROMPT FORM RECEIVED:", promptForm);
  console.log("  📸 image_url:", promptForm.image_url);
  console.log("  🎬 video_url:", promptForm.video_url);
  console.log("  🔗 youtube_url:", promptForm.youtube_url);
  console.log("  📺 selectedMedia:", promptForm.selectedMedia);
}, [promptForm]);


   useEffect(() => {
    console.log("🟧 PROMPT FORM RECEIVED:", promptForm);
  }, [promptForm]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    
      <DialogContent
  className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 
             bg-white dark:bg-slate-900 shadow-xl rounded-xl"
>

        
        <DialogHeader>
          <DialogTitle>
            {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
          </DialogTitle>
          <DialogDescription>
            {editingPrompt
              ? "Edite os detalhes do seu prompt"
              : "Crie um novo prompt"}
          </DialogDescription>
        </DialogHeader>

<div className="grid grid-cols-1 md:grid-cols-2 gap-10">

  <section className="space-y-4 md:col-span-1"> 
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
    Informações básicas
  </h3>

   
    <div>
      <Label>Título</Label>
      <Input
        value={promptForm.title}
        onChange={(e) => {
          const value = e.target.value;
          setPromptForm((prev) => ({ ...prev, title: value }));

          if (!value.trim()) {
            setFormErrors((prev) => ({
              ...prev,
              title: "Título é obrigatório",
            }));
          } else {
            setFormErrors((prev) => ({ ...prev, title: "" }));
          }
        }}
        placeholder="Título do prompt"
        className={formErrors.title ? "border-red-500" : ""}
      />
      {formErrors.title && (
        <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>
      )}
    </div>

  
    <div>
      <Label>PROMPT</Label>
      <Textarea
        value={promptForm.content}
        onChange={(e) => {
          const value = e.target.value;
          setPromptForm((prev) => ({ ...prev, content: value }));

          if (!value.trim()) {
            setFormErrors((prev) => ({
              ...prev,
              content: "Conteúdo é obrigatório",
            }));
          } else {
            setFormErrors((prev) => ({ ...prev, content: "" }));
          }
        }}
        rows={10}
        placeholder="Como criar prompt…"
        className={`w-full max-h-96 overflow-y-auto resize-y whitespace-pre-wrap break-words ${
          formErrors.content ? "border-red-500" : ""
        }`}
      />
      {formErrors.content && (
        <p className="text-xs text-red-500 mt-1">{formErrors.content}</p>
      )}
    </div>


    <div>
      <Label>Descrição</Label>
      <Textarea
        value={promptForm.description}
        onChange={(e) =>
          setPromptForm((prev) => ({
            ...prev,
            description: e.target.value,
          }))
        }
        placeholder="Descrição opcional…"
      />
    </div>


    <div>
      <Label>Tags (separadas por vírgula)</Label>
      <Input
        value={promptForm.tags}
        onChange={(e) =>
          setPromptForm((prev) => ({ ...prev, tags: e.target.value }))
        }
        placeholder="ex: IA, automação, produtividade"
      />
    </div>
  </section>


<section className="space-y-6 md:col-span-1">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
    Mídia
  </h3>

  
  <div className="space-y-2">
    <Label className="text-sm font-medium">Tipo de mídia</Label>

    <div className="flex flex-wrap gap-2">
      {[
        { key: "none", label: "Nenhum", icon: "❌" },
        { key: "image", label: "Imagem", icon: "📷" },
        { key: "video", label: "Vídeo", icon: "🎥" },
        { key: "youtube", label: "YouTube", icon: "🔗" },
      ].map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() =>
            setPromptForm((prev) => {
              const updated = { ...prev, selectedMedia: key };

              if (key === "image") {
                updated.video_url = "";
                updated.youtube_url = "";
                updated.videoFile = null;
              }
              if (key === "video") {
                updated.youtube_url = "";
              }
              if (key === "youtube") {
                updated.image_url = "";
                updated.video_url = "";
                updated.imageFile = null;
                updated.videoFile = null;
              }
              if (key === "none") {
                updated.image_url = "";
                updated.video_url = "";
                updated.youtube_url = "";
                updated.imageFile = null;
                updated.videoFile = null;
              }
              return updated;
            })
          }
          className={`px-3 py-1.5 text-sm rounded-md border transition ${
            promptForm.selectedMedia === key
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span className="mr-1">{icon}</span> {label}
        </button>
      ))}
    </div>
  </div>

  
{promptForm.selectedMedia === "image" && (
  <div className="space-y-3">
    <Label>Upload de imagem</Label>

    {promptForm.image_url ? (
      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
        <img
          src={
            // ✅ RESOLVER URL RELATIVA PARA ABSOLUTA
            promptForm.image_url.startsWith('http') 
              ? promptForm.image_url 
              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${promptForm.image_url}`
          }
          alt="Preview"
          className="object-contain w-full h-full"
          onError={(e) => {
            console.error("❌ Erro ao carregar imagem:", promptForm.image_url);
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23ccc'%3EErro%3C/text%3E%3C/svg%3E";
          }}
        />
        <button
          type="button"
          onClick={removeImage}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <label
        htmlFor="prompt-image-upload"
        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800"
      >
        <span className="text-sm text-slate-600 dark:text-slate-300">
          Selecione uma imagem
        </span>
        <input
          id="prompt-image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>
    )}
  </div>
)}

  
{promptForm.selectedMedia === "video" && (
  <div className="space-y-3">
    <Label>Upload de vídeo</Label>

    <input
      type="file"
      accept="video/mp4,video/webm,video/ogg"
      onChange={handleVideoUpload}
      className="border p-2 rounded-lg w-full bg-white dark:bg-slate-800"
    />

    <div className="w-full rounded-lg overflow-hidden bg-black flex justify-center items-center h-[260px]">
      {promptForm.videoFile ? (
        // Vídeo novo (upload local)
        <video
          src={URL.createObjectURL(promptForm.videoFile)}
          controls
          className="max-h-[260px] w-auto rounded-lg"
        />
      ) : promptForm.video_url ? (
        // Vídeo existente (do banco)
        <video
          src={
            promptForm.video_url.startsWith('http') 
              ? promptForm.video_url 
              : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${promptForm.video_url}`
          }
          controls
          className="max-h-[260px] w-auto rounded-lg"
          onError={(e) => {
            console.error("❌ Erro ao carregar vídeo:", promptForm.video_url);
          }}
        />
      ) : promptForm.image_url ? (
        // Thumbnail
        <img
          src={promptForm.image_url}
          alt="Thumb"
          className="max-h-[260px] w-auto object-contain rounded-lg"
        />
      ) : (
        // Placeholder
        <div className="text-white text-sm">Nenhum vídeo selecionado</div>
      )}
    </div>
  </div>
)}

 
  {promptForm.selectedMedia === "youtube" && (
    <div className="space-y-3">

      <Label>Link do YouTube</Label>

      <Input
        type="text"
        inputMode="url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={promptForm.youtube_url || ""}
        onChange={(e) =>
          setPromptForm((prev) => ({
            ...prev,
            youtube_url: e.target.value.trim(),
          }))
        }
      />

      <div className="w-full rounded-lg overflow-hidden bg-black flex justify-center items-center h-[260px]">
        {extractYouTubeId(promptForm.youtube_url) ? (
          <div
            onClick={() => window.open(promptForm.youtube_url, "_blank")}
            className="cursor-pointer"
          >
            <img
              src={getYouTubeThumbnail(promptForm.youtube_url)}
              alt="Preview YouTube"
              className="max-h-[260px] w-auto object-contain rounded-lg"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-white text-sm select-none">
            Cole um link válido do YouTube…
          </div>
        )}
      </div>

    </div>
  )}

</section>


<section className="space-y-6 md:col-span-1">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
    Arquivos
  </h3>

  
  {attachments.length > 0 && (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Arquivos anexados</Label>

      <div className="space-y-2">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
          >
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              📎 {file.file_name}
            </div>

            <div className="flex items-center gap-2">
            
              <a
                href={file.file_url}
                download={file.file_name}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();

                  const link = document.createElement("a");
                  link.href = file.file_url;
                  link.download = file.file_name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Baixar
              </a>

             
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAttachment(file.id, editingPrompt?.id);
                }}
                className="text-red-600 dark:text-red-400 text-xs hover:underline cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  
  <div className="space-y-3">

    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">Arquivos extras (PNG/JPG)</Label>

      {extraFiles.length > 0 && (
        <span className="text-xs text-slate-500">
          {extraFiles.length} arquivo{extraFiles.length > 1 ? "s" : ""}
        </span>
      )}
    </div>

   
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
      className="text-sm px-3 py-1 w-full"
      onClick={() => extraFilesInputRef.current?.click()}
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar arquivos
    </Button>

  
    {extraFiles.length > 0 && (
      <div className="space-y-2">

   
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Arquivos selecionados:</span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllExtraFiles}
            className="text-xs text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar todos
          </Button>
        </div>

     
        <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-2">
          {extraFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">📎</span>

                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  {file.name}
                </span>

                <span className="text-xs text-slate-500">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
              </div>

           
              <button
                type="button"
                onClick={() => removeExtraFile(index)}
                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title={`Remover ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}

  </div>

</section>


<section className="space-y-6 md:col-span-1">
  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
    Detalhes do Prompt
  </h3>


  <div className="space-y-2">
    <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
      Categoria
    </Label>

    <Select
      value={promptForm.category_id}
      onValueChange={(value) =>
        setPromptForm((prev) => ({ ...prev, category_id: value }))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma categoria" />
      </SelectTrigger>

      <SelectContent className="max-h-[220px] overflow-y-auto z-50">
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
    <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">
      Plataforma
    </Label>

    <Select
      value={promptForm.platform}
      onValueChange={(value) =>
        setPromptForm((prev) => ({ ...prev, platform: value }))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione uma plataforma" />
      </SelectTrigger>

      <SelectContent className="z-50">
        <SelectItem value="chatgpt">🤖 ChatGPT</SelectItem>
        <SelectItem value="nanobanana">🍌 Nano Banana</SelectItem>
        <SelectItem value="gemini">✨ Gemini</SelectItem>
        <SelectItem value="veo3">🎥 VEO3</SelectItem>
        <SelectItem value="manus">📝 Manus</SelectItem>
        <SelectItem value="claude">🧠 Claude</SelectItem>
      </SelectContent>
    </Select>
  </div>


  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="prompt-favorite"
      checked={promptForm.is_favorite}
      onChange={(e) =>
        setPromptForm((prev) => ({
          ...prev,
          is_favorite: e.target.checked,
        }))
      }
      className="form-checkbox h-4 w-4 text-blue-600"
    />
    <Label htmlFor="prompt-favorite">Marcar como favorito</Label>
  </div>

</section>
</div>

<div className="flex justify-end gap-2 mt-6 pt-4 border-t">
  <Button
    variant="outline"
    onClick={() => {
      resetPromptForm();
      onOpenChange(false);
    }}
  >
    Cancelar
  </Button>

  <Button
    disabled={isSaving}
    onClick={async () => {
      if (!isSaving) await savePrompt();
    }}
    className={isSaving ? "opacity-50 cursor-not-allowed" : ""}
  >
    {isSaving ? "Salvando..." : editingPrompt ? "Salvar" : "Criar"}
  </Button>
</div>

      </DialogContent>
    </Dialog>
  );
}
