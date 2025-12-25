// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, FileText, Activity, TrendingUp, 
  Calendar, Database, Loader2, AlertCircle 
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
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/admin/metrics', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        setMetrics(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold">Erro ao carregar métricas</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-500 text-sm mt-1">
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
            subtitle={`${Math.round((metrics.engagement.users_with_prompts / Math.max(metrics.users.total, 1)) * 100)}% do total`}
          />
          <MetricCard
            title="Prompts com Mídia"
            value={metrics.storage.prompts_with_media}
            icon={Database}
            subtitle="imagens ou vídeos"
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

      {/* Top Categorias */}
      {metrics.top_categories && metrics.top_categories.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.top_categories.map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-gray-600">{cat.count} prompts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}