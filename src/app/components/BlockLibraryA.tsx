import { useState } from 'react';
import { Input } from './ui/input';
import {
  Search, ChevronDown, ChevronRight,
  CreditCard, Fingerprint, Camera, Building, TrendingUp, Landmark,
  FileText, FileCheck, PenTool, User, FileBarChart, ReceiptText, Award, Store,
  FileInput, GitBranch, GitMerge, CircleStop, SplitSquareHorizontal, Layers,
} from 'lucide-react';
import { SMART_BLOCKS } from '../data/blockDefinitions';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface BlockLibraryAProps {
  onBlockSelect: (blockType: string, blockId?: string) => void;
}

const iconMap: Record<string, any> = {
  CreditCard, Fingerprint, Camera, Building, TrendingUp, Landmark,
  FileText, FileCheck, PenTool, User, FileBarChart, ReceiptText, Award, Store,
};

const CATEGORY_COLORS: Record<string, { border: string; icon: string; badge: string; dot: string }> = {
  identity:        { border: 'border-blue-500',    icon: 'text-blue-500',    badge: 'bg-blue-100 text-blue-700',    dot: 'text-blue-500' },
  financial:       { border: 'border-emerald-500', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700', dot: 'text-emerald-500' },
  documents:       { border: 'border-amber-500',   icon: 'text-amber-500',   badge: 'bg-amber-100 text-amber-700',   dot: 'text-amber-500' },
  profile:         { border: 'border-purple-500',  icon: 'text-purple-500',  badge: 'bg-purple-100 text-purple-700', dot: 'text-purple-500' },
  fulfilment:      { border: 'border-teal-500',    icon: 'text-teal-500',    badge: 'bg-teal-100 text-teal-700',     dot: 'text-teal-500' },
  decision:        { border: 'border-orange-500',  icon: 'text-orange-500',  badge: 'bg-orange-100 text-orange-700', dot: 'text-orange-500' },
  data_collection: { border: 'border-indigo-500',  icon: 'text-indigo-500',  badge: 'bg-indigo-100 text-indigo-700', dot: 'text-indigo-500' },
};

const SMART_CATEGORIES: { key: string; label: string; colorKey: string; filter: (c: string) => boolean }[] = [
  { key: 'identity',   label: 'Identity & Profile', colorKey: 'identity',   filter: (c) => c === 'identity' || c === 'profile' },
  { key: 'financial',  label: 'Financial',           colorKey: 'financial',  filter: (c) => c === 'financial' },
  { key: 'documents',  label: 'Documents',           colorKey: 'documents',  filter: (c) => c === 'documents' },
  { key: 'fulfilment', label: 'Fulfilment',          colorKey: 'fulfilment', filter: (c) => c === 'fulfilment' },
  { key: 'decision',   label: 'Decision',            colorKey: 'decision',   filter: (c) => c === 'decision' },
];

export function BlockLibraryA({ onBlockSelect }: BlockLibraryAProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredBlocks = SMART_BLOCKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[280px] bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold mb-3">Component Library</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search components..."
            className="pl-8 h-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">

          {/* ── Journey Structure ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-1.5 uppercase">● Journey Structure</h3>
            <div>
              <button
                className="flex items-center gap-1.5 w-full text-sm font-medium text-gray-700 hover:text-gray-900 py-1"
                onClick={() => toggle('structure')}
              >
                {expanded['structure'] ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                <span>Step Markers</span>
                <span className="text-gray-400 text-xs ml-auto">(1)</span>
              </button>
              {expanded['structure'] && (
                <div className="ml-4 mt-1">
                  <div
                    className="border-l-4 border-slate-500 bg-slate-50 p-3 rounded cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => onBlockSelect('step')}
                  >
                    <div className="flex items-start gap-2">
                      <Layers className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium">Step Divider</span>
                          <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px]">STEP</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Group blocks under a named step</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Smart Components ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-2 uppercase">● Smart Components</h3>
            <div className="space-y-1.5">
              {SMART_CATEGORIES.map(({ key, label, colorKey, filter }) => {
                const blocks = filteredBlocks.filter((b) => filter(b.category));
                if (blocks.length === 0) return null;
                const colors = CATEGORY_COLORS[colorKey];
                const isOpen = !!expanded[key];
                return (
                  <div key={key}>
                    <button
                      className="flex items-center gap-1.5 w-full text-sm font-medium text-gray-700 hover:text-gray-900 py-1"
                      onClick={() => toggle(key)}
                    >
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.border.replace('border-', 'bg-')}`} />
                      <span>{label}</span>
                      <span className="text-gray-400 text-xs ml-auto">({blocks.length})</span>
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-1 space-y-1.5">
                        {blocks.map((block) => {
                          const Icon = iconMap[block.icon] ?? CreditCard;
                          return (
                            <div
                              key={block.id}
                              className={`border-l-4 ${colors.border} bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors`}
                              onClick={() => onBlockSelect('smart', block.id)}
                            >
                              <div className="flex items-start gap-2">
                                <Icon className={`h-4 w-4 ${colors.icon} mt-0.5 flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-sm font-medium truncate">{block.name}</span>
                                    <Badge variant="secondary" className={`${colors.badge} text-[10px] flex-shrink-0`}>
                                      SMART
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{block.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Form Component ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-1.5 uppercase">● Form Component</h3>
            <div>
              <button
                className="flex items-center gap-1.5 w-full text-sm font-medium text-gray-700 hover:text-gray-900 py-1"
                onClick={() => toggle('form')}
              >
                {expanded['form'] ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span>Form</span>
                <span className="text-gray-400 text-xs ml-auto">(1)</span>
              </button>
              {expanded['form'] && (
                <div className="ml-4 mt-1">
                  <div
                    className="border-l-4 border-green-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onBlockSelect('form')}
                  >
                    <div className="flex items-start gap-2">
                      <FileInput className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium">Custom Form</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">FORM</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Create custom input collection forms</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Logic ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-1.5 uppercase">● Logic</h3>
            <div>
              <button
                className="flex items-center gap-1.5 w-full text-sm font-medium text-gray-700 hover:text-gray-900 py-1"
                onClick={() => toggle('logic')}
              >
                {expanded['logic'] ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                <span>Logic</span>
                <span className="text-gray-400 text-xs ml-auto">(3)</span>
              </button>
              {expanded['logic'] && (
                <div className="ml-4 mt-1 space-y-1.5">
                  <div
                    className="border-l-4 border-orange-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onBlockSelect('router')}
                  >
                    <div className="flex items-start gap-2">
                      <GitBranch className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium">Conditional Router</span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-[10px]">LOGIC</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Branch journey based on conditions</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="border-l-4 border-indigo-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onBlockSelect('merge')}
                  >
                    <div className="flex items-start gap-2">
                      <GitMerge className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium">Merge</span>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-[10px]">LOGIC</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Merge branched paths into one flow</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="border-l-4 border-purple-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onBlockSelect('decision')}
                  >
                    <div className="flex items-start gap-2">
                      <SplitSquareHorizontal className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium">Decision</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px]">DECISION</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Rule-based verdict: PASS, REJECT, FLAG</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── End Component ── */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-1.5 uppercase">● End Component</h3>
            <div>
              <button
                className="flex items-center gap-1.5 w-full text-sm font-medium text-gray-700 hover:text-gray-900 py-1"
                onClick={() => toggle('end')}
              >
                {expanded['end'] ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                <span>End</span>
                <span className="text-gray-400 text-xs ml-auto">(1)</span>
              </button>
              {expanded['end'] && (
                <div className="ml-4 mt-1">
                  <div
                    className="border-l-4 border-slate-500 bg-gray-50 p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onBlockSelect('end')}
                  >
                    <div className="flex items-start gap-2">
                      <CircleStop className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium">End Component</span>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px]">END</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Journey termination point</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
