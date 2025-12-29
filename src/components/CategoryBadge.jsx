// src/components/CategoryBadge.jsx
import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

/**
 * Badge de categoria com truncamento automático e tooltip CONDICIONAL
 * 
 * ✅ Tooltip SÓ aparece se o nome for truncado (> maxLength)
 * ✅ Tooltip com fundo preto, sombra forte e bolinha colorida
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
      className={`text-xs font-medium ${shouldTruncate ? 'cursor-help' : ''} ${className}`}
      style={{
        backgroundColor: color ? `${color}15` : '#e0e7ff',
        color: color || '#4f46e5',
        borderColor: color ? `${color}30` : '#c7d2fe',
      }}
    >
      {displayText}
    </Badge>
  );

  // ✅ Se NÃO truncar, retorna Badge direto SEM tooltip
  if (!shouldTruncate) {
    return badgeContent;
  }

  // ✅ Se truncar, envolve com Tooltip SUPER VISÍVEL
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {badgeContent}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-gray-950 text-white px-4 py-2 text-sm font-semibold max-w-xs shadow-2xl border border-gray-700 z-[9999]"
        sideOffset={8}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color || "#3B82F6" }}
          />
          <span>{fullName}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Componente para exibir categoria na sidebar (com bolinha colorida)
 * 
 * ✅ Tooltip SÓ aparece se o nome for truncado (> maxLength)
 * ✅ Tooltip aparece EMBAIXO para não cobrir os ícones
 * ✅ Tooltip alinhado à ESQUERDA do elemento
 */
export function CategorySidebarItem({ 
  name, 
  color,
  promptCount,
  maxLength = 20,
  className = ""
}) {
  if (!name) return null;

  // ✅ Verifica se NOME trunca (não considera o contador)
  const shouldTruncate = name.length > maxLength;
  
  const displayName = shouldTruncate 
    ? `${name.substring(0, maxLength)}...` 
    : name;

  const displayText = `${displayName} (${promptCount || 0})`;
  const fullText = `${name} (${promptCount || 0})`;

  const content = (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${shouldTruncate ? 'cursor-help' : 'cursor-pointer'} ${className}`}>
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color || "#3B82F6" }}
      />
      <span className="truncate text-sm">
        {displayText}
      </span>
    </div>
  );

  // ✅ Se NÃO truncar, retorna conteúdo direto SEM tooltip
  if (!shouldTruncate) {
    return content;
  }

  // ✅ CORRIGIDO: Tooltip aparece EMBAIXO e alinhado à ESQUERDA
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent 
        side="bottom"        // ✅ MUDOU: "right" → "bottom"
        align="start"        // ✅ NOVO: Alinha à esquerda
        className="bg-gray-950 text-white px-4 py-2.5 text-sm font-semibold max-w-xs shadow-2xl border border-gray-700 z-[9999]"
        sideOffset={8}       // ✅ AJUSTADO: 12 → 8 (espaço menor)
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color || "#3B82F6" }}
          />
          <span>{fullText}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}