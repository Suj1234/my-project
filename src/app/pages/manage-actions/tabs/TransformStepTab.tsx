import { useState } from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import { FlowStep, TransformOperation, TransformType, FlowOutputMapping } from '../../../types/apiFlow';
import { VariableInput } from '../components/VariableInput';

interface TransformStepTabProps {
  step: FlowStep;
  onChange: (updated: FlowStep) => void;
}

const TRANSFORM_TYPES: { value: TransformType; label: string; description: string }[] = [
  { value: 'map',           label: 'Map / Copy',      description: 'Copy a value from one variable to another' },
  { value: 'template',      label: 'String Template', description: 'Build a string from a template with variables' },
  { value: 'base64_encode', label: 'Base64 Encode',   description: 'Encode a value to Base64' },
  { value: 'base64_decode', label: 'Base64 Decode',   description: 'Decode a Base64 value' },
  { value: 'url_encode',    label: 'URL Encode',      description: 'Percent-encode a string for use in URLs' },
  { value: 'url_decode',    label: 'URL Decode',      description: 'Decode a percent-encoded string' },
  { value: 'json_stringify',label: 'JSON Stringify',  description: 'Convert an object/array to a JSON string' },
  { value: 'json_parse',    label: 'JSON Parse',      description: 'Parse a JSON string into an object' },
];

function TransformRow({
  op,
  onUpdate,
  onRemove,
}: {
  op: TransformOperation;
  onUpdate: (updated: TransformOperation) => void;
  onRemove: () => void;
}) {
  const upd = (field: keyof TransformOperation, val: string) =>
    onUpdate({ ...op, [field]: val });

  const isInputOp = op.type !== 'template';
  const isTemplateOp = op.type === 'template';

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        {/* Type selector */}
        <div className="flex-1">
          <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Operation</label>
          <select
            value={op.type}
            onChange={(e) => upd('type', e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            {TRANSFORM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="text-[9px] text-gray-400 mt-0.5">
            {TRANSFORM_TYPES.find((t) => t.value === op.type)?.description}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 mt-5 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Input path / template */}
      {isInputOp && (
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Input</label>
          <VariableInput
            value={op.inputPath ?? ''}
            onChange={(v) => upd('inputPath', v)}
            placeholder="{{flow.steps.0.output.redirectLink}}"
          />
        </div>
      )}

      {isTemplateOp && (
        <div>
          <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Template</label>
          <VariableInput
            value={op.template ?? ''}
            onChange={(v) => upd('template', v)}
            placeholder="{{flow.steps.0.output.firstName}} {{flow.steps.0.output.lastName}}"
          />
          <p className="text-[9px] text-gray-400 mt-0.5">Use variable placeholders anywhere in the template string.</p>
        </div>
      )}

      {/* Output variable */}
      <div>
        <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Output Variable Name</label>
        <input
          type="text"
          value={op.outputVariable}
          onChange={(e) => upd('outputVariable', e.target.value)}
          placeholder="encodedPayload"
          className="w-full text-[11px] font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
        />
        <p className="text-[9px] text-gray-400 mt-0.5">
          Access downstream as{' '}
          <code className="bg-blue-50 text-blue-700 px-1 rounded font-mono">
            {`{{flow.steps.N.output.${op.outputVariable || 'variableName'}}}`}
          </code>
        </p>
      </div>

      {/* Optional label */}
      <div>
        <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Label (optional)</label>
        <input
          type="text"
          value={op.label ?? ''}
          onChange={(e) => upd('label', e.target.value)}
          placeholder="Encoded credential string"
          className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

export function TransformStepTab({ step, onChange }: TransformStepTabProps) {
  const ops = step.transformations ?? [];

  const addOp = () => {
    const newOp: TransformOperation = {
      id: `tr-${Date.now()}`,
      type: 'map',
      outputVariable: '',
      inputPath: '',
    };
    onChange({ ...step, transformations: [...ops, newOp] });
  };

  const updateOp = (idx: number, updated: TransformOperation) => {
    const next = [...ops];
    next[idx] = updated;
    // Sync output mappings from transform operations
    const mappings: FlowOutputMapping[] = next
      .filter((o) => o.outputVariable)
      .map((o) => ({
        id: o.id,
        responsePath: `transform.${o.outputVariable}`,
        variableName: o.outputVariable,
        label: o.label,
      }));
    onChange({ ...step, transformations: next, outputMappings: mappings });
  };

  const removeOp = (idx: number) => {
    const next = ops.filter((_, i) => i !== idx);
    const mappings: FlowOutputMapping[] = next
      .filter((o) => o.outputVariable)
      .map((o) => ({
        id: o.id,
        responsePath: `transform.${o.outputVariable}`,
        variableName: o.outputVariable,
        label: o.label,
      }));
    onChange({ ...step, transformations: next, outputMappings: mappings });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700">Transform Operations</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Each operation produces an output variable accessible to downstream steps
          </p>
        </div>
        <button
          onClick={addOp}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 transition-colors"
        >
          <Plus size={10} /> Add Operation
        </button>
      </div>

      {ops.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center">
          <p className="text-xs text-gray-400">No transform operations yet</p>
          <button onClick={addOp} className="mt-2 text-xs text-teal-600 hover:underline">
            + Add first operation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ops.map((op, idx) => (
            <TransformRow
              key={op.id}
              op={op}
              onUpdate={(updated) => updateOp(idx, updated)}
              onRemove={() => removeOp(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Transform Step Test Tab ──────────────────────────────────────────────────

export function TransformStepTestTab({ step }: { step: FlowStep }) {
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});
  const ops = step.transformations ?? [];

  const extractPaths = (text?: string) => {
    const matches = text?.match(/\{\{([^}]+)\}\}/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(2, -2)))];
  };

  const allVarPaths = [...new Set(
    ops.flatMap((op) => [
      ...extractPaths(op.inputPath),
      ...extractPaths(op.template),
    ])
  )];

  const resolveVars = (text: string) =>
    text.replace(/\{\{([^}]+)\}\}/g, (_, path) => sampleVars[path] ?? `{{${path}}}`);

  const applyOp = (op: TransformOperation): string => {
    try {
      const input = resolveVars(
        op.type === 'template' ? (op.template ?? '') : (op.inputPath ?? '')
      );
      switch (op.type) {
        case 'map': return input;
        case 'template': return input;
        case 'base64_encode': return btoa(input);
        case 'base64_decode': return atob(input);
        case 'url_encode': return encodeURIComponent(input);
        case 'url_decode': return decodeURIComponent(input);
        case 'json_stringify': return JSON.stringify(JSON.parse(input));
        case 'json_parse': return JSON.stringify(JSON.parse(input), null, 2);
        default: return input;
      }
    } catch {
      return '(error — check input)';
    }
  };

  return (
    <div className="space-y-5">
      {allVarPaths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Sample Variable Values</p>
          <div className="space-y-2">
            {allVarPaths.map((path) => (
              <div key={path} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center">
                <p className="text-[10px] font-mono text-gray-600">{`{{${path}}}`}</p>
                <input
                  type="text"
                  value={sampleVars[path] ?? ''}
                  onChange={(e) => setSampleVars((prev) => ({ ...prev, [path]: e.target.value }))}
                  placeholder="sample value"
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono placeholder:text-gray-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {ops.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Transform Preview</p>
          <div className="space-y-2">
            {ops.map((op) => (
              <div key={op.id} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-gray-600">
                    {TRANSFORM_TYPES.find((t) => t.value === op.type)?.label ?? op.type}
                    {op.label && <span className="ml-1 font-normal text-gray-400">— {op.label}</span>}
                  </span>
                  <code className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                    {op.outputVariable || '(no output variable)'}
                  </code>
                </div>
                <div className="bg-gray-950 rounded-lg px-3 py-2 font-mono text-[10px] text-green-300 break-all">
                  {op.outputVariable ? applyOp(op) : <span className="text-gray-500">Set an output variable name</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ops.length === 0 && (
        <p className="text-xs text-gray-400">Add transform operations to see preview.</p>
      )}
    </div>
  );
}
