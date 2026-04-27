import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { X, GitBranch } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface RouterNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

export function RouterNode({ data, selected }: RouterNodeProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const savedRoutings = (data.routings ?? []).filter((r) => r.saved && r.targetBlockId);
  const hasDefault = Boolean(data.defaultRoute);
  const branchType = data.routerBranchType ?? 'exclusive';

  // Distribute source handles across the bottom edge of the outer div.
  // The outer div is 176px wide. Handles are positioned as a percentage of that.
  const totalHandles = savedRoutings.length + (hasDefault ? 1 : 0);
  const getHandleLeft = (index: number) => {
    if (totalHandles <= 1) return '50%';
    const step = 80 / (totalHandles - 1);
    return `${10 + index * step}%`;
  };

  return (
    <div
      className={`relative transition-all ${selected ? 'scale-105' : ''}`}
      style={{ width: 176, paddingBottom: 32 }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Incoming handle at the top */}
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

      {/* Diamond body */}
      <div
        className={`w-40 h-40 mx-auto bg-white border-4 border-orange-500 transform rotate-45 flex items-center justify-center shadow-lg cursor-pointer ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="transform -rotate-45 text-center px-2">
          <GitBranch className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <div className="font-semibold text-xs mb-1 leading-tight">{data.name}</div>
          <Badge
            variant="secondary"
            className={`text-xs ${branchType === 'inclusive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
          >
            {branchType === 'inclusive' ? 'INCLUSIVE' : 'EXCLUSIVE'}
          </Badge>
          {totalHandles > 0 && (
            <div className="mt-1 text-xs text-orange-600">
              {savedRoutings.length} route{savedRoutings.length !== 1 ? 's' : ''}
              {hasDefault ? ' + default' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Route label chips below diamond */}
      {(savedRoutings.length > 0 || hasDefault) && (
        <div className="flex flex-wrap justify-center gap-1 mt-1 px-1">
          {savedRoutings.map((r) => (
            <span
              key={r.id}
              className="text-xs bg-orange-50 border border-orange-200 text-orange-700 rounded px-1.5 py-0.5 max-w-[80px] truncate"
              title={r.label || `Route`}
            >
              {r.label || 'Route'}
            </span>
          ))}
          {hasDefault && (
            <span className="text-xs bg-gray-50 border border-dashed border-gray-300 text-gray-500 rounded px-1.5 py-0.5">
              default
            </span>
          )}
        </div>
      )}

      {/* One source handle per saved routing */}
      {savedRoutings.map((routing, i) => (
        <Handle
          key={routing.id}
          id={`route-${routing.id}`}
          type="source"
          position={Position.Bottom}
          style={{ left: getHandleLeft(i), bottom: 32 }}
          className="!bg-orange-400 !w-3 !h-3 !border-2 !border-white"
        />
      ))}

      {/* Default route handle */}
      {hasDefault && (
        <Handle
          id="default-route"
          type="source"
          position={Position.Bottom}
          style={{ left: getHandleLeft(savedRoutings.length), bottom: 32 }}
          className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white !border-dashed"
        />
      )}

      {/* Fallback single handle when nothing is saved yet */}
      {totalHandles === 0 && (
        <Handle
          id="fallback"
          type="source"
          position={Position.Bottom}
          style={{ bottom: 32 }}
          className="!bg-gray-400 !w-3 !h-3 !border-2 !border-white"
        />
      )}
    </div>
  );
}
