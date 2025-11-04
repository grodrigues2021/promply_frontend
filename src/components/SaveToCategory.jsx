// src/components/SaveToCategory.jsx - VERSÃO CUSTOMIZADA SEM TRANSPARÊNCIA
import React, { useState, useEffect } from "react";
import { X, Save, Folder, Star, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import api from "../lib/api";

const SaveToCategory = ({ isOpen, onClose, prompt, onSave }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: prompt?.title || `Prompt do Chat - ${new Date().toLocaleDateString()}`,
    category_id: null,
    is_favorite: false,
  });

  // Carregar categorias
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setFormData({
        title: prompt?.title || `Prompt do Chat - ${new Date().toLocaleDateString()}`,
        category_id: null,
        is_favorite: false,
      });
    }
  }, [isOpen, prompt]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/categories");
      
      if (res.data?.success) {
        const personalCategories = res.data.data.filter(cat => !cat.is_template);
        setCategories(personalCategories);

        if (personalCategories.length > 0) {
          setFormData(prev => ({
            ...prev,
            category_id: personalCategories[0].id
          }));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setError("Erro ao carregar suas categorias. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.category_id) {
      setError("Por favor, selecione uma categoria");
      return;
    }

    if (!formData.title.trim()) {
      setError("Por favor, digite um título");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSave({
        title: formData.title.trim(),
        category_id: formData.category_id,
        is_favorite: formData.is_favorite,
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err.response?.data?.message || "Erro ao salvar prompt");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      green: "bg-green-100 text-green-700 border-green-200",
      purple: "bg-purple-100 text-purple-700 border-purple-200",
      red: "bg-red-100 text-red-700 border-red-200",
      yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
      pink: "bg-pink-100 text-pink-700 border-pink-200",
      indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
      orange: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[color] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop escuro */}
      <div 
        className="fixed inset-0 bg-black/70 z-[9998]"
        onClick={onClose}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Modal */}
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl z-[9999] overflow-hidden"
        style={{ 
          position: 'fixed',
          zIndex: 9999,
          backgroundColor: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Salvar Prompt nas Minhas Categorias
                </h2>
                <p className="text-sm text-gray-600">
                  Escolha uma categoria e personalize o título para salvar este prompt
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-white">
          <div className="space-y-6">
            {/* Preview do conteúdo */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4 text-purple-600" />
                Preview do Prompt
              </h4>
              <div className="bg-white p-3 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {prompt?.content?.substring(0, 200)}
                  {prompt?.content?.length > 200 && "..."}
                </p>
              </div>
            </div>

            {/* Título personalizado */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                Título do Prompt
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite um título para identificar este prompt"
                className="w-full"
                disabled={saving}
              />
            </div>

            {/* Seleção de categoria */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Escolha a Categoria
              </Label>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600">Carregando categorias...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    Você ainda não tem categorias
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Crie uma categoria primeiro para organizar seus prompts
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setFormData({ ...formData, category_id: category.id })}
                      disabled={saving}
                      className={`
                        w-full text-left p-4 rounded-lg border-2 transition-all
                        ${
                          formData.category_id === category.id
                            ? "border-purple-500 bg-purple-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${getCategoryColor(
                                category.color
                              )}`}
                            >
                              {category.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-900">
                              {category.name}
                            </span>
                          </div>
                          {category.description && (
                            <p className="text-xs text-gray-600 ml-10">
                              {category.description}
                            </p>
                          )}
                        </div>

                        {formData.category_id === category.id && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Checkbox de favorito */}
            <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <Checkbox
                id="favorite"
                checked={formData.is_favorite}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_favorite: checked })
                }
                disabled={saving}
              />
              <Label
                htmlFor="favorite"
                className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"
              >
                <Star className="w-4 h-4 text-amber-500" />
                Marcar como favorito
              </Label>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200 bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || categories.length === 0 || !formData.category_id}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Prompt
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default SaveToCategory;