import { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import type { ApiRequestField } from '../data/apiCatalog';
import type { InputMapping } from '../types/journey';

// ─── Tree building ─────────────────────────────────────────────────────────────

interface TreeNode {
  key: string;
  originalPath: string;
  isLeaf: boolean;
  field?: ApiRequestField;
  children: Record<string, TreeNode>;
}

function buildRequestTree(fields: ApiRequestField[]): Record<string, TreeNode> {
  const root: Record<string, TreeNode> = {};
  for (const field of fields) {
    const segments = field.path.replace(/\[\d+\]/g, '').split('.');
    let current = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLast = i === segments.length - 1;
      if (!current[seg]) {
        current[seg] = { key: seg, originalPath: segments.slice(0, i + 1).join('.'), isLeaf: false, children: {} };
      }
      if (isLast) {
        current[seg].isLeaf = true;
        current[seg].field = field;
        current[seg].originalPath = field.path;
      }
      current = current[seg].children;
    }
  }
  return root;
}

// ─── Tree node ─────────────────────────────────────────────────────────────────

interface NodeProps {
  nodeKey: string;
  node: TreeNode;
  depth: number;
  mappings: InputMapping[];
  selectedPath: string | null;
  onSelectField: (f: ApiRequestField) => void;
}

function RequestTreeNode({ nodeKey, node, depth, mappings, selectedPath, onSelectField }: NodeProps) {
  const [expanded, setExpanded] = useState(true);
  const indent = depth * 16;

  if (node.isLeaf && node.field) {
    const f = node.field;
    const m = mappings.find(mp => mp.requestPath === f.path);
    const isMapped = Boolean(m?.sourceValue?.trim());
    const isSelected = selectedPath === f.path;
    return (
      <div
        className={`flex items-center gap-1.5 py-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : 'hover:bg-gray-50'}`}
        style={{ paddingLeft: `${indent + 8}px`, paddingRight: '8px' }}
        onClick={() => onSelectField(f)}
      >
        {isMapped
          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
          : f.isRequired
            ? <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
        <span className="text-xs font-medium text-gray-800 shrink-0">{nodeKey}</span>
        {f.isRequired && <span className="text-red-400 text-[10px] shrink-0">*</span>}
        {f.fieldType && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
            f.fieldType === 'number'  ? 'bg-blue-50 text-blue-600'   :
            f.fieldType === 'boolean' ? 'bg-green-50 text-green-600' :
            f.fieldType === 'date'    ? 'bg-purple-50 text-purple-600' :
            f.fieldType === 'phone'   ? 'bg-orange-50 text-orange-600' :
            f.fieldType === 'email'   ? 'bg-pink-50 text-pink-600'   :
            'bg-gray-100 text-gray-500'
          }`}>{f.fieldType}</span>
        )}
        <span className="flex-1" />
        {isMapped
          ? <span className="text-[10px] font-mono text-green-700 truncate max-w-[160px]">{m!.sourceType}.{m!.sourceValue}</span>
          : <span className="text-[10px] text-gray-400 italic shrink-0">not mapped</span>}
      </div>
    );
  }

  const childCount = Object.keys(node.children).length;
  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 cursor-pointer hover:bg-gray-50 rounded select-none"
        style={{ paddingLeft: `${indent + 4}px`, paddingRight: '8px' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-gray-400 shrink-0">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
        <span className="text-xs font-semibold text-blue-700 shrink-0">{nodeKey}</span>
        <span className="text-[10px] text-gray-400 italic ml-1">{childCount} fields</span>
      </div>
      {expanded && (
        <div className="border-l border-gray-200 ml-4">
          {Object.entries(node.children).map(([k, child]) => (
            <RequestTreeNode key={k} nodeKey={k} node={child} depth={depth + 1}
              mappings={mappings} selectedPath={selectedPath} onSelectField={onSelectField} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Public ────────────────────────────────────────────────────────────────────

export interface RequestFieldTreeProps {
  fields: ApiRequestField[];
  mappings: InputMapping[];
  selectedPath: string | null;
  onSelectField: (f: ApiRequestField) => void;
}

export function RequestFieldTree({ fields, mappings, selectedPath, onSelectField }: RequestFieldTreeProps) {
  const tree = buildRequestTree(fields);
  const mappedCount = fields.filter(f => Boolean(mappings.find(m => m.requestPath === f.path)?.sourceValue?.trim())).length;
  const reqTotal = fields.filter(f => f.isRequired).length;
  const reqMapped = fields.filter(f => f.isRequired && Boolean(mappings.find(m => m.requestPath === f.path)?.sourceValue?.trim())).length;
  return (
    <div>
      <div className="px-3 py-1.5 border-b bg-gray-50 text-[10px] text-gray-500 flex gap-3">
        <span>{mappedCount} / {fields.length} mapped</span>
        {reqTotal > 0 && <span className="text-red-500">{reqMapped} / {reqTotal} required</span>}
      </div>
      <div className="p-1">
        {Object.entries(tree).map(([k, node]) => (
          <RequestTreeNode key={k} nodeKey={k} node={node} depth={0}
            mappings={mappings} selectedPath={selectedPath} onSelectField={onSelectField} />
        ))}
      </div>
    </div>
  );
}
