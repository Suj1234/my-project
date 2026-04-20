import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X, FlagTriangleRight } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface EndNodeAProps {
  data: FlowNodeData;
  selected: boolean;
}

export function EndNodeA({ data, selected }: EndNodeAProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  return (
    <div
      className="relative transition-all duration-150"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Delete button */}
      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-gray-700 hover:bg-gray-900 text-white z-10 shadow"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Pill / Stadium shape */}
      <div
        className={`w-[260px] rounded-full overflow-hidden cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-slate-500 shadow-2xl shadow-slate-200/60'
            : 'border-slate-400 shadow-md hover:border-slate-600 hover:shadow-lg'
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
              <FlagTriangleRight className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs tracking-wide leading-tight">JOURNEY END</p>
              <p className="text-white/70 text-[10px] leading-tight">{data.name || 'End'}</p>
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-slate-100 bg-white/15 px-2 py-0.5 rounded-full border border-white/20 flex-shrink-0">
            END
          </span>
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
