import { useState } from 'react';
import { Input } from './ui/input';
import { Search, ChevronDown, ChevronRight, CreditCard, Fingerprint, Camera, Building, TrendingUp, Landmark, FileText, FileCheck, PenTool, User, FileInput, GitBranch, CircleStop } from 'lucide-react';
import { SMART_BLOCKS } from '../data/blockDefinitions';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface BlockLibraryProps {
  onBlockSelect: (blockType: string, blockId?: string) => void;
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

export function BlockLibrary({ onBlockSelect }: BlockLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    identity: true,
    financial: true,
    documents: true,
    profile: true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const filteredBlocks = SMART_BLOCKS.filter(
    (block) =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const blocksByCategory = {
    identity: filteredBlocks.filter((b) => b.category === 'identity'),
    financial: filteredBlocks.filter((b) => b.category === 'financial'),
    documents: filteredBlocks.filter((b) => b.category === 'documents'),
    profile: filteredBlocks.filter((b) => b.category === 'profile'),
  };

  return (
    <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold mb-3">Block Library</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search blocks..."
            className="pl-8 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Smart Blocks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">● SMART BLOCKS</h3>
            <div className="space-y-2">
              {Object.entries(blocksByCategory).map(([category, blocks]) => (
                <div key={category}>
                  <button
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 w-full"
                    onClick={() => toggleCategory(category)}
                  >
                    {expandedCategories[category] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="capitalize">{category}</span>
                    <span className="text-gray-500">({blocks.length})</span>
                  </button>
                  {expandedCategories[category] && (
                    <div className="ml-5 mt-2 space-y-2">
                      {blocks.map((block) => {
                        const Icon = iconMap[block.icon];
                        return (
                          <div
                            key={block.id}
                            className="border-l-4 border-blue-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => onBlockSelect('smart', block.id)}
                          >
                            <div className="flex items-start gap-2 mb-1">
                              <Icon className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-sm font-medium">{block.name}</span>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                    SMART
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {block.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Block */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">● FORM BLOCK</h3>
            <div
              className="border-l-4 border-green-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onBlockSelect('form')}
            >
              <div className="flex items-start gap-2 mb-1">
                <FileInput className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium">Custom Form Block</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      FORM
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Create custom input collection forms
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logic */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">● LOGIC</h3>
            <div
              className="border-l-4 border-orange-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onBlockSelect('router')}
            >
              <div className="flex items-start gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium">Conditional Router</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      LOGIC
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Branch journey based on conditions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* End Blocks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">● END BLOCKS</h3>
            <div
              className="border-l-4 border-red-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => onBlockSelect('end')}
            >
              <div className="flex items-start gap-2 mb-1">
                <CircleStop className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium">End Block</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                      END
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Journey termination point
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
