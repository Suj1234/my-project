import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X, FlagTriangleRight } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface EndNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

export function EndNode({ data, selected }: EndNodeProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  return (
    <div
      className="relative flex flex-col items-center transition-all duration-150"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Delete button */}
      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-700 hover:bg-gray-900 text-white z-10 shadow"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Circle */}
      <div
        className={`w-[110px] h-[110px] rounded-full cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 border-4 ${
          selected
            ? 'border-slate-400 shadow-2xl shadow-slate-300/50 bg-gradient-to-br from-slate-500 to-slate-700 scale-105'
            : 'border-slate-400 shadow-lg hover:border-slate-600 hover:shadow-xl hover:scale-105 bg-gradient-to-br from-slate-600 to-slate-800'
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        <FlagTriangleRight className="h-8 w-8 text-white drop-shadow" />
        <div className="text-center leading-tight">
          <p className="text-[8px] font-bold tracking-[0.15em] text-white/90 uppercase">Journey</p>
          <p className="text-[9px] font-bold tracking-[0.2em] text-white uppercase">End</p>
        </div>
      </div>

      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white !shadow"
      />
    </div>
  );
}
