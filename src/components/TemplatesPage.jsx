import { toast } from 'sonner'  // ← Adicione esta linha no início
import api from '../lib/api'
import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ScrollArea } from './ui/scroll-area'
import { Label } from './ui/label'
import {
  Search,
  Plus,
  Copy,
  Edit,
  Trash2,
  BookTemplate,
  Sparkles,
  TrendingUp,
  ArrowLeft,
  Check,
  FolderPlus,
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export default function TemplatesPage({ user, onBack }) {
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUseTemplateDialogOpen, setIsUseTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [myCategories, setMyCategories] = useState([])
  const [useTemplateForm, setUseTemplateForm] = useState({
    category_id: 'none',
    title: '',
    is_favorite: false
  })

  const [templateForm, setTemplateForm] = useState({
    title: '',
    content: '',
    description: '',
    tags: '',
    category_id: 'none',
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })

  useEffect(() => {
    loadTemplates()
    loadCategories()
    loadMyCategories()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates')
      const data = response.data

      if (data.success) {
        setTemplates(Array.isArray(data.data) ? data.data : [])
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error)
      setTemplates([])
    }
  }

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories')
      const data = response.data

      if (data.success) {
        const templateCats = Array.isArray(data.templates) ? data.templates : []
        setCategories(templateCats)
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      setCategories([])
    }
  }

  const loadMyCategories = async () => {
    try {
      const response = await api.get('/categories')
      const data = response.data

      if (data.success) {
        const userCats = Array.isArray(data.categories) ? data.categories : []
        setMyCategories(userCats)
      }
    } catch (error) {
      console.error("Erro ao carregar minhas categorias:", error)
      setMyCategories([])
    }
  }

  const filteredTemplates = Array.isArray(templates)
    ? templates.filter(template => {
        const matchesSearch =
          template.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(template.tags) &&
            template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        const matchesCategory = !selectedCategory || template.category_id === selectedCategory
        return matchesSearch && matchesCategory
      })
    : []

  const useTemplate = async () => {
    try {
          const response = await api.post(`/templates/${selectedTemplate.id}/use`, {
        title: useTemplateForm.title || selectedTemplate.title,
        category_id:
          useTemplateForm.category_id !== 'none'
            ? Number(useTemplateForm.category_id)
            : null,
        is_favorite: useTemplateForm.is_favorite,
      })

      const data = response.data

      if (data.success) {
        alert('✅ Prompt criado a partir do template com sucesso!')
        setIsUseTemplateDialogOpen(false)
        resetUseTemplateForm()
        
        // ✅ Volta e força refresh da página
        onBack()
        window.location.reload()  // ← Recarrega tudo
      } else {
        alert('❌ ' + (data.error || 'Erro ao usar template'))
      }
    } catch (error) {
      console.error('Erro ao usar template:', error)
      alert('❌ Erro ao usar template')
    }
  }

  const openUseTemplateDialog = (template) => {
    setSelectedTemplate(template)
    setUseTemplateForm({
      category_id: 'none',
      title: template.title,
      is_favorite: false
    })
    setIsUseTemplateDialogOpen(true)
  }

  const resetUseTemplateForm = () => {
    setSelectedTemplate(null)
    setUseTemplateForm({
      category_id: 'none',
      title: '',
      is_favorite: false
    })
  }

 // ✅ NOVO (com toast verde)
const copyToClipboard = async (template) => {
  try {
    await navigator.clipboard.writeText(template.content)
    
    toast.success('Template copiado!', {
      duration: 2000,
      className: 'toast-copied',  // ⬅️ Usa o mesmo estilo verde do PromptManager
    })
  } catch (error) {
    console.error('Erro ao copiar template:', error)
    toast.error('Erro ao copiar', {
      description: 'Não foi possível copiar o template'
    })
  }
}

  const saveTemplate = async () => {
    if (!user?.is_admin) {
      alert('❌ Apenas administradores podem criar templates')
      return
    }

    try {
      const url = editingTemplate
        ? `${API_BASE_URL}/templates/${editingTemplate.id}`
        : `${API_BASE_URL}/templates`

      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...templateForm,
          tags: templateForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        }),
      })

      const data = await response.json()
      if (data.success) {
        loadTemplates()
        resetForm()
        setIsDialogOpen(false)
        alert('✅ Template salvo com sucesso!')
      } else {
        alert('❌ ' + (data.error || 'Erro ao salvar template'))
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      alert('❌ Erro ao salvar template')
    }
  }

  const saveCategory = async () => {
    if (!user?.is_admin) {
      alert('❌ Apenas administradores podem criar categorias')
      return
    }

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
        body: JSON.stringify({
          ...categoryForm,
          is_template: true
        }),
      })

      const data = await response.json()
      if (data.success) {
        loadCategories()
        resetCategoryForm()
        setIsCategoryDialogOpen(false)
        alert('✅ Categoria salva com sucesso!')
      } else {
        alert('❌ ' + (data.error || 'Erro ao salvar categoria'))
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('❌ Erro ao salvar categoria')
    }
  }

  const deleteTemplate = async (id) => {
    if (!user?.is_admin) {
      alert('❌ Apenas administradores podem deletar templates')
      return
    }

    if (!confirm('Tem certeza que deseja deletar este template?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()
      if (data.success) {
        loadTemplates()
        alert('✅ Template deletado com sucesso!')
      } else {
        alert('❌ ' + (data.error || 'Erro ao deletar template'))
      }
    } catch (error) {
      console.error('Erro ao deletar template:', error)
      alert('❌ Erro ao deletar template')
    }
  }

  const deleteCategory = async (id) => {
    if (!user?.is_admin) {
      alert('❌ Apenas administradores podem deletar categorias')
      return
    }

    if (!confirm('Tem certeza que deseja deletar esta categoria?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()
      if (data.success) {
        loadCategories()
        alert('✅ Categoria deletada com sucesso!')
      } else {
        alert('❌ ' + (data.error || 'Erro ao deletar categoria'))
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      alert('❌ Erro ao deletar categoria')
    }
  }

  const editTemplate = (template) => {
    setTemplateForm({
      title: template.title,
      content: template.content,
      description: template.description || '',
      tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
      category_id: template.category_id ? String(template.category_id) : 'none',
    })
    setEditingTemplate(template)
    setIsDialogOpen(true)
  }

  const editCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
    })
    setEditingCategory(category)
    setIsCategoryDialogOpen(true)
  }

  const resetForm = () => {
    setTemplateForm({
      title: '',
      content: '',
      description: '',
      tags: '',
      category_id: 'none',
    })
    setEditingTemplate(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: '#3B82F6',
    })
    setEditingCategory(null)
  }

  const openPreview = (template) => {
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <BookTemplate className="w-10 h-10 text-blue-600" />
                Biblioteca de Templates
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Prompts profissionais prontos para usar
              </p>
            </div>
            
            {user?.is_admin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? 'Editar Template' : 'Novo Template'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTemplate ? 'Edite o template' : 'Crie um novo template para a biblioteca'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={templateForm.title}
                        onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                        placeholder="Título do template"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        placeholder="Descrição breve do template"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Conteúdo do Template</Label>
                      <Textarea
                        id="content"
                        value={templateForm.content}
                        onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                        placeholder="Conteúdo completo do template..."
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={templateForm.tags}
                        onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })}
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={templateForm.category_id}
                        onValueChange={(value) => setTemplateForm({ ...templateForm, category_id: value })}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        {/* ✅ LAYOUT PROFISSIONAL MELHORADO */}
                        <SelectContent 
                          className="max-h-[320px] min-w-[var(--radix-select-trigger-width)]"
                          position="popper"
                          align="start"
                        >
                          <SelectItem 
                            value="none" 
                            className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md my-1"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <span className="text-slate-400 text-sm">—</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900 dark:text-slate-100">Sem categoria</span>
                                <span className="text-xs text-slate-500">Não vincular a nenhuma categoria</span>
                              </div>
                            </div>
                          </SelectItem>
                          
                          {categories.length > 0 && (
                            <>
                              <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />
                              <div className="px-3 py-1.5">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Categorias de Templates
                                </span>
                              </div>
                            </>
                          )}
                          
                          {categories.map((cat) => (
                            <SelectItem 
                              key={cat.id} 
                              value={String(cat.id)}
                              className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md my-1"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                  style={{ 
                                    backgroundColor: cat.color || '#3B82F6',
                                    opacity: 0.9
                                  }}
                                >
                                  <span className="text-white text-xs font-bold">
                                    {cat.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {cat.name}
                                  </span>
                                  {cat.description && (
                                    <span className="text-xs text-slate-500 truncate">
                                      {cat.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={saveTemplate}>
                        {editingTemplate ? 'Salvar' : 'Criar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Sidebar - Categorias */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Categorias</CardTitle>
                  {user?.is_admin && (
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={resetCategoryForm} variant="ghost">
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCategory ? 'Editar Categoria' : 'Nova Categoria de Template'}
                          </DialogTitle>
                          <DialogDescription>
                            {editingCategory ? 'Edite a categoria' : 'Crie uma nova categoria para templates'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cat-name">Nome</Label>
                            <Input
                              id="cat-name"
                              value={categoryForm.name}
                              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                              placeholder="Nome da categoria"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cat-description">Descrição</Label>
                            <Textarea
                              id="cat-description"
                              value={categoryForm.description}
                              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                              placeholder="Descrição da categoria"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cat-color">Cor</Label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                id="cat-color"
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
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    <Button
                      variant={selectedCategory === null ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Todas as categorias
                    </Button>
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center gap-1">
                        <Button
                          variant={selectedCategory === category.id ? 'default' : 'ghost'}
                          className="flex-1 justify-start"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: category.color || '#3B82F6' }}
                          ></span>
                          {category.name}
                        </Button>
                        {user?.is_admin && (
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => editCategory(category)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteCategory(category.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {/* Barra de Pesquisa */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar templates..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Grid de Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <Card key={template.id} className="relative group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                          {template.category_name && (
                            <Badge className="mt-2" variant="secondary">
                              {template.category_name}
                            </Badge>
                          )}
                        </div>
                        {template.usage_count > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {template.usage_count}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {template.description || template.content}
                      </CardDescription>
                      
                      {Array.isArray(template.tags) && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openUseTemplateDialog(template)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Usar Template
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPreview(template)}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        {user?.is_admin && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => editTemplate(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteTemplate(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookTemplate className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Nenhum template encontrado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.title}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm">
              {previewTemplate?.content}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsPreviewOpen(false)
              openUseTemplateDialog(previewTemplate)
            }}>
              <Check className="w-4 h-4 mr-2" />
              Usar Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Use Template Dialog */}
      <Dialog open={isUseTemplateDialogOpen} onOpenChange={setIsUseTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Usar Template: {selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              Escolha em qual categoria você deseja salvar este prompt
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="use-title">Título do Prompt</Label>
              <Input
                id="use-title"
                value={useTemplateForm.title}
                onChange={(e) => setUseTemplateForm({ ...useTemplateForm, title: e.target.value })}
                placeholder="Título do prompt"
              />
              <p className="text-xs text-slate-500 mt-1">Você pode personalizar o título ou manter o original</p>
            </div>

            <div>
              <Label htmlFor="use-category">Categoria Pessoal</Label>
              <Select
                value={useTemplateForm.category_id}
                onValueChange={(value) => setUseTemplateForm({ ...useTemplateForm, category_id: value })}
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[280px] min-w-[var(--radix-select-trigger-width)]"
                  position="popper"
                  sideOffset={8}
                  align="start"
                >
                  <SelectItem 
                    value="none" 
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md my-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-400 text-sm">—</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">Sem categoria</span>
                        <span className="text-xs text-slate-500">Não vincular a nenhuma categoria</span>
                      </div>
                    </div>
                  </SelectItem>
                  
                  {myCategories.length > 0 && (
                    <>
                      <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />
                      <div className="px-3 py-1.5">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Minhas Categorias
                        </span>
                      </div>
                    </>
                  )}
                  
                  {myCategories.length > 0 ? (
                    myCategories.map((cat) => (
                      <SelectItem 
                        key={cat.id} 
                        value={String(cat.id)}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md my-1"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ 
                              backgroundColor: cat.color || '#3B82F6',
                              opacity: 0.9
                            }}
                          >
                            <span className="text-white text-xs font-bold">
                              {cat.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {cat.name}
                            </span>
                            {cat.description && (
                              <span className="text-xs text-slate-500 truncate">
                                {cat.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm text-slate-500">
                        Você ainda não tem categorias pessoais.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Crie uma categoria na página principal primeiro.
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-favorite"
                checked={useTemplateForm.is_favorite}
                onChange={(e) => setUseTemplateForm({ ...useTemplateForm, is_favorite: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <Label htmlFor="use-favorite">Marcar como favorito</Label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Preview do conteúdo:</strong>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 line-clamp-3">
                {selectedTemplate?.content}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUseTemplateDialogOpen(false)
                resetUseTemplateForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={useTemplate}>
              <Check className="w-4 h-4 mr-2" />
              Criar Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
