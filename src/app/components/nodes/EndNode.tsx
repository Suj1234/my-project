import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
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
      className={`relative transition-all ${selected ? 'scale-105' : ''}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
      />

      {showDelete && data.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white z-10"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div
        className={`w-32 h-32 rounded-full border-4 border-red-500 bg-white flex items-center justify-center shadow-lg cursor-pointer ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="text-center">
          <div className="font-semibold text-red-500 text-sm mb-1">End</div>
          <div className="text-xs text-gray-600">{data.name}</div>
        </div>
      </div>
    </div>
  );
}