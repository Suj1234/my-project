import { Plus, Trash2 } from 'lucide-react';
import { FlowOutputMapping, FlowStep } from '../../../types/apiFlow';

interface OutputMappingsTabProps {
  step: FlowStep;
  stepIndex: number;
  allSteps: FlowStep[];
  onChange: (mappings: FlowOutputMapping[]) => void;
  // Context hint shown below the table
  contextHint?: string;
}

export function OutputMappingsTab({
  step,
  stepIndex,
  onChange,
  contextHint,
}: OutputMappingsTabProps) {
  const mappings = step.outputMappings ?? [];

  const add = () =>
    onChange([
      ...mappings,
      { id: `om-${Date.now()}`, responsePath: '', variableName: '', label: '' },
    ]);

  const remove = (id: string) => onChange(mappings.filter((m) => m.id !== id));

  const update = (id: string, field: keyof FlowOutputMapping, value: string) =>
    onChange(mappings.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const defaultHint =
    step.type === 'api_call'
      ? 'Map response JSON fields to flow variables. Use JSONPath (e.g. $.result.link). Downstream: {{flow.steps.' + stepIndex + '.output.variableName}}'
      : step.type === 'redirect'
      ? 'Map callback parameters to flow variables. Use "callback.<paramName>" as the path (e.g. callback.code). Downstream: {{flow.steps.' + stepIndex + '.output.variableName}}'
      : step.type === 'transform'
      ? 'These are populated automatically from your transform operations above.'
      : '';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-semibold text-gray-700">Output Mappings</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Define what this step exposes to downstream steps
            </p>
          </div>
          {step.type !== 'transform' && (
            <button
              onClick={add}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 transition-colors"
            >
              <Plus size={10} /> Add Mapping
            </button>
          )}
        </div>
      </div>

      {mappings.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center">
          <p className="text-xs text-gray-400">No output mappings yet</p>
          {step.type !== 'transform' && (
            <button
              onClick={add}
              className="mt-3 text-xs text-teal-600 hover:underline"
            >
              + Add first mapping
            </button>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <span>
              {step.type === 'redirect' ? 'Callback Param Path' : 'Response Path (JSONPath)'}
            </span>
            <span>Variable Name</span>
            <span>Label (optional)</span>
            <span />
          </div>
          {mappings.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-4 py-2.5 border-b border-gray-100 last:border-0 items-center"
            >
              <input
                value={m.responsePath}
                onChange={(e) => update(m.id, 'responsePath', e.target.value)}
                placeholder={step.type === 'redirect' ? 'callback.code' : '$.result.link'}
                className="text-[11px] font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
              />
              <input
                value={m.variableName}
                onChange={(e) => update(m.id, 'variableName', e.target.value)}
                placeholder="redirectLink"
                className="text-[11px] font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
              />
              <input
                value={m.label ?? ''}
                onChange={(e) => update(m.id, 'label', e.target.value)}
                placeholder="OAuth Redirect URL"
                className="text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
              />
              <button
                onClick={() => remove(m.id)}
                className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      {(contextHint ?? defaultHint) && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-[10px] text-blue-700 leading-relaxed font-mono">
            {`{{flow.steps.${stepIndex}.output.variableName}}`}
          </p>
          <p className="text-[10px] text-blue-600 mt-1 leading-relaxed">
            {contextHint ?? defaultHint}
          </p>
        </div>
      )}
    </div>
  );
}
