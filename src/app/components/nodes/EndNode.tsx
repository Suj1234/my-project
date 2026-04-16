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

  const outcomePageName = data.pages?.[0]?.assignedPageId
    ? data.pages[0].assignedPageId
    : data.pages?.[0]?.isConfigured
    ? data.pages[0].name
    : null;

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

      {/* Card */}
      <div
        className={`w-[260px] rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-slate-500 shadow-2xl shadow-slate-100/60'
            : 'border-slate-400 shadow-lg hover:border-slate-500 hover:shadow-xl'
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shadow-inner">
              <FlagTriangleRight className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-xs leading-tight tracking-wide">JOURNEY END</p>
              <p className="text-white/70 text-[10px] leading-tight">{data.name || 'End'}</p>
            </div>
          </div>
          <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full border text-slate-100 bg-white/15 border-white/20">
            END
          </span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-2.5 bg-gradient-to-b from-white to-slate-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">Outcome Page</span>
            {outcomePageName ? (
              <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 max-w-[130px] truncate">
                {outcomePageName}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 italic">Not assigned</span>
            )}
          </div>
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
