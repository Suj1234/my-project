import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface DecisionNodeProps {
  data: FlowNodeData;
  selected: boolean;
}

const VERDICT_COLORS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700',
  REJECT: 'bg-red-100 text-red-700',
  FLAG: 'bg-orange-100 text-orange-700',
  MANUAL_REVIEW: 'bg-gray-100 text-gray-700',
};

export function DecisionNode({ data, selected }: DecisionNodeProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onAddBlock?.(data.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const rules = data.decisionConfig?.rules ?? [];
  const defaultVerdict = data.decisionConfig?.defaultVerdict ?? 'PASS';

  // Collect unique verdicts used
  const usedVerdicts = Array.from(
    new Set([...rules.map((r) => r.verdict), defaultVerdict])
  );

  return (
    <div
      className={`relative bg-white rounded-lg shadow-md min-w-[280px] transition-all ${
        selected ? 'ring-2 ring-purple-500 scale-105' : ''
      }`}
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
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
          onClick={handleDeleteClick}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div
        className="border-l-4 border-purple-500 p-4 cursor-pointer"
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⬡</span>
            <h3 className="font-semibold text-sm">{data.name}</h3>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
            DECISION
          </Badge>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          {rules.length} rule{rules.length !== 1 ? 's' : ''}
          {rules.length > 0 ? ` · evaluates ${Array.from(new Set(rules.flatMap(r => r.conditions.map(c => c.field)))).slice(0, 2).join(', ')}${Array.from(new Set(rules.flatMap(r => r.conditions.map(c => c.field)))).length > 2 ? '...' : ''}` : ' configured'}
        </p>

        {/* Verdict badges */}
        {usedVerdicts.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {usedVerdicts.map((v) => (
              <span
                key={v}
                className={`text-xs px-2 py-0.5 rounded font-semibold ${VERDICT_COLORS[v] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {v.replace('_', ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Badge
            variant={data.configured ? 'default' : 'secondary'}
            className={data.configured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
          >
            {data.configured ? '✓ Configured' : 'Not Configured'}
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
