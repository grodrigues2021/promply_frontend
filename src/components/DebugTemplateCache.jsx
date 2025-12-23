// src/components/DebugTemplateCache.jsx
import { useEffect } from 'react';
import thumbnailCache from '../lib/thumbnailCache';

export default function DebugTemplateCache({ promptId }) {
  useEffect(() => {
    if (!promptId) return;

    console.log('═══════════════════════════════════════');
    console.log('🔍 DEBUG CACHE - Prompt ID:', promptId);
    console.log('═══════════════════════════════════════');

    // Tenta recuperar do cache
    const cached = thumbnailCache.get(promptId);
    
    console.log('📦 Cache result:', cached ? 'FOUND ✅' : 'NOT FOUND ❌');
    if (cached) {
      console.log('🖼️ Thumbnail URL:', cached.substring(0, 80) + '...');
    }

    // Mostra estatísticas do cache
    const stats = thumbnailCache.getStats();
    console.log('📊 Cache stats:', stats);
    console.log('═══════════════════════════════════════\n');

  }, [promptId]);

  return null;
}