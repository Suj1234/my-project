import { Clock, Webhook } from 'lucide-react';
import { FlowStep } from '../../../types/apiFlow';
import { VariableInput } from '../components/VariableInput';

interface WaitStepTabProps {
  step: FlowStep;
  onChange: (updated: FlowStep) => void;
}

export function WaitStepTab({ step, onChange }: WaitStepTabProps) {
  const upd = (field: keyof FlowStep, val: unknown) => onChange({ ...step, [field]: val });
  const waitType = step.waitType ?? 'delay';

  return (
    <div className="space-y-6">
      {/* Wait type */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">Wait Type</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => upd('waitType', 'delay')}
            className={`p-4 rounded-xl border text-left transition-all ${
              waitType === 'delay'
                ? 'border-teal-500 bg-teal-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`flex items-center gap-2 mb-1 ${waitType === 'delay' ? 'text-teal-700' : 'text-gray-600'}`}>
              <Clock size={14} />
              <span className="text-xs font-semibold">Fixed Delay</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Pause the flow for a fixed number of seconds before continuing.
            </p>
          </button>

          <button
            onClick={() => upd('waitType', 'callback')}
            className={`p-4 rounded-xl border text-left transition-all ${
              waitType === 'callback'
                ? 'border-teal-500 bg-teal-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`flex items-center gap-2 mb-1 ${waitType === 'callback' ? 'text-teal-700' : 'text-gray-600'}`}>
              <Webhook size={14} />
              <span className="text-xs font-semibold">Callback / Webhook</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Pause the flow until an external service sends a callback to resume it.
            </p>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Delay config */}
      {waitType === 'delay' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Wait Duration (seconds)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={300}
              value={step.waitSeconds ?? 5}
              onChange={(e) => upd('waitSeconds', Number(e.target.value))}
              className="flex-1 accent-teal-600"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={3600}
                value={step.waitSeconds ?? 5}
                onChange={(e) => upd('waitSeconds', Number(e.target.value))}
                className="w-20 text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <span className="text-xs text-gray-500">s</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            The flow will pause for exactly {step.waitSeconds ?? 5} second{(step.waitSeconds ?? 5) !== 1 ? 's' : ''} before proceeding to the next step.
          </p>
        </div>
      )}

      {/* Callback config */}
      {waitType === 'callback' && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3 leading-relaxed mb-4">
              The flow will pause and resume when an external webhook is received. The platform will provide a callback URL — pass it to your external service in a prior API Call step.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Completion Signal Path (optional)
            </label>
            <VariableInput
              value={step.callbackSignalPath ?? ''}
              onChange={(v) => upd('callbackSignalPath', v)}
              placeholder="$.status  or  $.event  (leave blank to resume on any callback)"
            />
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
              JSONPath to a field in the callback payload that signals completion. Leave blank to resume on any callback received.
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100" />

      {/* On Error */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">On Error</p>
        <div className="flex gap-2">
          {(['stop', 'continue', 'skip'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onChange({ ...step, onError: v })}
              className={`flex-1 py-2 text-[10px] font-medium rounded-lg border transition-colors ${
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
    </div>
  );
}

// ─── Wait Step Test Tab ───────────────────────────────────────────────────────

export function WaitStepTestTab({ step }: { step: FlowStep }) {
  const waitType = step.waitType ?? 'delay';
  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-slate-500" />
          <p className="text-xs font-semibold text-slate-700">Wait Step Preview</p>
        </div>
        {waitType === 'delay' ? (
          <p className="text-sm text-slate-600">
            Flow will pause for{' '}
            <span className="font-bold text-slate-800">{step.waitSeconds ?? 5} second{(step.waitSeconds ?? 5) !== 1 ? 's' : ''}</span>
            {' '}before continuing to the next step.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Flow will pause and wait for an external callback/webhook.
            </p>
            {step.callbackSignalPath && (
              <p className="text-[10px] text-slate-500">
                Completion signal path:{' '}
                <code className="font-mono bg-slate-100 px-1 rounded">{step.callbackSignalPath}</code>
              </p>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400">
        Wait steps cannot be previewed or tested in isolation. The behavior above is what will happen at runtime.
      </p>
    </div>
  );
}
