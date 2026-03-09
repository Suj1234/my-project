import { Handle, Position } from '@xyflow/react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { FlowNodeData } from '../../types/journey';

interface StartNodeProps {
  data: FlowNodeData;
}

export function StartNode({ data }: StartNodeProps) {
  return (
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
        <span className="font-semibold">Start</span>
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
          onClick={() => data.onAddBlock?.(data.id)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}