import { X, Layers, Trash2 } from 'lucide-react';
import { BlockData } from '../types/journey';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface StepDividerPanelProps {
  block: BlockData;
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

export function StepDividerPanel({ block, onClose, onSave, onDelete }: StepDividerPanelProps) {
  const update = (patch: Partial<BlockData>) => {
    onSave({ ...block, ...patch, configured: true });
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Layers className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Step Divider</p>
            <p className="text-xs text-gray-500">Step {block.stepNumber ?? 1}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-5 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
            A Step Divider groups the blocks below it under a named step. Blocks between two dividers belong to the step above them.
          </div>

          {/* Step Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Step Name</Label>
            <Input
              value={block.stepName ?? ''}
              onChange={(e) => update({ stepName: e.target.value })}
              placeholder="e.g. KYC Verification"
              className="h-9 text-sm"
            />
          </div>

          {/* Step Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Step Description</Label>
            <Textarea
              value={block.stepDescription ?? ''}
              onChange={(e) => update({ stepDescription: e.target.value })}
              placeholder="e.g. Verify identity using PAN and Aadhaar"
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Step Number (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Step Number</Label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{block.stepNumber ?? 1}</span>
              </div>
              <p className="text-xs text-gray-500">Auto-calculated based on position in canvas</p>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200"
          onClick={() => onDelete(block.id)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete Step Divider
        </Button>
      </div>
    </div>
  );
}
