import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X, Box } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

const COLOR_MAP: Record<string, { border: string; header: string; bg: string; badge: string; label: string }> = {
  blue:   { border: 'border-blue-300',   header: 'bg-blue-600',   bg: 'bg-blue-50/60',   badge: 'bg-blue-100 text-blue-800',   label: 'text-blue-800' },
  green:  { border: 'border-green-300',  header: 'bg-green-600',  bg: 'bg-green-50/60',  badge: 'bg-green-100 text-green-800',  label: 'text-green-800' },
  purple: { border: 'border-purple-300', header: 'bg-purple-600', bg: 'bg-purple-50/60', badge: 'bg-purple-100 text-purple-800', label: 'text-purple-800' },
  orange: { border: 'border-orange-300', header: 'bg-orange-500', bg: 'bg-orange-50/60', badge: 'bg-orange-100 text-orange-800', label: 'text-orange-800' },
  teal:   { border: 'border-teal-300',   header: 'bg-teal-600',   bg: 'bg-teal-50/60',   badge: 'bg-teal-100 text-teal-800',   label: 'text-teal-800' },
};

interface StepGroupNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

export function StepGroupNode({ data, selected }: StepGroupNodeProps) {
  const [showDelete, setShowDelete] = useState(false);

  const colorKey = data.groupColor ?? 'blue';
  const colors = COLOR_MAP[colorKey] ?? COLOR_MAP['blue'];
  const groupName = data.groupName || 'Untitled Group';
  const width = data.groupWidth ?? 560;
  const height = data.groupHeight ?? 500;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  return (
    <div
      style={{ width, height }}
      className={`relative rounded-xl border-2 ${colors.border} ${colors.bg} transition-all duration-150 ${
        selected ? 'shadow-2xl' : 'shadow-md hover:shadow-lg'
      }`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={() => data.onConfigure?.(data.id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white !shadow"
      />

      {/* Delete button */}
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

      {/* Header bar */}
      <div className={`${colors.header} rounded-t-[10px] px-4 py-2.5 flex items-center gap-2`}>
        <Box className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
        <span className="text-white font-semibold text-sm truncate flex-1">{groupName}</span>
        <span className="text-[9px] font-bold tracking-widest text-white/70 bg-white/20 px-2 py-0.5 rounded-full">
          STEP GROUP
        </span>
      </div>

      {/* Drop zone hint */}
      <div className="absolute inset-x-4 bottom-4 border-2 border-dashed border-current opacity-20 rounded-lg pointer-events-none" style={{ top: 52 }} />
      <p className={`absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium opacity-30 whitespace-nowrap pointer-events-none ${colors.label}`}>
        Drop blocks here
      </p>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white !shadow"
      />
    </div>
  );
}
