import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X, FlagTriangleRight } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface EndNodeCProps {
  data: FlowNodeData;
  selected: boolean;
}

export function EndNodeC({ data, selected }: EndNodeCProps) {
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

      {/* Card — full-bleed dark gradient, no white body */}
      <div
        className={`w-[260px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-slate-400 shadow-2xl shadow-slate-300/40'
            : 'border-slate-500/60 shadow-lg hover:border-slate-400 hover:shadow-slate-200/40 hover:shadow-xl'
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        {/* Full-bleed dark gradient */}
        <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
          {/* Top row */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner flex-shrink-0 border border-white/20">
                <FlagTriangleRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xs tracking-wider leading-tight">JOURNEY END</p>
                <p className="text-white/60 text-[10px] leading-tight mt-0.5">{data.name || 'End'}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-slate-200 bg-white/15 px-2 py-0.5 rounded-full border border-white/20 flex-shrink-0">
              END
            </span>
          </div>

          {/* Outcome info row */}
          <div className="px-4 pb-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/60 font-medium">Outcome Page</span>
              {outcomePageName ? (
                <span className="text-[10px] font-semibold text-white bg-white/20 px-2 py-0.5 rounded-full border border-white/25 max-w-[130px] truncate">
                  {outcomePageName}
                </span>
              ) : (
                <span className="text-[10px] text-white/40 italic">Not assigned</span>
              )}
            </div>
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
