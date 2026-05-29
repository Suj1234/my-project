import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X, Layers } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface StepDividerNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

export function StepDividerNode({ data, selected }: StepDividerNodeProps) {
  const [showDelete, setShowDelete] = useState(false);

  const stepNum = data.stepNumber ?? 1;
  const stepName = data.stepName || 'Untitled Step';
  const stepDesc = data.stepDescription || 'Configure this step';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onAddBlock?.(data.id);
  };

  return (
    <div
      className={`relative transition-all duration-150 ${selected ? 'drop-shadow-xl' : ''}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white !shadow"
      />

      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white z-10 shadow"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Banner */}
      <div
        className={`w-[520px] rounded-xl overflow-hidden cursor-pointer transition-all duration-150 border-2 ${
          selected
            ? 'border-slate-500 shadow-2xl'
            : 'border-slate-300 shadow-md hover:border-slate-500 hover:shadow-lg'
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500" />

        {/* Main content */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3 flex items-center justify-between">
          {/* Left: number badge + text */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shadow-inner flex-shrink-0">
              <span className="text-white font-bold text-sm">{stepNum}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <p className="text-slate-800 font-semibold text-sm leading-tight">{stepName}</p>
              </div>
              <p className="text-slate-500 text-[11px] leading-tight mt-0.5">{stepDesc}</p>
            </div>
          </div>

          {/* Right: badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[9px] font-bold tracking-widest text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
              STEP
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white !shadow"
      />

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs bg-white shadow-sm border"
          onClick={handleAddClick}
        >
          + Add
        </Button>
      </div>
    </div>
  );
}
