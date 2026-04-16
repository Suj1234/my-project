import { Handle, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Plus, Play } from 'lucide-react';
import { FlowNodeData } from '../../types/journey';
import type React from 'react';

interface StartNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

export function StartNode({ data, selected }: StartNodeProps) {
  const configuredPages = (data.pages ?? []).filter((p) => p.isConfigured).length;
  const totalPages = (data.pages ?? []).length;
  const hookCount = (data.dataHooks ?? []).reduce((sum, slot) => sum + slot.apis.length, 0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onConfigure?.(data.id);
  };

  return (
    <div className={`relative transition-all duration-150 ${selected ? 'drop-shadow-xl' : ''}`}>
      {/* Card */}
      <div
        className={`w-[240px] rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-emerald-500 shadow-2xl shadow-emerald-100/60'
            : 'border-emerald-200 shadow-lg hover:border-emerald-400 hover:shadow-xl'
        }`}
        onClick={handleClick}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
              <Play className="h-3 w-3 text-white fill-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-tight tracking-wide">JOURNEY START</p>
              <p className="text-emerald-100/80 text-[10px] leading-tight">Entry point</p>
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-emerald-100 bg-white/15 px-1.5 py-0.5 rounded-full border border-white/20">
            START
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-2.5 bg-gradient-to-b from-white to-emerald-50/30">
          {totalPages > 0 || hookCount > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {totalPages > 0 && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  configuredPages === totalPages
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {configuredPages}/{totalPages} pages
                </span>
              )}
              {hookCount > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                  {hookCount} {hookCount === 1 ? 'hook' : 'hooks'}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">Click to configure</p>
          )}
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
