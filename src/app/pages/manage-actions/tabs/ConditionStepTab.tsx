import { useState } from 'react';
import { GitBranch, Info } from 'lucide-react';
import { FlowStep } from '../../../types/apiFlow';
import { VariableInput } from '../components/VariableInput';

interface ConditionStepTabProps {
  step: FlowStep;
  onChange: (updated: FlowStep) => void;
}

const OPERATORS = [
  { value: '==',          label: '== (equals)' },
  { value: '!=',          label: '!= (not equals)' },
  { value: '>',           label: '> (greater than)' },
  { value: '<',           label: '< (less than)' },
  { value: '>=',          label: '>= (greater or equal)' },
  { value: '<=',          label: '<= (less or equal)' },
  { value: 'contains',    label: 'contains' },
  { value: 'not_contains',label: 'does not contain' },
  { value: 'is_empty',    label: 'is empty' },
  { value: 'not_empty',   label: 'is not empty' },
] as const;

const NO_RIGHT_OPERAND = ['is_empty', 'not_empty'];

export function ConditionStepTab({ step, onChange }: ConditionStepTabProps) {
  const upd = (field: keyof FlowStep, val: unknown) => onChange({ ...step, [field]: val });
  const operator = step.conditionOperator ?? '==';
  const needsRight = !NO_RIGHT_OPERAND.includes(operator as any);

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
        <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-blue-700 leading-relaxed">
          A Condition step evaluates an expression. If the condition is <strong>true</strong>, the flow continues to the next step.
          If <strong>false</strong>, the action you configure below is taken. No branching — this is a single gate.
        </p>
      </div>

      {/* Condition builder */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-3">Condition Expression</p>

        <div className="space-y-3">
          {/* Left operand */}
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Left Operand</label>
            <VariableInput
              value={step.conditionLeftOperand ?? ''}
              onChange={(v) => upd('conditionLeftOperand', v)}
              placeholder="{{flow.steps.1.output.consentStatus}}"
            />
            <p className="text-[9px] text-gray-400 mt-0.5">
              Typically a variable from a previous step's output
            </p>
          </div>

          {/* Operator */}
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Operator</label>
            <div className="grid grid-cols-5 gap-1.5">
              {OPERATORS.map((op) => (
                <button
                  key={op.value}
                  onClick={() => upd('conditionOperator', op.value)}
                  className={`p-2 rounded-lg border text-[9px] font-medium text-center transition-all ${
                    operator === op.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right operand */}
          {needsRight && (
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">Right Operand</label>
              <VariableInput
                value={step.conditionRightOperand ?? ''}
                onChange={(v) => upd('conditionRightOperand', v)}
                placeholder="APPROVED  or  {{flow.steps.0.output.expectedStatus}}"
              />
              <p className="text-[9px] text-gray-400 mt-0.5">
                A static value or a variable
              </p>
            </div>
          )}

          {/* Preview */}
          {step.conditionLeftOperand && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-500 mb-1">Expression Preview</p>
              <p className="text-xs font-mono text-gray-700">
                <span className="text-blue-600">{step.conditionLeftOperand}</span>
                {' '}
                <span className="text-orange-600 font-bold">{operator}</span>
                {needsRight && (
                  <>{' '}<span className="text-teal-600">{step.conditionRightOperand || '(right operand)'}</span></>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* On False action */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1">If Condition is False</p>
        <p className="text-[10px] text-gray-400 mb-3">What should happen if the condition evaluates to false?</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'stop',     label: 'Stop Flow',     description: 'Halt the entire flow immediately' },
            { value: 'fail',     label: 'Fail Flow',     description: 'Mark the flow as failed and stop' },
            { value: 'skip',     label: 'Skip to End',   description: 'Skip remaining steps, complete as success' },
            { value: 'continue', label: 'Continue',      description: 'Log condition failure and continue anyway' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => upd('conditionOnFalse', opt.value)}
              className={`text-left p-3 rounded-xl border transition-all ${
                (step.conditionOnFalse ?? 'stop') === opt.value
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`text-xs font-semibold ${(step.conditionOnFalse ?? 'stop') === opt.value ? 'text-teal-800' : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Condition Step Test Tab ──────────────────────────────────────────────────

export function ConditionStepTestTab({ step }: { step: FlowStep }) {
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});

  const extractPaths = (text?: string) => {
    const matches = text?.match(/\{\{([^}]+)\}\}/g) ?? [];
    return [...new Set(matches.map((m) => m.slice(2, -2)))];
  };

  const allVarPaths = [...new Set([
    ...extractPaths(step.conditionLeftOperand),
    ...extractPaths(step.conditionRightOperand),
  ])];

  const resolveVars = (text?: string) =>
    (text ?? '').replace(/\{\{([^}]+)\}\}/g, (_, path) => sampleVars[path] ?? `{{${path}}}`);

  const evaluateCondition = (): { result: boolean | null; left: string; right: string } => {
    const left = resolveVars(step.conditionLeftOperand);
    const right = resolveVars(step.conditionRightOperand);
    const op = step.conditionOperator ?? '==';
    try {
      let result: boolean;
      const leftNum = parseFloat(left);
      const rightNum = parseFloat(right);
      const canCompareNum = !isNaN(leftNum) && !isNaN(rightNum);
      switch (op) {
        case '==': result = left === right; break;
        case '!=': result = left !== right; break;
        case '>':  result = canCompareNum ? leftNum > rightNum : left > right; break;
        case '<':  result = canCompareNum ? leftNum < rightNum : left < right; break;
        case '>=': result = canCompareNum ? leftNum >= rightNum : left >= right; break;
        case '<=': result = canCompareNum ? leftNum <= rightNum : left <= right; break;
        case 'contains': result = left.includes(right); break;
        case 'not_contains': result = !left.includes(right); break;
        case 'is_empty': result = left.trim() === ''; break;
        case 'not_empty': result = left.trim() !== ''; break;
        default: result = false;
      }
      return { result, left, right };
    } catch {
      return { result: null, left, right };
    }
  };

  const hasOperands = step.conditionLeftOperand;
  const { result, left, right } = hasOperands ? evaluateCondition() : { result: null, left: '', right: '' };

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

      {hasOperands && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Condition Evaluation</p>
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <p className="text-xs font-mono text-gray-700">
              <span className="text-blue-600 font-semibold">"{left}"</span>
              {' '}
              <span className="text-orange-600 font-bold">{step.conditionOperator ?? '=='}</span>
              {' '}
              {!['is_empty', 'not_empty'].includes(step.conditionOperator ?? '') && (
                <span className="text-teal-600 font-semibold">"{right}"</span>
              )}
            </p>
            {result !== null && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                result ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
              }`}>
                <span className={`text-sm font-bold ${result ? 'text-emerald-600' : 'text-red-500'}`}>
                  {result ? '✓ TRUE' : '✗ FALSE'}
                </span>
                <span className={`text-[10px] ${result ? 'text-emerald-600' : 'text-red-500'}`}>
                  {result
                    ? '→ Flow continues to next step'
                    : `→ "${step.conditionOnFalse ?? 'stop'}" action will be taken`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasOperands && (
        <p className="text-xs text-gray-400">Configure the condition expression above to see evaluation preview.</p>
      )}
    </div>
  );
}
