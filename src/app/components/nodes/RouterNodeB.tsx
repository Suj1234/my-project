/**
 * Canvas B router node.
 * Branch chips: orange wired / grey not-wired with blue "+" button.
 * Default chip: always visible.
 *   - Option 1: "+" button in panel card (handled by RouterPanelB)
 *   - Option 2: click Default chip on canvas → dashed slate line + "Add" button appears below
 *     (node expands downward; handles/chips shift up by the same amount so visual pos unchanged)
 */
import { Handle, Position } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';
import { Button } from '../ui/button';
import { X, GitBranch, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import type React from 'react';

interface RouterNodeBProps {
  data: FlowNodeData;
  selected: boolean;
}

const BASE_PADDING_BOTTOM = 84;
const PENDING_EXTRA = 84; // extra space added below when pending

export function RouterNodeB({ data, selected }: RouterNodeBProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [pendingDefaultAdd, setPendingDefaultAdd] = useState(false);

  const savedRoutings = (data.routings ?? []).filter((r) => r.saved);
  const hasDefault = Boolean(data.defaultRoute);
  const isPending = pendingDefaultAdd && !hasDefault;

  useEffect(() => {
    if (hasDefault) setPendingDefaultAdd(false);
  }, [hasDefault]);

  // Always reserve a slot for default (last position)
  const totalSlots = savedRoutings.length + 1;
  const getLeft = (index: number): string => {
    if (totalSlots <= 1) return '50%';
    const step = 76 / (totalSlots - 1);
    return `${12 + index * step}%`;
  };
  const defaultLeft = getLeft(savedRoutings.length);

  // When pending, node grows downward by PENDING_EXTRA.
  // Handles and chips shift up by PENDING_EXTRA so their canvas position stays the same.
  const paddingBottom = BASE_PADDING_BOTTOM + (isPending ? PENDING_EXTRA : 0);
  const handleBottom = 6 + (isPending ? PENDING_EXTRA : 0);
  const chipsBottom = 30 + (isPending ? PENDING_EXTRA : 0);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const handleDefaultChipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDefault) setPendingDefaultAdd((p) => !p);
  };

  const handlePendingAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDefaultAdd(false);
    data.onAddBlockFromBranch?.(data.id, '__default__');
  };

  return (
    <div
      className={`relative transition-all ${selected ? 'scale-105' : ''}`}
      style={{ width: 220, paddingBottom }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Incoming handle */}
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

      {/* Diamond */}
      <div
        className={`w-40 h-40 mx-auto bg-white border-4 border-orange-500 transform rotate-45 flex items-center justify-center shadow-lg cursor-pointer ${
          selected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => data.onConfigure?.(data.id)}
      >
        <div className="transform -rotate-45 text-center px-2">
          <GitBranch className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <div className="font-semibold text-xs mb-1 leading-tight">{data.name}</div>
          <div className="text-[10px] text-orange-500">
            {savedRoutings.length} branch{savedRoutings.length !== 1 ? 'es' : ''}
            {hasDefault ? ' + default' : ''}
          </div>
        </div>
      </div>

      {/* Chips row — floats between diamond and handles */}
      <div
        className="absolute left-0 right-0 flex justify-around px-2 gap-1"
        style={{ bottom: chipsBottom }}
      >
        {savedRoutings.map((r, i) => (
          <div key={r.id} className="flex flex-col items-center gap-1 min-w-0 flex-1">
            <div className={`rounded-md px-2 py-1 border text-center shadow-sm w-full ${
              r.targetBlockId
                ? 'bg-orange-50 border-orange-300'
                : 'bg-white border-dashed border-gray-300'
            }`}>
              <p className={`text-[10px] font-semibold truncate ${
                r.targetBlockId ? 'text-orange-700' : 'text-gray-500'
              }`}>
                {r.label || `Branch ${i + 1}`}
              </p>
              <p className={`text-[9px] ${r.targetBlockId ? 'text-orange-400' : 'text-gray-400'}`}>
                {r.targetBlockId ? 'wired' : 'not wired'}
              </p>
            </div>
            {!r.targetBlockId && data.onAddBlockFromBranch && (
              <button
                className="h-5 w-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow transition-colors"
                title={`Add block for "${r.label || `Branch ${i + 1}`}"`}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onAddBlockFromBranch!(data.id, r.id);
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Default chip — always present */}
        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
          <div
            onClick={handleDefaultChipClick}
            title={hasDefault ? 'Default route set' : 'Click to add default route'}
            className={`rounded-md px-2 py-1 border text-center shadow-sm w-full transition-colors ${
              hasDefault
                ? 'bg-slate-50 border-slate-300'
                : isPending
                ? 'bg-slate-100 border-slate-400 cursor-pointer ring-1 ring-slate-400'
                : 'bg-white border-dashed border-slate-300 cursor-pointer hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <p className="text-[10px] font-semibold text-slate-600">Default</p>
            <p className="text-[9px] text-slate-400">
              {hasDefault ? 'wired' : isPending ? 'adding…' : 'fallback'}
            </p>
          </div>
        </div>
      </div>

      {/* Source handles for saved routings */}
      {savedRoutings.map((routing, i) => (
        <Handle
          key={routing.id}
          id={`route-${routing.id}`}
          type="source"
          position={Position.Bottom}
          style={{ left: getLeft(i), bottom: handleBottom }}
          className={routing.targetBlockId
            ? '!bg-orange-400 !w-2.5 !h-2.5 !border-2 !border-white'
            : '!bg-gray-300 !w-2.5 !h-2.5 !border-2 !border-white'}
        />
      ))}

      {/* Default route handle */}
      <Handle
        id="default-route"
        type="source"
        position={Position.Bottom}
        style={{ left: defaultLeft, bottom: handleBottom }}
        className={hasDefault
          ? '!bg-slate-500 !w-2.5 !h-2.5 !border-2 !border-white'
          : '!bg-slate-300 !w-2.5 !h-2.5 !border-2 !border-white'}
      />

      {/* Pending default add — dashed line + Add button in expanded space below handles */}
      {isPending && (
        <div
          className="absolute flex flex-col items-center"
          style={{ left: defaultLeft, bottom: 6, transform: 'translateX(-50%)' }}
        >
          {/* Dashed slate line */}
          <div
            style={{
              width: 2,
              height: 52,
              background: 'repeating-linear-gradient(to bottom, #94a3b8 0px, #94a3b8 6px, transparent 6px, transparent 12px)',
            }}
          />
          {/* Add button */}
          <button
            className="mt-1 bg-white border-2 border-slate-400 rounded-full px-3 py-1 text-xs text-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-md whitespace-nowrap transition-colors"
            onClick={handlePendingAdd}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      )}
    </div>
  );
}
