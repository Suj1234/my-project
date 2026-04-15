import { useState } from 'react';
import { Plus, Trash2, Play, ExternalLink } from 'lucide-react';
import { FlowStep } from '../../../types/apiFlow';
import { VariableInput } from '../components/VariableInput';

interface RedirectStepTabProps {
  step: FlowStep;
  onChange: (updated: FlowStep) => void;
}

export function RedirectStepTab({ step, onChange }: RedirectStepTabProps) {
  const params = step.callbackParams ?? [];

  const upd = (field: keyof FlowStep, val: unknown) => onChange({ ...step, [field]: val });

  const addParam = () =>
    onChange({ ...step, callbackParams: [...params, { name: '', description: '' }] });

  const updateParam = (idx: number, field: 'name' | 'description', val: string) => {
    const next = [...params];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...step, callbackParams: next });
  };

  const removeParam = (idx: number) =>
    onChange({ ...step, callbackParams: params.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6">
      {/* Redirect URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Redirect URL <span className="text-red-400">*</span>
        </label>
        <VariableInput
          value={step.redirectUrl ?? ''}
          onChange={(v) => upd('redirectUrl', v)}
          placeholder="{{flow.steps.0.output.redirectLink}} or https://example.com/consent"
        />
        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
          The user's browser will be redirected to this URL. Use output variables from previous steps (e.g. the link returned by a DigiLocker /link API call).
        </p>
      </div>

      <div className="border-t border-gray-100" />

      {/* On Error */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">On Error</p>
        <div className="flex gap-2">
          {(['stop', 'continue', 'skip'] as const).map((v) => (
            <button
              key={v}
              onClick={() => upd('onError', v)}
              className={`flex-1 py-2 text-[10px] font-medium rounded-lg border transition-colors capitalize ${
                (step.onError ?? 'stop') === v
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {v === 'stop' ? 'Stop Flow' : v === 'continue' ? 'Continue' : 'Skip Step'}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Callback params */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-medium text-gray-700">Expected Callback Parameters</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Parameters the external service will send back when redirecting the user to your callback URL
            </p>
          </div>
          <button
            onClick={addParam}
            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-teal-600 text-teal-700 hover:bg-teal-50 transition-colors"
          >
            <Plus size={10} /> Add Param
          </button>
        </div>

        {params.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-6 text-center mt-2">
            <p className="text-xs text-gray-400">No callback parameters defined</p>
            <button onClick={addParam} className="mt-2 text-xs text-teal-600 hover:underline">
              + Add first parameter
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
            <div className="grid grid-cols-[1fr_2fr_32px] gap-0 text-[10px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <span>Parameter Name</span>
              <span>Description</span>
              <span />
            </div>
            {params.map((p, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2fr_32px] gap-2 px-4 py-2.5 border-b border-gray-100 last:border-0 items-center">
                <input
                  value={p.name}
                  onChange={(e) => updateParam(idx, 'name', e.target.value)}
                  placeholder="code"
                  className="text-[11px] font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
                />
                <input
                  value={p.description ?? ''}
                  onChange={(e) => updateParam(idx, 'description', e.target.value)}
                  placeholder="Authorization code returned by consent page"
                  className="text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
                />
                <button
                  onClick={() => removeParam(idx)}
                  className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
          Use <code className="bg-gray-100 px-1 rounded font-mono">callback.&lt;paramName&gt;</code> as the Response Path in Output Mappings to capture these values.
        </p>
      </div>
    </div>
  );
}

// ─── Redirect Step Test Tab ───────────────────────────────────────────────────

export function RedirectStepTestTab({
  step,
  stepIndex,
  allSteps,
}: {
  step: FlowStep;
  stepIndex: number;
  allSteps: FlowStep[];
}) {
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});

  const extractVarPaths = (text: string) => {
    const matches = text?.match(/\{\{([^}]+)\}\}/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(2, -2)))];
  };

  const allVars = extractVarPaths(step.redirectUrl ?? '');

  const resolveVars = (text: string) =>
    text.replace(/\{\{([^}]+)\}\}/g, (_, path) => sampleVars[path] ?? `{{${path}}}`);

  const resolvedUrl = resolveVars(step.redirectUrl ?? '');

  return (
    <div className="space-y-5">
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <ExternalLink size={13} className="text-orange-600" />
          <p className="text-xs font-semibold text-orange-800">Redirect Step — URL Preview</p>
        </div>
        <p className="text-[10px] text-orange-700 leading-relaxed">
          This step redirects the user's browser to an external URL. Fill in sample values below to preview the resolved URL. No actual redirect is performed here.
        </p>
      </div>

      {allVars.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Sample Variable Values</p>
          <div className="space-y-2">
            {allVars.map((path) => (
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

      {/* Resolved URL */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">Resolved Redirect URL</p>
        <div className="bg-gray-950 rounded-xl p-3 font-mono text-[10px] text-green-300 break-all leading-relaxed">
          {resolvedUrl || <span className="text-gray-500">Configure the redirect URL above</span>}
        </div>
      </div>

      {/* Expected callback params */}
      {(step.callbackParams ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Expected Callback Parameters</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {step.callbackParams!.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0">
                <code className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{p.name}</code>
                <span className="text-[10px] text-gray-500">{p.description}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Access these in Output Mappings as <code className="bg-gray-100 px-1 rounded">callback.&lt;paramName&gt;</code>
          </p>
        </div>
      )}
    </div>
  );
}
