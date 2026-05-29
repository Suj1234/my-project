import { X, Box, Trash2 } from 'lucide-react';
import { BlockData } from '../types/journey';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const GROUP_COLORS = [
  { key: 'blue',   label: 'Blue',   dot: 'bg-blue-500',   ring: 'ring-blue-400' },
  { key: 'green',  label: 'Green',  dot: 'bg-green-500',  ring: 'ring-green-400' },
  { key: 'purple', label: 'Purple', dot: 'bg-purple-500', ring: 'ring-purple-400' },
  { key: 'orange', label: 'Orange', dot: 'bg-orange-500', ring: 'ring-orange-400' },
  { key: 'teal',   label: 'Teal',   dot: 'bg-teal-500',   ring: 'ring-teal-400' },
];

interface StepGroupPanelProps {
  block: BlockData;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

export function StepGroupPanel({ block, allBlocks, onClose, onSave, onDelete }: StepGroupPanelProps) {
  const update = (patch: Partial<BlockData>) => {
    onSave({ ...block, ...patch, configured: true });
  };

  const children = allBlocks.filter((b) => b.groupId === block.id);
  const colorKey = block.groupColor ?? 'blue';

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <Box className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Step Group</p>
            <p className="text-xs text-gray-500">{children.length} block{children.length !== 1 ? 's' : ''} inside</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-5 space-y-5">
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-xs text-violet-700">
            A Step Group is a container that visually groups related blocks. Blocks inside share the same step context.
          </div>

          {/* Group Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Group Name</Label>
            <Input
              value={block.groupName ?? ''}
              onChange={(e) => update({ groupName: e.target.value })}
              placeholder="e.g. KYC Verification"
              className="h-9 text-sm"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Color</Label>
            <div className="flex gap-2.5">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.key}
                  className={`w-7 h-7 rounded-full ${c.dot} transition-all ${colorKey === c.key ? `ring-2 ${c.ring} ring-offset-1 scale-110` : 'hover:scale-105'}`}
                  onClick={() => update({ groupColor: c.key })}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Children list */}
          {children.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Blocks inside this group</Label>
              <div className="space-y-1">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{child.name}</span>
                    <span className="text-[10px] text-gray-400 ml-auto uppercase">{child.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-4 border-2 border-dashed border-gray-200 rounded-lg">
              No blocks assigned yet.<br />
              <span className="text-xs">Add blocks and assign them to this group.</span>
            </div>
          )}
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
          Delete Group
        </Button>
      </div>
    </div>
  );
}
