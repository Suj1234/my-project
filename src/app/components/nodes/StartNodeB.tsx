import { Handle, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Plus, Play } from 'lucide-react';
import { FlowNodeData } from '../../types/journey';
import type React from 'react';

interface StartNodeBProps {
  data: FlowNodeData;
  selected: boolean;
}

export function StartNodeB({ data, selected }: StartNodeBProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onConfigure?.(data.id);
  };

  return (
    <div className="relative flex flex-col items-center transition-all duration-150">
      {/* Circle */}
      <div
        className={`w-[110px] h-[110px] rounded-full cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 border-4 ${
          selected
            ? 'border-emerald-400 shadow-2xl shadow-emerald-300/50 bg-gradient-to-br from-emerald-400 to-teal-500 scale-105'
            : 'border-emerald-300 shadow-lg hover:border-emerald-500 hover:shadow-xl hover:scale-105 bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}
        onClick={handleClick}
      >
        <Play className="h-8 w-8 text-white fill-white drop-shadow" />
        <div className="text-center leading-tight">
          <p className="text-[8px] font-bold tracking-[0.15em] text-white/90 uppercase">Journey</p>
          <p className="text-[9px] font-bold tracking-[0.2em] text-white uppercase">Start</p>
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
          className="h-7 px-3 text-xs bg-white shadow border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors whitespace-nowrap"
          onClick={(e) => { e.stopPropagation(); data.onAddBlock?.(data.id); }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
