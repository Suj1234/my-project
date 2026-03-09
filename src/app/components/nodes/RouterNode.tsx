import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, X, GitBranch } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface RouterNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

export function RouterNode({ data, selected }: RouterNodeProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onAddBlock?.(data.id);
  };

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
        className={`w-40 h-40 bg-white border-4 border-orange-500 transform rotate-45 flex items-center justify-center shadow-lg cursor-pointer ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="transform -rotate-45 text-center">
          <GitBranch className="h-6 w-6 text-orange-500 mx-auto mb-2" />
          <div className="font-semibold text-sm mb-1">{data.name}</div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
            LOGIC
          </Badge>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
      />

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs bg-white shadow-sm border"
          onClick={handleAddClick}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}