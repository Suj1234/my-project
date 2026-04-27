import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  BlockData, DecisionBlockConfig, DecisionCondition,
  DecisionConditionOperator, DecisionRule, DecisionVerdict,
} from '../types/journey';

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

const OPERATORS: { value: DecisionConditionOperator; label: string }[] = [
  { value: '=',                  label: 'equals' },
  { value: '!=',                 label: 'not equals' },
  { value: '>',                  label: 'greater than' },
  { value: '<',                  label: 'less than' },
  { value: '>=',                 label: 'greater or equal' },
  { value: '<=',                 label: 'less or equal' },
  { value: 'between',            label: 'between' },
  { value: 'in',                 label: 'in (comma list)' },
  { value: 'not in',             label: 'not in (comma list)' },
  { value: 'contains',           label: 'contains' },
  { value: 'not contains',       label: 'not contains' },
  { value: 'is empty',           label: 'is empty' },
  { value: 'is not empty',       label: 'is not empty' },
  { value: 'is before today',    label: 'is before today' },
  { value: 'is after today',     label: 'is after today' },
  { value: 'is in last N days',  label: 'is in last N days' },
  { value: 'matches regex',      label: 'matches regex' },
];

const NO_VALUE_OPS: DecisionConditionOperator[] = ['is empty', 'is not empty', 'is before today', 'is after today'];
const TWO_VALUE_OPS: DecisionConditionOperator[] = ['between'];
const NDAYS_OPS: DecisionConditionOperator[] = ['is in last N days'];

const SYSTEM_FIELDS_DECISION = [
  { value: 'system.attempt_count', label: 'Attempt Count', group: 'system' },
  { value: 'system.device_type',   label: 'Device Type',   group: 'system' },
  { value: 'system.platform',      label: 'Platform',      group: 'system' },
  { value: 'system.timestamp',     label: 'Timestamp',     group: 'system' },
];

function getAvailableFields(allBlocks: BlockData[], currentBlockId: string): { value: string; label: string; group: string }[] {
  const fields: { value: string; label: string; group: string }[] = [];
  const currentIndex = allBlocks.findIndex((b) => b.id === currentBlockId);
  const upstreamBlocks = currentIndex >= 0 ? allBlocks.slice(0, currentIndex) : [];

  for (const block of upstreamBlocks) {
    // User inputs declared on pages
    for (const page of block.pages ?? []) {
      for (const inp of page.userInputs ?? []) {
        if (inp.fieldSource && inp.key) {
          fields.push({ value: `${inp.fieldSource}.${inp.key}`, label: inp.name || inp.key, group: inp.fieldSource });
        }
      }
    }
    // Output captures from data hooks
    for (const slot of block.dataHooks ?? []) {
      for (const hook of slot.apis ?? []) {
        for (const cap of hook.outputCaptures) {
          if (cap.storeType !== 'none' && cap.storeName) {
            fields.push({ value: cap.storeName, label: cap.label || cap.storeName, group: cap.storeType });
          }
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped = fields.filter((f) => {
    if (seen.has(f.value)) return false;
    seen.add(f.value);
    return true;
  });

  return [...deduped, ...SYSTEM_FIELDS_DECISION];
}

interface DecisionRulesSectionProps {
  config: DecisionBlockConfig;
  allBlocks: BlockData[];
  currentBlockId: string;
  onChange: (config: DecisionBlockConfig) => void;
}

export function DecisionRulesSection({ config, allBlocks, currentBlockId, onChange }: DecisionRulesSectionProps) {
  const allFieldOptions = getAvailableFields(allBlocks, currentBlockId);
  const capturedFields = allFieldOptions.filter((f) => f.group !== 'system');

  // Parse verdictStorageKey into parts for the UI
  const verdictStorageKey = config.verdictStorageKey ?? '';
  const verdictStoreType = verdictStorageKey.startsWith('native.') ? 'native' : 'custom';
  const verdictFieldName = verdictStorageKey.includes('.') ? verdictStorageKey.split('.').slice(1).join('.') : verdictStorageKey;

  function handleVerdictStorageChange(storeType: string, fieldName: string) {
    const key = fieldName.trim() ? `${storeType}.${fieldName.trim()}` : undefined;
    onChange({ ...config, verdictStorageKey: key, verdictField: key });
  }

  function updateRule(ruleId: string, updates: Partial<DecisionRule>) {
    onChange({ ...config, rules: config.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)) });
  }

  function addRule() {
    const firstField = allFieldOptions.find((f) => f.group !== 'system') ?? allFieldOptions[0];
    const newRule: DecisionRule = {
      id: `rule-${Date.now()}`,
      conditions: [{ id: `cond-${Date.now()}`, field: firstField?.value ?? '', operator: '=', value: '' }],
      conditionOperator: 'AND',
      verdict: 'REJECT',
    };
    onChange({ ...config, rules: [...config.rules, newRule] });
  }

  function removeRule(ruleId: string) {
    onChange({ ...config, rules: config.rules.filter((r) => r.id !== ruleId) });
  }

  function addCondition(ruleId: string) {
    const firstField = allFieldOptions.find((f) => f.group !== 'system') ?? allFieldOptions[0];
    const newCond: DecisionCondition = { id: `cond-${Date.now()}`, field: firstField?.value ?? '', operator: '=', value: '' };
    updateRule(ruleId, { conditions: [...(config.rules.find((r) => r.id === ruleId)?.conditions ?? []), newCond] });
  }

  function updateCondition(ruleId: string, condId: string, updates: Partial<DecisionCondition>) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: rule.conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c)) });
  }

  function removeCondition(ruleId: string, condId: string) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: rule.conditions.filter((c) => c.id !== condId) });
  }

  return (
    <div className="space-y-4">
      {/* Verdict Storage Declaration */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
        <Label className="text-xs font-semibold text-purple-800">Verdict Storage</Label>
        <p className="text-xs text-purple-700">Store the verdict into a field so downstream Router blocks can route on it.</p>
        <div className="flex items-center gap-1.5">
          <Select value={verdictStoreType} onValueChange={(v) => handleVerdictStorageChange(v, verdictFieldName)}>
            <SelectTrigger className="h-8 text-xs w-24 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom" className="text-xs font-mono">custom</SelectItem>
              <SelectItem value="native" className="text-xs font-mono">native</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400 font-mono">.</span>
          <Input
            className="h-8 text-xs font-mono flex-1"
            placeholder="e.g. credit_decision"
            value={verdictFieldName}
            onChange={(e) => handleVerdictStorageChange(verdictStoreType, e.target.value)}
          />
        </div>
        {verdictStorageKey && (
          <p className="text-xs text-purple-600 font-mono">→ {verdictStorageKey}</p>
        )}
      </div>

      {/* Available fields chips */}
      {capturedFields.filter((f) => f.group === 'native').length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1.5">Native fields from upstream:</div>
          <div className="flex flex-wrap gap-1.5">
            {capturedFields.filter((f) => f.group === 'native').map((f) => (
              <span key={f.value} className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-mono text-blue-700">{f.value}</span>
            ))}
          </div>
        </div>
      )}
      {capturedFields.filter((f) => f.group === 'custom').length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1.5">Custom fields from upstream:</div>
          <div className="flex flex-wrap gap-1.5">
            {capturedFields.filter((f) => f.group === 'custom').map((f) => (
              <span key={f.value} className="bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 text-xs font-mono text-purple-700">{f.value}</span>
            ))}
          </div>
        </div>
      )}
      {capturedFields.length === 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          No custom or native fields declared upstream. Configure user inputs or output captures with storage in upstream blocks to evaluate them here.
        </div>
      )}

      <p className="text-xs text-gray-500">Rules evaluated top-to-bottom. First match wins. Drag ⠿ to reorder.</p>

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

            {rule.conditions.map((cond, condIdx) => {
              const noVal = NO_VALUE_OPS.includes(cond.operator);
              const twoVal = TWO_VALUE_OPS.includes(cond.operator);
              const nDays = NDAYS_OPS.includes(cond.operator);

              return (
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
                    <Select value={cond.field} onValueChange={(v) => updateCondition(rule.id, cond.id, { field: v, value: '', valueTo: '' })}>
                      <SelectTrigger className="h-8 text-xs flex-1 min-w-[110px] max-w-[160px] font-mono">
                        <SelectValue placeholder="Select field…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['native', 'custom', 'system'] as const).map((grp) => {
                          const grpFields = allFieldOptions.filter((f) => f.group === grp);
                          if (grpFields.length === 0) return null;
                          return (
                            <div key={grp}>
                              <div className="px-2 py-1 text-xs text-gray-400 font-semibold border-t first:border-t-0 uppercase tracking-wide">{grp}</div>
                              {grpFields.map((f) => (
                                <SelectItem key={f.value} value={f.value} className="font-mono text-xs">{f.label}</SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Operator */}
                    <Select
                      value={cond.operator}
                      onValueChange={(v) => updateCondition(rule.id, cond.id, { operator: v as DecisionConditionOperator, value: '', valueTo: '' })}
                    >
                      <SelectTrigger className="h-8 text-xs w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value(s) */}
                    {!noVal && (
                      twoVal ? (
                        <>
                          <Input className="h-8 text-xs w-16" placeholder="from" value={cond.value}
                            onChange={(e) => updateCondition(rule.id, cond.id, { value: e.target.value })} />
                          <span className="text-xs text-gray-400">–</span>
                          <Input className="h-8 text-xs w-16" placeholder="to" value={cond.valueTo ?? ''}
                            onChange={(e) => updateCondition(rule.id, cond.id, { valueTo: e.target.value })} />
                        </>
                      ) : nDays ? (
                        <Input className="h-8 text-xs w-16" placeholder="N" type="number" value={cond.value}
                          onChange={(e) => updateCondition(rule.id, cond.id, { value: e.target.value })} />
                      ) : (
                        <Input
                          className="h-8 text-xs flex-1 min-w-[60px]"
                          placeholder={cond.operator === 'in' || cond.operator === 'not in' ? 'a, b, c' : 'value'}
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
              );
            })}

            <Button variant="outline" size="sm" className="text-xs h-7 mt-1" onClick={() => addCondition(rule.id)}>
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

      {/* Verdict routing — connect verdict outcomes to canvas blocks */}
      <div className="border rounded-lg p-3 space-y-3">
        <div>
          <Label className="text-xs font-semibold text-gray-700">Verdict Routing</Label>
          <p className="text-xs text-gray-500 mt-0.5">Route each verdict outcome to a specific downstream block. Creates dedicated canvas edges per verdict.</p>
        </div>
        {ALL_VERDICTS.map((v) => {
          const currentTarget = config.verdictRoutes?.[v] ?? '';
          return (
            <div key={v} className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold border w-28 text-center shrink-0 ${VERDICT_STYLES[v]}`}>
                {v.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-400">→</span>
              <Select
                value={currentTarget}
                onValueChange={(val) => {
                  const targetId = val === '__none__' ? undefined : val;
                  const updated = { ...(config.verdictRoutes ?? {}), [v]: targetId };
                  onChange({ ...config, verdictRoutes: updated as typeof config.verdictRoutes });
                }}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="No routing (sequential)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs text-gray-400">No routing (sequential)</SelectItem>
                  {allBlocks
                    .filter((b) => b.id !== currentBlockId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name} ({b.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
