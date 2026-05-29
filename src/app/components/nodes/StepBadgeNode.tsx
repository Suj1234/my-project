import { NodeProps } from '@xyflow/react';
import { FlowNodeData } from '../../types/journey';

interface StepBadgeData extends FlowNodeData {
  stepName?: string;
  unassigned?: boolean;
}

export function StepBadgeNode({ data }: NodeProps) {
  const nodeData = data as StepBadgeData;

  if (nodeData.unassigned) {
    return (
      <div className="flex items-center gap-1 pointer-events-none select-none">
        <span className="px-2.5 py-0.5 rounded-full border border-amber-400 bg-amber-50 text-[10px] font-semibold text-amber-700 shadow-sm whitespace-nowrap">
          ⚠ Not assigned to a step
        </span>
      </div>
    );
  }

  const label = nodeData.stepLabel ?? '';
  const stepName = nodeData.stepName;

  return (
    <div className="flex items-center gap-1 pointer-events-none select-none">
      {stepName && (
        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-white text-[10px] font-semibold whitespace-nowrap">
          {stepName}
        </span>
      )}
      <span className="px-2.5 py-0.5 rounded-full border border-slate-300 bg-white text-[10px] font-semibold text-slate-600 shadow-sm whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
