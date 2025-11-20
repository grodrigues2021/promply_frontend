import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}


// Este modal será usado para:
// - Criar Template
// - Editar Template
// Recebe:
// open: boolean
// onClose: function
// template: objeto OU null

export function TemplateModal({ open, onClose, template }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.is_admin === true;
// ================================
// BUSCAR CATEGORIAS DA API
// ================================
const { data: categoriesResponse, isLoading: loadingCategories } = useQuery({
  queryKey: ["categories"],
  queryFn: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.json();
  },
});



const categories = categoriesResponse?.templates || [];


  // ===============================
  // ESTADOS PRINCIPAIS DO TEMPLATE
  // ===============================

  // Se template existe → edição
  // Se template é null → criação
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [content, setContent] = useState(template?.content || "");

  const [tags, setTags] = useState(template?.tags || []);
  const [categoryId, setCategoryId] = useState(template?.category_id || null);

  // Mídia atual
  const [imageUrl, setImageUrl] = useState(template?.image_url || null);
  const [videoUrl, setVideoUrl] = useState(template?.video_url || null);
  const [thumbUrl, setThumbUrl] = useState(template?.thumb_url || null);

  // Arquivo novo selecionado pelo usuário
  const [selectedFile, setSelectedFile] = useState(null);

  // Estado de carregamento (upload ou salvar)
  const [isSaving, setIsSaving] = useState(false);

  const [youtubeUrl, setYoutubeUrl] = useState("");


  // ===============================
  // QUANDO TROCA O TEMPLATE (editar)
  // ===============================
useEffect(() => {
  if (template) {
    // Editar template existente
    setTitle(template.title || "");
    setDescription(template.description || "");
    setContent(template.content || "");

    setTags(template.tags || []);
    setCategoryId(template.category_id || null);

    // Detectar YouTube
    const isYouTube = template.video_url && extractYouTubeId(template.video_url);

    setYoutubeUrl(isYouTube ? template.video_url : "");

    // Se for YouTube → limpar mídia local
    setImageUrl(isYouTube ? null : (template.image_url || null));
    setVideoUrl(template.video_url || null);
    setThumbUrl(template.thumb_url || null);

  } else {
    // Criar template novo → limpar tudo
    setTitle("");
    setDescription("");
    setContent("");


    setTags([]);
    setCategoryId(null);

    setYoutubeUrl("");
    setImageUrl(null);
    setVideoUrl(null);
    setThumbUrl(null);
  }
}, [template]);


 const handleFileSelect = async (file) => {
  if (!file) return;

  // Sempre limpar YouTube ao enviar arquivo
  setYoutubeUrl("");
  setVideoUrl(null);

  setSelectedFile(file);

  // Se for imagem, já gerar URL local para preview
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result);
      setThumbUrl(null);
    };
    reader.readAsDataURL(file);
  }

  // Se for vídeo MP4
  if (file.type.startsWith("video/")) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(null);
      setVideoUrl(reader.result); // preview local
      setThumbUrl(null);
    };
    reader.readAsDataURL(file);
  }
};


  // ===================================================
// SALVAR TEMPLATE (CRIAR ou EDITAR) — PROTEGIDO POR ADMIN
// ===================================================
const handleSave = async () => {
  if (!isAdmin) {
    console.warn("Usuário não pode criar/editar templates.");
    return;
  }

  if (!title.trim()) {
    alert("O template precisa ter um título.");
    return;
  }

  setIsSaving(true);

  try {
    const isYouTube = videoUrl && extractYouTubeId(videoUrl);

const payload = {
  title,
  description,
  content,
  tags,
  category_id: categoryId,
  image_url: isYouTube ? null : imageUrl,
  video_url: isYouTube ? videoUrl : (videoUrl || null),
  thumb_url: isYouTube ? null : thumbUrl,
};



    if (template) {
      // ============================
      // UPDATE TEMPLATE EXISTENTE
      // ============================
      await updateMutation.mutateAsync({ id: template.id, data: payload });

    } else {
      // ============================
      // CREATE NOVO TEMPLATE
      // ============================
      await createMutation.mutateAsync(payload);
    }

    // Forçar refetch da listagem de templates
    queryClient.invalidateQueries(["templates"]);

    // Fechar modal
    onClose();

  } catch (error) {
    console.error("Erro ao salvar template:", error);
    alert("Erro ao salvar template");
  } finally {
    setIsSaving(false);
  }
};

// ================================
// MUTATION: CRIAR TEMPLATE
// ================================
const createMutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error("Resposta vazia do servidor");
    }

    return JSON.parse(text);
  }
});

// ================================
// MUTATION: EDITAR TEMPLATE
// ================================
const updateMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/templates/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error("Resposta vazia do servidor");
    }

    return JSON.parse(text);
  }
});
// ===============================
// RESETAR ESTADOS AO FECHAR MODAL
// ===============================
const resetAll = () => {
  setTitle("");
  setDescription("");
  setContent("");
  setTags([]);
  setCategoryId(null);
  setImageUrl(null);
  setVideoUrl(null);
  setThumbUrl(null);
  setYoutubeUrl("");
  setSelectedFile(null);
};

  // ===============================
  // RENDERIZAÇÃO BÁSICA (SEM UI FINAL)
  // Apenas declara o esqueleto do modal
  // ===============================
  return (
  <Dialog
    open={open}
    onOpenChange={(state) => {
      if (!state) resetAll();
      onClose();
    }}
  >
<DialogContent 
  className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-100 rounded-2xl p-6"
>

        <DialogHeader>
          
          <DialogTitle>
            {template ? "Editar Template" : "Criar Template"}
          </DialogTitle>
        </DialogHeader>

 {/* =============================== */}
{/*   LAYOUT HÍBRIDO (PREVIEW + FORM) */}
{/* =============================== */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

  {/* ======================== */}
  {/*        PREVIEW (ESQ.)     */}
  {/* ======================== */}
  <div className="border rounded-xl bg-slate-50 p-4 flex items-center justify-center min-h-[280px] overflow-hidden">

    {/* PLACEHOLDER SEM MÍDIA */}
    {!imageUrl && !videoUrl && !thumbUrl && (
      <div className="text-slate-400 text-center flex flex-col items-center">
        <div className="bg-white p-4 rounded-full shadow-sm mb-3">
          <img
            src="https://cdn-icons-png.flaticon.com/512/6897/6897039.png"
            className="h-12 w-12 opacity-30"
          />
        </div>
        <p className="font-medium opacity-70">Nenhuma mídia selecionada</p>
        <p className="text-xs opacity-60">Envie uma imagem ou vídeo</p>
      </div>
    )}
{/* YOUTUBE PREVIEW */}
{videoUrl && extractYouTubeId(videoUrl) && (
  <iframe
    className="w-full h-full rounded-lg"
    src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
    title="YouTube Preview"
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
)}

{/* IMAGEM */}
{imageUrl && !extractYouTubeId(videoUrl) && (
  <img
    src={imageUrl}
    alt="preview"
    className="w-full h-full object-cover rounded-lg transition-transform duration-500 hover:scale-105 cursor-pointer"
  />
)}

{/* VÍDEO - MP4 */}
{videoUrl && !extractYouTubeId(videoUrl) && (
  <video
    src={videoUrl}
    poster={thumbUrl || imageUrl || ""}
    controls
    className="w-full h-full object-cover rounded-lg shadow-md"
  />
)}

  </div>

  {/* ======================== */}
  {/*          FORM (DIR.)     */}
  {/* ======================== */}
  <div className="space-y-4">

    {/* TÍTULO */}
    <div>
      <label className="text-sm font-medium">Título</label>
      <input
  type="text"
  value={title}
  onChange={(e) => isAdmin && setTitle(e.target.value)}
  disabled={!isAdmin}
  className="w-full mt-1 p-2 border rounded-md disabled:bg-slate-100 disabled:opacity-70"
  placeholder="Nome do template"
/>

    </div>

    {/* DESCRIÇÃO */}
    <div>
      <label className="text-sm font-medium">Descrição</label>
      <textarea
  value={description}
  onChange={(e) => isAdmin && setDescription(e.target.value)}
  disabled={!isAdmin}
  rows={2}
  className="w-full mt-1 p-2 border rounded-md resize-none overflow-hidden disabled:bg-slate-100 disabled:opacity-70"
  onInput={(e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + 'px';
  }}
  placeholder="Descreva o propósito do template..."
/>
{/* CONTEÚDO DO PROMPT */}
<div>
  <label className="text-sm font-medium">Conteúdo do Prompt</label>
  <textarea
    value={content}
    onChange={(e) => isAdmin && setContent(e.target.value)}
    disabled={!isAdmin}
    rows={4}
    className="w-full mt-1 p-2 border rounded-md resize-none overflow-hidden disabled:bg-slate-100 disabled:opacity-70"
    onInput={(e) => {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + 'px';
    }}
    placeholder="Digite o prompt completo..."
  />
</div>


    </div>

{/* CATEGORIA */}
<div>
  <label className="text-sm font-medium">Categoria</label>

  {loadingCategories ? (
    <div className="text-xs text-slate-400 mt-1">Carregando categorias...</div>
  ) : (
    <Select
      disabled={!isAdmin}
      value={categoryId ? String(categoryId) : "none"}
      onValueChange={(value) => {
        if (!isAdmin) return;
        setCategoryId(value === "none" ? null : Number(value));
      }}
    >
      <SelectTrigger className="w-full mt-1">
        <SelectValue placeholder="Selecione uma categoria" />
      </SelectTrigger>

      <SelectContent>
  <SelectItem value="none">Sem categoria</SelectItem>

  {!loadingCategories && categories && categories.length > 0 ? (
    categories.map((cat) => (
      <SelectItem key={cat.id} value={String(cat.id)}>
        {cat.name}
      </SelectItem>
    ))
  ) : (
    <div className="px-3 py-2 text-sm text-gray-500">Nenhuma categoria encontrada</div>
  )}
</SelectContent>

    </Select>
  )}
</div>



   {/* TAGS */}
<div>
  <label className="text-sm font-medium">Tags</label>

  {/* TAGS COMO CHIPS */}
  <div className="flex flex-wrap gap-2 mt-2">
    {tags.map((tag, index) => (
      <div
        key={index}
        className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
      >
        <span>{tag}</span>
        <button
          type="button"
          onClick={() => {
            setTags(tags.filter((_, i) => i !== index));
          }}
          className="hover:text-red-500 text-purple-600"
        >
          ×
        </button>
      </div>
    ))}
  </div>

  {/* INPUT INTELIGENTE DE TAGS */}
 <input
  type="text"
  className="w-full mt-2 p-2 border rounded-md disabled:bg-slate-100 disabled:opacity-70"
  placeholder="Digite uma tag e pressione Enter..."
  disabled={!isAdmin}
  onKeyDown={(e) => {
    if (!isAdmin) return;

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !tags.includes(value.toLowerCase())) {
        setTags([...tags, value.toLowerCase()]);
      }
      e.target.value = "";
    }

    if (e.key === "Backspace" && e.target.value === "") {
      setTags(tags.slice(0, -1));
    }
  }}
/>

</div>


  </div>
</div>


{/* BOTÕES – protegidos por admin */}
<div className="flex justify-end gap-3 pt-4">
  <button
    onClick={onClose}
    className="px-4 py-2 bg-slate-200 rounded-md hover:bg-slate-300"
  >
    Fechar
  </button>

  {isAdmin && (
    <button
      onClick={handleSave}
      disabled={isSaving}
      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
    >
      {template ? "Salvar Alterações" : "Criar Template"}
    </button>
  )}
</div>

{/* YOUTUBE URL */}
<div className="mt-6">
  <label className="text-sm font-medium">URL do YouTube (opcional)</label>

  <input
    type="text"
    value={youtubeUrl}
    onChange={(e) => {
      const url = e.target.value;
      setYoutubeUrl(url);

      const id = extractYouTubeId(url);

      if (id) {
        // limpar mídia local
        setImageUrl(null);
        setVideoUrl(url);
        setThumbUrl(null);
        setSelectedFile(null);
      }
    }}
    disabled={!isAdmin}
    placeholder="Cole aqui um link do YouTube..."
    className="w-full mt-1 p-2 border rounded-md disabled:bg-slate-100 disabled:opacity-70"
  />
</div>


{/* =============================== */}
{/*      UPLOAD DE MÍDIA (REAL)     */}
{/* =============================== */}
<div className="border-t pt-4 mt-4">

  <label className="text-sm font-medium">Mídia (imagem ou vídeo)</label>

  <input
  type="file"
  accept="image/*,video/*"
  disabled={!isAdmin}
  onChange={(e) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileSelect(file);
  }}
  className="mt-2 disabled:opacity-60"
/>


  {/* Se o usuário selecionou ARQUIVO e ainda não fez upload */}
  {selectedFile && (
    <div className="mt-3 text-xs text-purple-600">
      Arquivo selecionado: {selectedFile.name}
    </div>
  )}

  {/* BOTÃO PARA ENVIAR ARQUIVO */}
  {selectedFile && (
    <button
      onClick={async () => {
        try {
          setIsSaving(true);

          const formData = new FormData();
          formData.append("file", selectedFile);

          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/upload/template`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            }
          );

          const data = await response.json();

          // Define URLs conforme retorno do backend
          // Sempre limpar YouTube ao enviar arquivo
setYoutubeUrl("");

// Atualizar URLs retornadas pelo backend
setImageUrl(data.image_url || null);
setVideoUrl(data.video_url || null);

// Thumbnail (para vídeos)
setThumbUrl(data.thumb_url || null);

// limpar seleção
setSelectedFile(null);

        } catch (err) {
          console.error("Erro ao enviar mídia:", err);
        } finally {
          setIsSaving(false);
        }
      }}
      className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
      disabled={isSaving}
    >
      {isSaving ? "Enviando mídia..." : "Enviar arquivo"}
    </button>
  )}

 {/* BOTÃO DE REMOVER MÍDIA */}
{isAdmin && (imageUrl || videoUrl) && (
  <button
    onClick={() => {
      setImageUrl(null);
      setVideoUrl(null);
      setThumbUrl(null);
      setSelectedFile(null);
      setYoutubeUrl(""); // garantir remoção de YouTube

    }}
    className="ml-3 mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
  >
    Remover mídia
  </button>
)}


</div>

   
      </DialogContent>
    </Dialog>
  );
}
