// src/components/CategoryBadge.jsx
import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

/**
 * Badge de categoria com truncamento automático e tooltip
 * 
 * @param {string} name - Nome da categoria
 * @param {string} color - Cor hexadecimal da categoria
 * @param {number} promptCount - Número de prompts (opcional)
 * @param {number} maxLength - Tamanho máximo antes de truncar (padrão: 20)
 * @param {string} variant - Variante do Badge (padrão: "secondary")
 * @param {string} className - Classes CSS adicionais
 * @param {boolean} showCount - Mostrar contador de prompts (padrão: false)
 */
export function CategoryBadge({ 
  name, 
  color,
  promptCount,
  maxLength = 20,
  variant = "secondary",
  className = "",
  showCount = false
}) {
  if (!name) return null;

  const shouldTruncate = name.length > maxLength;
  const displayName = shouldTruncate 
    ? `${name.substring(0, maxLength)}...` 
    : name;

  const fullName = showCount && promptCount !== undefined
    ? `${name} (${promptCount})`
    : name;

  const displayText = showCount && promptCount !== undefined
    ? `${displayName} (${promptCount})`
    : displayName;

  const badgeContent = (
    <Badge
      variant={variant}
      className={`text-xs font-medium ${className}`}
      style={{
        backgroundColor: color ? `${color}15` : '#e0e7ff',
        color: color || '#4f46e5',
        borderColor: color ? `${color}30` : '#c7d2fe',
      }}
    >
      {displayText}
    </Badge>
  );

  // Se não precisa truncar, retorna Badge direto
  if (!shouldTruncate) {
    return badgeContent;
  }

  // Se trunca, envolve com Tooltip
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {badgeContent}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-slate-900 text-white px-3 py-1.5 text-xs font-medium max-w-xs"
        sideOffset={5}
      >
        {fullName}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Componente para exibir categoria na sidebar (com bolinha colorida)
 */
export function CategorySidebarItem({ 
  name, 
  color,
  promptCount,
  maxLength = 20,
  className = ""
}) {
  if (!name) return null;

  const shouldTruncate = name.length > maxLength;
  const displayName = shouldTruncate 
    ? `${name.substring(0, maxLength)}...` 
    : name;

  const displayText = `${displayName} (${promptCount || 0})`;
  const fullText = `${name} (${promptCount || 0})`;

  const content = (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${className}`}>
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color || "#3B82F6" }}
      />
      <span className="truncate text-sm">
        {displayText}
      </span>
    </div>
  );

  // Se não precisa truncar, retorna conteúdo direto
  if (!shouldTruncate) {
    return content;
  }

  // Se trunca, envolve com Tooltip
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent 
        side="right" 
        className="bg-slate-900 text-white px-3 py-1.5 text-xs font-medium max-w-xs"
        sideOffset={8}
      >
        {fullText}
      </TooltipContent>
    </Tooltip>
  );
}