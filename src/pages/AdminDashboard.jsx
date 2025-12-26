// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, FileText, Activity, TrendingUp, 
  Calendar, Database, Loader2, AlertCircle, Shield 
} from 'lucide-react';

const MetricCard = ({ title, value, subtitle, icon: Icon }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://api.promply.app/api';
        const res = await fetch(`${API_URL}/admin/metrics`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType);
          throw new Error('Você precisa estar autenticado para acessar esta página');
        }
        
        if (!res.ok) {
          // ✅ NOVO: Mensagens específicas para cada tipo de erro
          if (res.status === 401) {
            throw new Error('Você precisa estar autenticado. Redirecionando para login...');
          }
          if (res.status === 403) {
            throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
          }
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Erro ao buscar métricas');
        }
        
        setMetrics(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError(error.message);
        
        // ✅ NOVO: Redirecionar para home se for erro 403 (não é admin)
        if (error.message.includes('Acesso negado') || error.message.includes('administradores')) {
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
        // Redirecionar para login se for erro 401 (não autenticado)
        else if (error.message.includes('autenticado') || error.message.includes('login')) {
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando métricas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className={`${
          error.includes('Acesso negado') || error.includes('administradores')
            ? 'bg-orange-50 border-orange-200'
            : 'bg-red-50 border-red-200'
        } border rounded-lg p-4 flex items-start gap-3`}>
          <AlertCircle className={`h-5 w-5 ${
            error.includes('Acesso negado') || error.includes('administradores')
              ? 'text-orange-600'
              : 'text-red-600'
          } flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h3 className={`${
              error.includes('Acesso negado') || error.includes('administradores')
                ? 'text-orange-800'
                : 'text-red-800'
            } font-semibold flex items-center gap-2`}>
              {error.includes('Acesso negado') || error.includes('administradores') ? (
                <>
                  <Shield className="h-4 w-4" />
                  Acesso Restrito
                </>
              ) : (
                'Erro ao carregar métricas'
              )}
            </h3>
            <p className={`${
              error.includes('Acesso negado') || error.includes('administradores')
                ? 'text-orange-600'
                : 'text-red-600'
            } text-sm mt-1`}>
              {error}
            </p>
            <p className={`${
              error.includes('Acesso negado') || error.includes('administradores')
                ? 'text-orange-500'
                : 'text-red-500'
            } text-xs mt-2`}>
              Redirecionando em 3 segundos...
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className={`px-3 py-1 ${
              error.includes('Acesso negado') || error.includes('administradores')
                ? 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                : 'bg-red-100 hover:bg-red-200 text-red-800'
            } rounded text-sm transition-colors`}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header com badge de Admin */}
 {/* Header com badge de Admin */}
<div className="flex justify-between items-center">
  <div>
    <div className="flex items-center gap-3">
      {/* ✅ BOTÃO VOLTAR ADICIONADO */}
      <button
        onClick={() => navigate('/')}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        title="Voltar para o Promply"
      >
        <svg 
          className="w-6 h-6 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
      </button>
      
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
        <Shield className="h-3 w-3" />
        ADMIN
      </span>
    </div>
    <p className="text-gray-500 text-sm mt-1 ml-14">
      Visão geral do Promply
    </p>
  </div>
  <div className="text-right text-sm text-gray-500">
    <div>Atualizado às {new Date(metrics.timestamp).toLocaleTimeString('pt-BR')}</div>
    <div className="text-xs text-gray-400">
      {new Date(metrics.timestamp).toLocaleDateString('pt-BR')}
    </div>
  </div>
</div>

      {/* Seção: Usuários */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <Users className="h-5 w-5 text-blue-600" />
          Usuários
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Usuários"
            value={metrics.users.total}
            icon={Users}
          />
          <MetricCard
            title="Últimas 24h"
            value={metrics.users.last_24h}
            icon={TrendingUp}
            subtitle="novos cadastros"
          />
          <MetricCard
            title="Última Semana"
            value={metrics.users.last_7d}
            icon={Calendar}
            subtitle="novos cadastros"
          />
          <MetricCard
            title="Usuários Ativos"
            value={metrics.users.active_7d}
            icon={Activity}
            subtitle="últimos 7 dias"
          />
        </div>
      </section>

      {/* Seção: Prompts */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <FileText className="h-5 w-5 text-green-600" />
          Prompts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Prompts"
            value={metrics.prompts.total}
            icon={FileText}
          />
          <MetricCard
            title="Últimas 24h"
            value={metrics.prompts.last_24h}
            icon={TrendingUp}
            subtitle="criados"
          />
          <MetricCard
            title="Última Semana"
            value={metrics.prompts.last_7d}
            icon={Calendar}
            subtitle="criados"
          />
          <MetricCard
            title="Último Mês"
            value={metrics.prompts.last_30d}
            icon={Database}
            subtitle="criados"
          />
        </div>
      </section>

      {/* Seção: Engajamento */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <Activity className="h-5 w-5 text-purple-600" />
          Engajamento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Média Prompts/Usuário"
            value={metrics.engagement.avg_prompts_per_user}
            icon={Activity}
          />
          <MetricCard
            title="Usuários com Prompts"
            value={metrics.engagement.users_with_prompts}
            icon={Users}
            subtitle={`${metrics.engagement.activation_rate}% do total`}
          />
          <MetricCard
            title="Prompts com Mídia"
            value={metrics.storage.prompts_with_media}
            icon={Database}
            subtitle={`${metrics.storage.media_usage_rate}% dos prompts`}
          />
        </div>
      </section>

      {/* Seção: Plataformas */}
      {metrics.prompts.by_platform && metrics.prompts.by_platform.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-600" />
                Prompts por Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.prompts.by_platform.map(([platform, count]) => {
                  const percentage = (count / metrics.prompts.total * 100).toFixed(1);
                  return (
                    <div key={platform} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-medium">
                          {platform}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count.toLocaleString('pt-BR')} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}