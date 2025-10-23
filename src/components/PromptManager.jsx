import { toast } from 'sonner'
import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ScrollArea } from './ui/scroll-area'
import { Label } from './ui/label'
import {
  Search,
  Copy,
  Edit,
  Edit3,
  Trash2,
  StarOff,
  Database,
  FolderPlus,
  Tag,
  BookOpen,
  Heart,
  Share2,
  X,
  BookTemplate,
  LibraryBig,
  
  BookText,
  MessageSquare,
  Star,
  Plus,
  Download
} from 'lucide-react'
import PromplyLogo from "../assets/promply-logo.svg"
import { useAuth } from '../hooks/useAuth'
import TemplatesPage from './TemplatesPage.jsx'
import ChatModal from './ChatModal'
import SharePromptModal from './SharePromptModal'



const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export default function PromptManager({ user, setIsAuthenticated, setUser }) {
  const { logout } = useAuth()
  const [prompts, setPrompts] = useState([])
  const [myCategories, setMyCategories] = useState([])
  const [templateCategories, setTemplateCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [stats, setStats] = useState({})
  const [dbConnected, setDbConnected] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [promptToShare, setPromptToShare] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showVideoModal, setShowVideoModal] = useState(false);
const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

const openVideoModal = (url) => {
  setCurrentVideoUrl(url);
  setShowVideoModal(true);
};


  const extractYouTubeId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};


  const [promptForm, setPromptForm] = useState({
    title: '',
    content: '',
    description: '',
    tags: '',
    category_id: 'none',
    is_favorite: false,
    image_url: '',
    video_url: ''
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_template: false
  })

  useEffect(() => {
    loadPrompts()
    loadCategories()
    loadStats()
  }, [])

  if (showTemplates) {
    return <TemplatesPage user={user} onBack={() => setShowTemplates(false)} />
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      window.location.href = '/'
    }
  }

  const filteredPrompts = Array.isArray(prompts)
    ? prompts.filter(prompt => {
        const matchesSearch =
          (prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (prompt.tags && (
              Array.isArray(prompt.tags)
                ? prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                : prompt.tags.toLowerCase().includes(searchTerm.toLowerCase())
            )))
        const matchesCategory = !selectedCategory || prompt.category_id === selectedCategory
        const matchesFavorites = !showFavoritesOnly || prompt.is_favorite
        return matchesSearch && matchesCategory && matchesFavorites
      })
    : []
  const loadPrompts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompts`, { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setPrompts(Array.isArray(data.data) ? data.data : [])
      } else {
        setPrompts([])
      }
    } catch {
      setDbConnected(false)
      setPrompts([])
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setMyCategories(data.categories || [])
        setTemplateCategories(data.templates || [])
      }
    } catch {
      setMyCategories([])
      setTemplateCategories([])
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, { credentials: 'include' })
      const data = await response.json()
      if (data.success) setStats(data.data || {})
    } catch {
      setStats({})
    }
  }

  const savePrompt = async () => {
    try {
      const url = editingPrompt
        ? `${API_BASE_URL}/prompts/${editingPrompt.id}`
        : `${API_BASE_URL}/prompts`
      const method = editingPrompt ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...promptForm,
          tags: typeof promptForm.tags === 'string'
            ? promptForm.tags.split(',').map(t => t.trim()).filter(Boolean)
            : promptForm.tags
        })
      })
      const data = await response.json()
      if (data.success) {
        loadPrompts()
        loadStats()
        resetPromptForm()
        setIsPromptDialogOpen(false)
      } else toast.error(data.error || 'Erro ao salvar prompt')
    } catch {
      toast.error('Erro ao salvar prompt')
    }
  }

  const saveCategory = async () => {
    try {
      const url = editingCategory
        ? `${API_BASE_URL}/categories/${editingCategory.id}`
        : `${API_BASE_URL}/categories`
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(categoryForm)
      })
      const data = await response.json()
      if (data.success) {
        loadCategories()
        loadStats()
        resetCategoryForm()
        setIsCategoryDialogOpen(false)
      } else toast.error(data.error || 'Erro ao salvar categoria')
    } catch {
      toast.error('Erro ao salvar categoria')
    }
  }

  const deletePrompt = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este prompt?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        loadPrompts()
        loadStats()
      } else toast.error(data.error || 'Erro ao deletar prompt')
    } catch {
      toast.error('Erro ao deletar prompt')
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        loadCategories()
        loadStats()
        if (selectedCategory === id) setSelectedCategory(null)
      } else toast.error(data.error || 'Erro ao deletar categoria')
    } catch {
      toast.error('Erro ao deletar categoria')
    }
  }


// ✅ Atualização otimista de favoritos
const toggleFavorite = async (prompt) => {
  setPrompts((prev) =>
    prev.map((p) =>
      p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
    )
  );

  try {
    const response = await fetch(`${API_BASE_URL}/prompts/${prompt.id}/favorite`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    if (data.success) {
      loadStats(); // atualiza apenas os contadores
    }

    if (!data.success) {
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );
      toast.error('Erro ao atualizar favorito');
    }
  } catch (err) {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === prompt.id ? { ...p, is_favorite: !p.is_favorite } : p
      )
    );
    toast.error('Erro ao conectar ao servidor');
  }
};


  const copyToClipboard = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      await fetch(`${API_BASE_URL}/prompts/${prompt.id}/copy`, {
        method: 'POST',
        credentials: 'include'
      })
      loadPrompts()
      toast.success('Prompt copiado!')
    } catch {
      toast.error('Erro ao copiar prompt')
    }
  }

  const resetPromptForm = () => {
    setPromptForm({
      title: '',
      content: '',
      description: '',
      tags: '',
      category_id: 'none',
      is_favorite: false,
      image_url: '',
      video_url: ''
    })
    setEditingPrompt(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3B82F6',
      is_template: false
    })
    setEditingCategory(null)
  }

  const normalizeTags = (tags) => {
    if (!tags) return ''
    if (Array.isArray(tags)) return tags.join(', ')
    return tags
  }

  const editPrompt = (prompt) => {
    setPromptForm({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      tags: normalizeTags(prompt.tags),
      category_id: prompt.category?.id ? String(prompt.category.id) : (prompt.category_id ? String(prompt.category_id) : 'none'),
      is_favorite: prompt.is_favorite,
      image_url: prompt.image_url || '',
      video_url: prompt.video_url || ''
    })
    setEditingPrompt(prompt)
    setIsPromptDialogOpen(true)
  }

  const editCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      is_template: category.is_template || false
    })
    setEditingCategory(category)
    setIsCategoryDialogOpen(true)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande! Máx. 5MB')
      return
    }

    setUploadingImage(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPromptForm({ ...promptForm, image_url: reader.result })
      setUploadingImage(false)
      toast.success('Imagem carregada!')
    }
    reader.onerror = () => {
      toast.error('Erro ao carregar imagem')
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setPromptForm({ ...promptForm, image_url: '' })
    toast.success('Imagem removida')
  }

  const openImageModal = (imageBase64, title) => {
    setSelectedImage({ url: imageBase64, title })
    setIsImageModalOpen(true)
  }
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setDbConnected(true)
        toast.success('Conexão com o banco estabelecida!')
        loadPrompts()
        loadCategories()
        loadStats()
      } else {
        setDbConnected(false)
        toast.error('Erro ao conectar: ' + (data.error || 'desconhecido'))
      }
    } catch {
      setDbConnected(false)
      toast.error('Erro ao conectar com o banco de dados')
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
         <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
  <div className="w-full px-8 lg:px-12 xl:px-16 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <img src={PromplyLogo} alt="Logo Promply" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Promply.app</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Organize e gerencie seus prompts</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {user && (
          <>
            <span className="text-sm text-slate-600 dark:text-slate-400">Olá, {user.name}</span>
            {user.is_admin && (
              <Badge variant="destructive" className="text-xs">Admin</Badge>
            )}
          </>
        )}
        <Button
          variant={dbConnected ? 'outline' : 'destructive'}
          size="sm"
          onClick={testConnection}
          className="flex items-center space-x-2"
        >
          <Database className="w-4 h-4" />
          <span>{dbConnected ? 'Conectado' : 'Reconectar DB'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center space-x-2"
        >
          <span>Sair</span>
        </Button>
      </div>
    </div>
  </div>
</header>





     <div className="w-full px-6 lg:px-10 xl:px-14 py-6">
  <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 xl:gap-8">


            {/* Sidebar */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Prompts</p>
                      <p className="text-2xl font-bold">{stats.total_prompts || 0}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-200" />
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Categorias</p>
                      <p className="text-2xl font-bold">{stats.total_categories || 0}</p>
                    </div>
                    <Tag className="w-8 h-8 text-purple-200" />
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm">Favoritos</p>
                      <p className="text-2xl font-bold">{stats.favorite_prompts || 0}</p>
                    </div>
                    <Heart className="w-8 h-8 text-pink-200" />
                  </CardContent>
                </Card>
              </div>

  <Card className="rounded-xl border border-slate-200 shadow-sm bg-white/70 backdrop-blur-sm flex flex-col h-full">
  <CardHeader className="pb-3 flex items-center justify-between">
    <CardTitle className="text-lg font-semibold text-slate-800">Minhas Categorias</CardTitle>
    <Button
      size="sm"
      variant="default"
      onClick={() => {
        resetCategoryForm();
        setIsCategoryDialogOpen(true);
      }}
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
    >
      <FolderPlus className="w-4 h-4" />
    </Button>
  </CardHeader>

  <CardContent className="flex-1 overflow-y-auto space-y-2 pr-1">
    <Button
      variant={selectedCategory === null ? 'default' : 'ghost'}
      className="w-full justify-start font-medium"
      onClick={() => setSelectedCategory(null)}
    >
      Todas as categorias
    </Button>

{myCategories.map((category) => (
  <div
    key={category.id}
    className={`flex items-center justify-between rounded-md transition group ${
      selectedCategory === category.id
        ? 'bg-blue-600 text-white'
        : 'hover:bg-gray-50 text-slate-700'
    }`}
  >
    {/* Nome da categoria */}
    <div
      onClick={() => setSelectedCategory(category.id)}
      className="flex items-center gap-2 flex-1 text-left cursor-pointer overflow-hidden px-3 py-2 rounded-md"
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color || '#3B82F6' }}
      ></span>
      <span
        className={`truncate text-sm font-medium leading-snug ${
          selectedCategory === category.id ? 'text-white' : 'text-slate-800'
        }`}
        title={category.name}
      >
        {category.name}
      </span>
    </div>

    {/* Ícones */}
    <div className="flex items-center gap-1 flex-shrink-0 pr-2">
      <Button
  variant="ghost"
  size="icon"
  className={`h-6 w-6 ${
    selectedCategory === category.id
      ? 'text-white hover:text-blue-100'
      : 'text-slate-500 hover:text-blue-600'
  }`}
  onClick={() => editCategory(category)}
>
  <Edit3 className="h-4 w-4" />
</Button>

<Button
  variant="ghost"
  size="icon"
  className={`h-6 w-6 ${
    selectedCategory === category.id
      ? 'text-white hover:text-blue-100'
      : 'text-slate-500 hover:text-red-600'
  }`}
  onClick={() => deleteCategory(category.id)}
>
  <Trash2 className="h-4 w-4" />
</Button>

    </div>
  </div>
))}

  </CardContent>
</Card>

            </div>

            {/* Main Content */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar prompts..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant={showFavoritesOnly ? 'default' : 'outline'} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
                  <Star className="w-4 h-4 mr-2" />
                </Button>
                <Button onClick={() => setShowChatModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Button>


                 <Button onClick={() => setShowTemplates(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <BookText  className="w-4 h-4" />
                  Templates
                </Button>
                
                <Button onClick={() => { resetPromptForm(); setIsPromptDialogOpen(true) }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Prompt
                </Button>
              </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6 2xl:gap-8">

                {filteredPrompts.length > 0 ? (
                  filteredPrompts.map((prompt) => {
                    const rawVideoUrl =
      prompt.video_url || prompt.videoUrl || prompt.youtube_url || prompt.youtubeUrl || "";
    const videoId = extractYouTubeId(rawVideoUrl);
    const hasVideo = !!videoId;
 return (

<div
  key={prompt.id}
  className="flex bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 h-[230px] relative"
>
  {/* Conteúdo à esquerda */}
  <div className="flex-1 flex flex-col justify-between p-4">
    <div>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold line-clamp-1">
          {prompt.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleFavorite(prompt)}
          className="text-yellow-500"
        >
          {prompt.is_favorite ? <Star className="fill-current" /> : <StarOff />}
        </Button>
      </div>

      {prompt.category && (
        <Badge
          className="mt-1"
          style={{ backgroundColor: prompt.category.color || '#3B82F6' }}
        >
          {prompt.category.name}
        </Badge>
      )}

      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
        {prompt.description || prompt.content}
      </p>

      {prompt.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {(Array.isArray(prompt.tags)
            ? prompt.tags
            : prompt.tags.split(',').map((t) => t.trim()).filter((t) => t)
          ).map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>

    {/* Botões inferiores */}
    <div className="flex justify-start gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setPromptToShare(prompt)
          setShowShareModal(true)
        }}
      >
        <Share2 className="w-4 h-4 mr-2" /> Compartilhar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(prompt)}
      >
        <Copy className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editPrompt(prompt)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => deletePrompt(prompt.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  </div>

{/* Mídia à direita */}
<div className="relative w-48 h-full flex-shrink-0 bg-slate-100">
  {(hasVideo || prompt.image_url) ? (
    <>
      {/* Selo YouTube */}
      {hasVideo && (
        <div className="absolute top-2 right-2 z-50 pointer-events-none">
          <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 15V9l5 3-5 3z" />
            </svg>
            <span>YouTube</span>
          </div>
        </div>
      )}

      {/* Camada com zoom */}
      <div className="absolute inset-0 overflow-clip group rounded-r-xl">
        {/* Botão clicável cobrindo toda a mídia */}
       <button
  type="button"
  aria-label="Abrir mídia"
  className="absolute inset-0 w-full h-full cursor-pointer"
  onClick={() =>
    hasVideo
      ? openVideoModal(rawVideoUrl)
      : openImageModal(prompt.image_url, prompt.title)
  }
>
  <img
    src={
      hasVideo
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : prompt.image_url
    }
    alt={prompt.title}
    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
  />
</button>

        {/* Overlay de hover NÃO bloqueia clique */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all duration-300 pointer-events-none">
  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100">
    <Search className="text-slate-800 w-5 h-5" />
  </div>
</div>

      </div>
    </>
  ) : (
    <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm select-none">
      Sem imagem
    </div>
  )}
</div>




</div>


                  
 );
  })  // 👈 fecha o bloco do map aqui
                ) : (
                  <p className="text-center text-slate-500 col-span-full">Nenhum prompt encontrado.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Categoria */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Edite os dados da categoria' : 'Crie uma nova categoria pessoal'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-12 h-10 rounded border border-slate-300"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveCategory}>{editingCategory ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Prompt */}
      <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">     
          <DialogHeader>
            <DialogTitle>{editingPrompt ? 'Editar Prompt' : 'Novo Prompt'}</DialogTitle>
            <DialogDescription>
              {editingPrompt ? 'Edite os detalhes do seu prompt' : 'Crie um novo prompt'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={promptForm.title}
                onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                placeholder="Título do prompt"
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={promptForm.content}
                onChange={(e) => setPromptForm({ ...promptForm, content: e.target.value })}
                rows={10}
                className="w-full max-h-96 overflow-y-auto resize-y whitespace-pre-wrap break-words"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={promptForm.description}
                onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Tags</Label>
              <Input
                value={promptForm.tags}
                onChange={(e) => setPromptForm({ ...promptForm, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            {/* Upload de Imagem */}
            <div>
              <Label>Imagem do Prompt (opcional)</Label>
              <div className="space-y-3">
                {promptForm.image_url && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <img
                      src={promptForm.image_url}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="prompt-image-upload"
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      uploadingImage
                        ? 'border-gray-300 bg-gray-50 cursor-wait'
                        : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Carregando...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          {promptForm.image_url ? 'Trocar imagem' : 'Selecionar imagem'}
                        </span>
                      </>
                    )}
                  </label>
                  <input
                    id="prompt-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">Formatos suportados: JPG, PNG, SVG (máx. 5MB)</p>
              </div>
            </div>
            <div>
  <Label>Link do vídeo (YouTube)</Label>
  <Input
    type="url"
    placeholder="https://www.youtube.com/watch?v=..."
    value={promptForm.video_url || ""}
    onChange={(e) =>
      setPromptForm({ ...promptForm, video_url: e.target.value })
    }
  />
  <p className="text-xs text-slate-500 mt-1">
    Se preencher este campo, a imagem será substituída pelo preview do vídeo.
  </p>
</div>


        <div>
  <Label>Categoria</Label>
  <Select
    onValueChange={(value) => {
      const selected = myCategories.find((c) => String(c.id) === value);
      setPromptForm({
        ...promptForm,
        category_id: value === "none" ? null : Number(value),
        category_name: selected ? selected.name : "Sem categoria",
      });
    }}
    value={
      promptForm.category_id
        ? String(promptForm.category_id)
        : "none"
    }
  >
    <SelectTrigger className="w-full">
      <span className="truncate">
        {myCategories.find((cat) => String(cat.id) === String(promptForm.category_id))
          ? myCategories.find((cat) => String(cat.id) === String(promptForm.category_id)).name
          : "Selecione uma categoria"}
      </span>
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Sem categoria</SelectItem>
      {myCategories.map((category) => (
        <SelectItem key={category.id} value={String(category.id)}>
          {category.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="prompt-favorite"
                checked={promptForm.is_favorite}
                onChange={(e) => setPromptForm({ ...promptForm, is_favorite: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <Label htmlFor="prompt-favorite">Marcar como favorito</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>Cancelar</Button>
              <Button onClick={savePrompt}>{editingPrompt ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização da Imagem */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b">
            <DialogTitle className="text-lg">{selectedImage?.title}</DialogTitle>
            <DialogDescription>Imagem do prompt</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full max-h-[70vh] overflow-auto bg-gray-50 flex items-center justify-center p-6">
            <img
              src={selectedImage?.url}
              alt={selectedImage?.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex justify-end gap-2 p-6 pt-3 border-t bg-white">
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>Fechar</Button>
            <Button
              onClick={() => {
                const link = document.createElement('a')
                link.href = selectedImage?.url
                link.download = `${selectedImage?.title || 'imagem'}.png`
                link.click()
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Imagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />

      {showShareModal && promptToShare && (
        <SharePromptModal
          prompt={promptToShare}
          onClose={() => {
            setShowShareModal(false)
            setPromptToShare(null)
          }}
          onSuccess={() => {
            setShowShareModal(false)
            setPromptToShare(null)
            setShowChatModal(true)
            loadPrompts()
          }}
        />
      )}

      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
  <DialogContent className="max-w-4xl p-0 bg-black overflow-hidden">
    <div className="relative">
      <button
        onClick={() => setShowVideoModal(false)}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
      >
        ✕
      </button>
      {currentVideoUrl && (
        <iframe
          src={`https://www.youtube.com/embed/${extractYouTubeId(currentVideoUrl)}?autoplay=1&rel=0&modestbranding=1`}
          title="YouTube player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video"
        ></iframe>
      )}
    </div>
  </DialogContent>
</Dialog>

    </>
  )
}