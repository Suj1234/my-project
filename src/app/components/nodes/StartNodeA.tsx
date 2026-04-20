import { Handle, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Plus, Play } from 'lucide-react';
import { FlowNodeData } from '../../types/journey';
import type React from 'react';

interface StartNodeAProps {
  data: FlowNodeData;
  selected: boolean;
}

export function StartNodeA({ data, selected }: StartNodeAProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onConfigure?.(data.id);
  };

  return (
    <div className={`relative transition-all duration-150 ${selected ? 'drop-shadow-xl' : ''}`}>
      {/* Pill / Stadium shape */}
      <div
        className={`w-[260px] rounded-full overflow-hidden cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-emerald-500 shadow-2xl shadow-emerald-200/60'
            : 'border-emerald-300 shadow-md hover:border-emerald-500 hover:shadow-lg'
        }`}
        onClick={handleClick}
      >
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
              <Play className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs tracking-wide leading-tight">JOURNEY START</p>
              <p className="text-emerald-100/80 text-[10px] leading-tight">Entry point</p>
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-emerald-100 bg-white/15 px-2 py-0.5 rounded-full border border-white/20 flex-shrink-0">
            START
          </span>
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
