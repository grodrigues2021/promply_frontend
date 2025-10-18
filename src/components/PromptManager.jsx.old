import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Label } from '@/components/ui/label.jsx'
import {
  Search,
  Copy,
  Edit,
  Trash2,
  StarOff,
  Database,
  FolderPlus,
  Tag,
  BookOpen,
  Heart,
  Share2, // ✨ NOVO: Ícone de compartilhar
} from 'lucide-react'
import PromplyLogo from "../assets/promply-logo.svg"
import { useAuth } from '../hooks/useAuth'
import { BookTemplate } from 'lucide-react'
import TemplatesPage from './TemplatesPage.jsx'
import { MessageSquare, Star, Plus } from 'lucide-react'
import ChatModal from './ChatModal'
import SharePromptModal from './SharePromptModal' // ✨ NOVO: Import do modal

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
  
  // ✨ NOVO: States para compartilhar
  const [showShareModal, setShowShareModal] = useState(false)
  const [promptToShare, setPromptToShare] = useState(null)

  const [promptForm, setPromptForm] = useState({
    title: '',
    content: '',
    description: '',
    tags: '',
    category_id: 'none',
    is_favorite: false
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
    console.log('🚪 PromptManager: Botão de logout clicado');
    
    try {
      await logout();
    } catch (error) {
      console.error('❌ PromptManager: Erro no logout:', error);
      window.location.href = '/';
    }
  };

  const filteredPrompts = Array.isArray(prompts)
    ? prompts.filter(prompt => {
        const matchesSearch =
          (prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prompt.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // ✅ CORRIGIDO: Normaliza tags para busca
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
      const response = await fetch(`${API_BASE_URL}/prompts`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setPrompts(Array.isArray(data.data) ? data.data : [])
      } else {
        setPrompts([])
      }
    } catch (error) {
      console.error("Erro ao carregar prompts:", error)
      setDbConnected(false)
      setPrompts([])
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        const userCategories = Array.isArray(data.categories) ? data.categories : []
        const templates = Array.isArray(data.templates) ? data.templates : []
        
        setMyCategories(userCategories)
        setTemplateCategories(templates)
      } else {
        setMyCategories([])
        setTemplateCategories([])
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      setMyCategories([])
      setTemplateCategories([])
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data || {})
      } else {
        setStats({})
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
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
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...promptForm,
          // ✅ CORRIGIDO: Sempre envia tags como array (split só se for string)
          tags: typeof promptForm.tags === 'string'
            ? promptForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            : (Array.isArray(promptForm.tags) ? promptForm.tags : [])
        }),
      })

      const data = await response.json()
      if (data.success) {
        loadPrompts()
        loadStats()
        resetPromptForm()
        setIsPromptDialogOpen(false)
      } else {
        alert(data.error || 'Erro ao salvar prompt')
      }
    } catch (error) {
      console.error('Erro ao salvar prompt:', error)
      alert('Erro ao salvar prompt')
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
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(categoryForm),
      })

      const data = await response.json()
      if (data.success) {
        loadCategories()
        loadStats()
        resetCategoryForm()
        setIsCategoryDialogOpen(false)
      } else {
        alert(data.error || 'Erro ao salvar categoria')
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria')
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
      } else {
        alert(data.error || 'Erro ao deletar prompt')
      }
    } catch (error) {
      console.error('Erro ao deletar prompt:', error)
      alert('Erro ao deletar prompt')
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
        if (selectedCategory === id) {
          setSelectedCategory(null)
        }
      } else {
        alert(data.error || 'Erro ao deletar categoria')
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      alert('Erro ao deletar categoria')
    }
  }

  const toggleFavorite = async (prompt) => {
    try {
      const response = await fetch(`${API_BASE_URL}/prompts/${prompt.id}/favorite`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()
      if (data.success) {
        loadPrompts()
        loadStats()
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error)
    }
  }

  const copyToClipboard = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      
      await fetch(`${API_BASE_URL}/prompts/${prompt.id}/copy`, { 
        method: 'POST',
        credentials: 'include'
      })
      
      loadPrompts()
      alert('Prompt copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar prompt:', error)
      alert('Erro ao copiar prompt')
    }
  }

  const resetPromptForm = () => {
    setPromptForm({
      title: '',
      content: '',
      description: '',
      tags: '',
      category_id: 'none',
      is_favorite: false
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

  // ✅ Função helper para normalizar tags
  const normalizeTags = (tags) => {
    if (!tags) return '';
    if (Array.isArray(tags)) return tags.join(', ');
    if (typeof tags === 'string') return tags;
    return '';
  };

  const editPrompt = (prompt) => {
    setPromptForm({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      tags: normalizeTags(prompt.tags),
      category_id: prompt.category_id ? String(prompt.category_id) : 'none',
      is_favorite: prompt.is_favorite
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
  
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setDbConnected(true)
        alert('Conexão com o banco de dados estabelecida com sucesso!')
        loadPrompts()
        loadCategories()
        loadStats()
      } else {
        setDbConnected(false)
        alert('Erro ao conectar. Status: ' + (data.error || 'desconhecido'))
      }
    } catch (error) {
      setDbConnected(false)
      alert('Erro ao conectar com o banco de dados. Verifique se o servidor está rodando.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
                onClick={() => setShowTemplates(true)}
                className="flex items-center space-x-2"
              >
                <BookTemplate className="w-4 h-4" />
                <span>Templates</span>
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

      {/* Sidebar e Conteúdo */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Prompts</p>
                        <p className="text-2xl font-bold">{stats.total_prompts || 0}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Categorias</p>
                        <p className="text-2xl font-bold">{stats.total_categories || 0}</p>
                      </div>
                      <Tag className="w-8 h-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-100 text-sm">Favoritos</p>
                        <p className="text-2xl font-bold">{stats.favorite_prompts || 0}</p>
                      </div>
                      <Heart className="w-8 h-8 text-pink-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Categorias */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Minhas Categorias</CardTitle>
                    <Button 
                  size="sm" 
                  onClick={() => {
                    resetCategoryForm();
                    setIsCategoryDialogOpen(true);
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <span className="hidden"></span>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                          </DialogTitle>
                          <DialogDescription>
                            {editingCategory ? 'Edite os dados da categoria' : 'Crie uma nova categoria pessoal'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="category-name">Nome</Label>
                            <Input
                              id="category-name"
                              value={categoryForm.name}
                              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                              placeholder="Nome da categoria"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category-description">Descrição</Label>
                            <Textarea
                              id="category-description"
                              value={categoryForm.description}
                              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                              placeholder="Descrição da categoria"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category-color">Cor</Label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                id="category-color"
                                value={categoryForm.color}
                                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                className="w-12 h-10 rounded border border-slate-300"
                              />
                              <Input
                                value={categoryForm.color}
                                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                placeholder="#3B82F6"
                              />
                            </div>
                          </div>
                          {user && user.is_admin && !editingCategory && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="category-template"
                                checked={categoryForm.is_template}
                                onChange={(e) => setCategoryForm({ ...categoryForm, is_template: e.target.checked })}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <Label htmlFor="category-template">
                                Criar como Template (visível para todos os usuários)
                              </Label>
                            </div>
                          )}
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={saveCategory}>
                              {editingCategory ? 'Salvar' : 'Criar'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === null ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(null)}
                      >
                        Todas as categorias
                      </Button>
                      
                      {myCategories.length > 0 ? (
                        myCategories.map((category) => (
                          <div key={category.id} className="flex items-center justify-between gap-1">
                            <Button
                              variant={selectedCategory === category.id ? 'default' : 'ghost'}
                              className="flex-1 justify-start"
                              onClick={() => setSelectedCategory(category.id)}
                            >
                              <span
                                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                style={{ backgroundColor: category.color || '#3B82F6' }}
                              ></span>
                              <span className="truncate">{category.name}</span>
                            </Button>
                            <div className="flex space-x-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => editCategory(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => deleteCategory(category.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                          Nenhuma categoria criada ainda.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Pesquisa e Filtros */}
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

                <Button
                  onClick={() => setShowChatModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </Button>
                <Button
                  variant={showFavoritesOnly ? 'default' : 'outline'}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Favoritos
                </Button>
                <Button 
                  onClick={() => {
                    resetPromptForm();
                    setIsPromptDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Prompt
                </Button>
                <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                  <DialogTrigger asChild>
                    <span className="hidden"></span>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{editingPrompt ? 'Editar Prompt' : 'Novo Prompt'}</DialogTitle>
                      <DialogDescription>
                        {editingPrompt ? 'Edite os detalhes do seu prompt' : 'Crie um novo prompt'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="prompt-title">Título</Label>
                        <Input
                          id="prompt-title"
                          value={promptForm.title}
                          onChange={(e) => setPromptForm({ ...promptForm, title: e.target.value })}
                          placeholder="Título do prompt"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prompt-content">Conteúdo</Label>
                        <Textarea
                          id="prompt-content"
                          value={promptForm.content}
                          onChange={(e) => setPromptForm({ ...promptForm, content: e.target.value })}
                          placeholder="Conteúdo do prompt"
                          rows={10}
                          className="w-full max-h-96 overflow-y-auto resize-y whitespace-pre-wrap break-words"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prompt-description">Descrição (Opcional)</Label>
                        <Textarea
                          id="prompt-description"
                          value={promptForm.description}
                          onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                          placeholder="Descrição do prompt"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prompt-tags">Tags</Label>
                        <Input
                          id="prompt-tags"
                          value={promptForm.tags}
                          onChange={(e) => setPromptForm({ ...promptForm, tags: e.target.value })}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prompt-category">Categoria</Label>
                        <Select
                          value={promptForm.category_id}
                          onValueChange={(value) => setPromptForm({ ...promptForm, category_id: value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem categoria</SelectItem>
                            {Array.isArray(myCategories) &&
                              myCategories.map((category) => (
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
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={savePrompt}>
                          {editingPrompt ? 'Salvar' : 'Criar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Lista de Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(filteredPrompts) && filteredPrompts.length > 0 ? (
                  filteredPrompts.map((prompt) => (
                    <Card key={prompt.id} className="relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-1">{prompt.title}</CardTitle>
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
                      </CardHeader>
                      <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                        <p className="line-clamp-3">{prompt.description || prompt.content}</p>
                        {/* ✅ CORRIGIDO: Normaliza tags antes de renderizar */}
                        {prompt.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(Array.isArray(prompt.tags) 
                              ? prompt.tags 
                              : prompt.tags.split(',').map(t => t.trim()).filter(t => t)
                            ).map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Botão Compartilhar - com ícone + texto */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPromptToShare(prompt)
                            setShowShareModal(true)
                          }}
                          className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartilhar
                        </Button>
                        {/* Botões com apenas ícones */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(prompt)}
                          title="Copiar"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => editPrompt(prompt)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deletePrompt(prompt.id)}
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-slate-500 dark:text-slate-400 col-span-full">
                    Nenhum prompt encontrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Chat */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />

              {/* ✨ NOVO: Modal de Compartilhar */}
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
              // ✅ CORRIGIDO: Recarregar prompts após compartilhar
              loadPrompts()
            }}
          />
        )}
     
    </div>
  )
}