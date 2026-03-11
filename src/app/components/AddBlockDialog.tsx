import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { SMART_BLOCKS } from '../data/blockDefinitions';
import { Badge } from './ui/badge';
import {
  CreditCard,
  Fingerprint,
  Camera,
  Building,
  TrendingUp,
  Landmark,
  FileText,
  FileCheck,
  PenTool,
  User,
  FileInput,
  GitBranch,
  GitMerge,
  CircleStop,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AddBlockDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (blockType: string, blockTypeId?: string) => void;
}

const iconMap: Record<string, any> = {
  CreditCard,
  Fingerprint,
  Camera,
  Building,
  TrendingUp,
  Landmark,
  FileText,
  FileCheck,
  PenTool,
  User,
};

export function AddBlockDialog({ open, onClose, onSelect }: AddBlockDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSmartBlocks = SMART_BLOCKS.filter(
    (block) =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (blockType: string, blockTypeId?: string) => {
    onSelect(blockType, blockTypeId);
    onClose();
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search blocks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {/* Smart Blocks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Smart Blocks</h3>
                <div className="space-y-2">
                  {filteredSmartBlocks.map((block) => {
                    const Icon = iconMap[block.icon];
                    return (
                      <button
                        key={block.id}
                        className="w-full border-l-4 border-blue-500 bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors text-left"
                        onClick={() => handleSelect('smart', block.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-sm font-medium">{block.name}</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                                SMART
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">{block.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Block */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Form Block</h3>
                <button
                  className="w-full border-l-4 border-green-500 bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors text-left"
                  onClick={() => handleSelect('form')}
                >
                  <div className="flex items-start gap-2">
                    <FileInput className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-sm font-medium">Custom Form Block</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          FORM
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">Create custom input collection forms</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Logic */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Logic</h3>
                <div className="space-y-2">
                  <button
                    className="w-full border-l-4 border-orange-500 bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors text-left"
                    onClick={() => handleSelect('router')}
                  >
                    <div className="flex items-start gap-2">
                      <GitBranch className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-sm font-medium">Conditional Router</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                            LOGIC
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">Branch journey based on conditions</p>
                      </div>
                    </div>
                  </button>
                  <button
                    className="w-full border-l-4 border-indigo-500 bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors text-left"
                    onClick={() => handleSelect('merge')}
                  >
                    <div className="flex items-start gap-2">
                      <GitMerge className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-sm font-medium">Merge Block</span>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
                            LOGIC
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">Merge branched paths into one flow</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* End Block */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">End Blocks</h3>
                <button
                  className="w-full border-l-4 border-red-500 bg-gray-50 p-3 rounded hover:bg-gray-100 transition-colors text-left"
                  onClick={() => handleSelect('end')}
                >
                  <div className="flex items-start gap-2">
                    <CircleStop className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-sm font-medium">End Block</span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                          END
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">Journey termination point</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
