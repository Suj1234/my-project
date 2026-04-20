import { Handle, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Plus, Play } from 'lucide-react';
import { FlowNodeData } from '../../types/journey';
import type React from 'react';

interface StartNodeCProps {
  data: FlowNodeData;
  selected: boolean;
}

export function StartNodeC({ data, selected }: StartNodeCProps) {
  const configuredPages = (data.pages ?? []).filter((p) => p.isConfigured).length;
  const totalPages = (data.pages ?? []).length;
  const hookCount = (data.dataHooks ?? []).reduce((sum, slot) => sum + slot.apis.length, 0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onConfigure?.(data.id);
  };

  return (
    <div className={`relative transition-all duration-150 ${selected ? 'drop-shadow-2xl' : ''}`}>
      {/* Pulsing glow ring — only when not selected */}
      {!selected && (
        <div className="absolute -inset-[4px] rounded-[18px] bg-emerald-400/25 animate-pulse pointer-events-none" />
      )}

      {/* Card — full-bleed gradient, no white body */}
      <div
        className={`w-[260px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-emerald-400 shadow-2xl shadow-emerald-300/50'
            : 'border-emerald-400/60 shadow-lg hover:border-emerald-400 hover:shadow-emerald-200/50 hover:shadow-xl'
        }`}
        onClick={handleClick}
      >
        {/* Full-bleed gradient background */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600">
          {/* Top row */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0 border border-white/30">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xs tracking-wider leading-tight">JOURNEY START</p>
                <p className="text-emerald-100/80 text-[10px] leading-tight mt-0.5">Entry point</p>
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-white bg-white/20 px-2 py-0.5 rounded-full border border-white/30 flex-shrink-0">
              START
            </span>
          </div>

          {/* Config info row — frosted chips on colored background */}
          <div className="px-4 pb-3.5">
            {totalPages > 0 || hookCount > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {totalPages > 0 && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    configuredPages === totalPages
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-amber-400/30 text-amber-100 border-amber-300/40'
                  }`}>
                    {configuredPages}/{totalPages} pages
                  </span>
                )}
                {hookCount > 0 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-white/20 text-white border-white/30">
                    {hookCount} {hookCount === 1 ? 'hook' : 'hooks'}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-white/60 italic">Click to configure</p>
            )}
          </div>
        </div>
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white !shadow"
      />

      {/* Add button */}
      <div className="absolute -bottom-9 left-1/2 transform -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs bg-white shadow border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
          onClick={(e) => { e.stopPropagation(); data.onAddBlock?.(data.id); }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
