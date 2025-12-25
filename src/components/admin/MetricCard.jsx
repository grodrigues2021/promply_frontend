// src/components/admin/MetricCard.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className = ""
}) => (
  <Card className={className}>
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
      {trend !== undefined && (
        <div className={`text-xs mt-2 flex items-center gap-1 ${
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} 
          {Math.abs(trend)}% vs período anterior
        </div>
      )}
    </CardContent>
  </Card>
);