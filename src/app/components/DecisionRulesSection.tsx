import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { BlockData, DecisionBlockConfig, DecisionCondition, DecisionRule, DecisionVerdict } from '../types/journey';

const VERDICT_STYLES: Record<DecisionVerdict, string> = {
  PASS:          'bg-green-100 text-green-700 border border-green-300',
  REJECT:        'bg-red-100 text-red-700 border border-red-300',
  FLAG:          'bg-orange-100 text-orange-700 border border-orange-300',
  MANUAL_REVIEW: 'bg-gray-100 text-gray-600 border border-gray-300',
};

const VERDICT_ACTIVE: Record<DecisionVerdict, string> = {
  PASS:          'bg-green-500 text-white border border-green-600',
  REJECT:        'bg-red-500 text-white border border-red-600',
  FLAG:          'bg-orange-500 text-white border border-orange-600',
  MANUAL_REVIEW: 'bg-gray-500 text-white border border-gray-600',
};

const ALL_VERDICTS: DecisionVerdict[] = ['PASS', 'REJECT', 'FLAG', 'MANUAL_REVIEW'];

const OPERATORS = [
  { value: '=',            label: 'equals' },
  { value: '!=',           label: 'not equals' },
  { value: '>',            label: 'greater than' },
  { value: '<',            label: 'less than' },
  { value: '>=',           label: 'greater or equal' },
  { value: '<=',           label: 'less or equal' },
  { value: 'between',      label: 'between' },
  { value: 'contains',     label: 'contains' },
  { value: 'is empty',     label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' },
];

function getAvailableFields(allBlocks: BlockData[], currentBlockId: string): string[] {
  const fields = new Set<string>();
  // Collect all custom fields captured by data hooks in blocks that appear before this one
  // (all blocks, since we don't know position strictly — include all hook captures)
  for (const block of allBlocks) {
    if (block.id === currentBlockId) continue;
    for (const slot of block.dataHooks ?? []) {
      for (const hook of slot.apis ?? []) {
        for (const cap of hook.outputCaptures) {
          if (cap.storeType === 'custom' && cap.storeName) {
            fields.add(cap.storeName);
          }
        }
      }
    }
  }
  return Array.from(fields);
}

interface DecisionRulesSectionProps {
  config: DecisionBlockConfig;
  allBlocks: BlockData[];
  currentBlockId: string;
  onChange: (config: DecisionBlockConfig) => void;
}

export function DecisionRulesSection({ config, allBlocks, currentBlockId, onChange }: DecisionRulesSectionProps) {
  const capturedFields = getAvailableFields(allBlocks, currentBlockId);

  const allFieldOptions = [
    ...capturedFields.map((f) => ({ value: f, label: f, group: 'Custom (from hooks)' })),
    { value: 'native.pan_number',  label: 'PAN Number',    group: 'Native' },
    { value: 'native.dob',         label: 'Date of Birth', group: 'Native' },
    { value: 'native.mobile',      label: 'Mobile',        group: 'Native' },
    { value: 'native.email',       label: 'Email',         group: 'Native' },
    { value: 'native.pincode',     label: 'Pincode',       group: 'Native' },
    { value: 'native.first_name',  label: 'First Name',    group: 'Native' },
    { value: 'native.last_name',   label: 'Last Name',     group: 'Native' },
    { value: 'native.gender',      label: 'Gender',        group: 'Native' },
  ];

  function updateRule(ruleId: string, updates: Partial<DecisionRule>) {
    onChange({
      ...config,
      rules: config.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    });
  }

  function addRule() {
    const newRule: DecisionRule = {
      id: `rule-${Date.now()}`,
      conditions: [{ id: `cond-${Date.now()}`, field: allFieldOptions[0]?.value ?? '', operator: '=', value: '' }],
      conditionOperator: 'AND',
      verdict: 'REJECT',
    };
    onChange({ ...config, rules: [...config.rules, newRule] });
  }

  function removeRule(ruleId: string) {
    onChange({ ...config, rules: config.rules.filter((r) => r.id !== ruleId) });
  }

  function addCondition(ruleId: string) {
    const newCond: DecisionCondition = {
      id: `cond-${Date.now()}`,
      field: allFieldOptions[0]?.value ?? '',
      operator: '=',
      value: '',
    };
    updateRule(ruleId, {
      conditions: [...(config.rules.find((r) => r.id === ruleId)?.conditions ?? []), newCond],
    });
  }

  function updateCondition(ruleId: string, condId: string, updates: Partial<DecisionCondition>) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, {
      conditions: rule.conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c)),
    });
  }

  function removeCondition(ruleId: string, condId: string) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: rule.conditions.filter((c) => c.id !== condId) });
  }

  return (
    <div className="space-y-4">
      {/* Available fields chips */}
      {capturedFields.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1.5">Fields available from Data Hooks:</div>
          <div className="flex flex-wrap gap-1.5">
            {capturedFields.map((f) => (
              <span key={f} className="bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 text-xs font-mono text-purple-700">{f}</span>
            ))}
          </div>
        </div>
      )}

      {capturedFields.length === 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          No custom fields captured yet. Add Data Hooks to blocks earlier in the journey to capture fields you can use here.
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500">
        Rules are evaluated top to bottom. First matching rule wins. Drag ⠿ to reorder.
      </p>

      {/* Rules */}
      {config.rules.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">No rules yet. Add a rule below.</p>
      )}

      {config.rules.map((rule, ruleIdx) => (
        <div key={rule.id} className="border rounded-lg overflow-hidden">
          {/* Rule header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
            <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
            <span className="text-xs font-semibold text-gray-600 flex-1">Rule {ruleIdx + 1}</span>
            <Badge variant="secondary" className={`text-xs ${VERDICT_ACTIVE[rule.verdict]}`}>
              {rule.verdict.replace('_', ' ')}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-red-500"
              onClick={() => removeRule(rule.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Conditions */}
          <div className="p-3 space-y-2">
            <Label className="text-xs text-gray-500">IF:</Label>

            {rule.conditions.map((cond, condIdx) => (
              <div key={cond.id} className="space-y-1.5">
                {condIdx > 0 && (
                  <div className="flex gap-1 my-1">
                    {(['AND', 'OR'] as const).map((op) => (
                      <button
                        key={op}
                        className={`text-xs px-3 py-0.5 rounded border font-semibold transition-colors ${
                          rule.conditionOperator === op
                            ? op === 'AND' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'
                            : 'bg-white text-gray-400 border-gray-200'
                        }`}
                        onClick={() => updateRule(rule.id, { conditionOperator: op })}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Field */}
                  <Select
                    value={cond.field}
                    onValueChange={(v) => updateCondition(rule.id, cond.id, { field: v })}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[110px] max-w-[160px] font-mono">
                      <SelectValue placeholder="Select field…" />
                    </SelectTrigger>
                    <SelectContent>
                      {capturedFields.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs text-gray-400 font-semibold">From Data Hooks</div>
                          {capturedFields.map((f) => (
                            <SelectItem key={f} value={f} className="font-mono text-xs">{f}</SelectItem>
                          ))}
                          <div className="px-2 py-1 text-xs text-gray-400 font-semibold border-t mt-1">Native Fields</div>
                        </>
                      )}
                      {allFieldOptions
                        .filter((f) => f.group === 'Native')
                        .map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Operator */}
                  <Select
                    value={cond.operator}
                    onValueChange={(v) => updateCondition(rule.id, cond.id, { operator: v as any })}
                  >
                    <SelectTrigger className="h-8 text-xs w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value(s) */}
                  {cond.operator !== 'is empty' && cond.operator !== 'is not empty' && (
                    cond.operator === 'between' ? (
                      <>
                        <Input
                          className="h-8 text-xs w-16"
                          placeholder="from"
                          value={cond.value}
                          onChange={(e) => updateCondition(rule.id, cond.id, { value: e.target.value })}
                        />
                        <span className="text-xs text-gray-400">–</span>
                        <Input
                          className="h-8 text-xs w-16"
                          placeholder="to"
                          value={cond.valueTo ?? ''}
                          onChange={(e) => updateCondition(rule.id, cond.id, { valueTo: e.target.value })}
                        />
                      </>
                    ) : (
                      <Input
                        className="h-8 text-xs flex-1 min-w-[60px]"
                        placeholder="value"
                        value={cond.value}
                        onChange={(e) => updateCondition(rule.id, cond.id, { value: e.target.value })}
                      />
                    )
                  )}

                  {rule.conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500 shrink-0"
                      onClick={() => removeCondition(rule.id, cond.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 mt-1"
              onClick={() => addCondition(rule.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add condition
            </Button>

            {/* Verdict selector */}
            <div className="pt-2 border-t mt-2">
              <Label className="text-xs text-gray-500 mb-1.5 block">THEN verdict:</Label>
              <div className="flex gap-1.5 flex-wrap">
                {ALL_VERDICTS.map((v) => (
                  <button
                    key={v}
                    className={`text-xs px-3 py-1 rounded font-semibold border transition-colors ${
                      rule.verdict === v ? VERDICT_ACTIVE[v] : VERDICT_STYLES[v]
                    }`}
                    onClick={() => updateRule(rule.id, { verdict: v })}
                  >
                    {v.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full text-xs" onClick={addRule}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Rule
      </Button>

      {/* Default verdict */}
      <div className="border rounded-lg p-3 bg-gray-50">
        <Label className="text-xs font-semibold text-gray-600 block mb-2">
          Default verdict (if no rule matches):
        </Label>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_VERDICTS.map((v) => (
            <button
              key={v}
              className={`text-xs px-3 py-1 rounded font-semibold border transition-colors ${
                config.defaultVerdict === v ? VERDICT_ACTIVE[v] : VERDICT_STYLES[v]
              }`}
              onClick={() => onChange({ ...config, defaultVerdict: v })}
            >
              {v.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
