import { useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  BlockData,
  DataHookApiBinding,
  DecisionBlockConfig,
  DecisionCondition,
  DecisionRule,
  DecisionVerdict,
  HookEventSlot,
} from '../types/journey';
import { AddHookDialog } from './AddHookDialog';

type RuleOperator = DecisionCondition['operator'];

const OPERATORS: RuleOperator[] = ['=', '!=', '>', '<', '>=', '<=', 'between', 'contains', 'is empty', 'is not empty'];
const VERDICTS: DecisionVerdict[] = ['PASS', 'REJECT', 'FLAG', 'MANUAL_REVIEW'];

function emptyDecisionConfig(): DecisionBlockConfig {
  return { rules: [], defaultVerdict: 'PASS' };
}

interface EventDecisionEditorProps {
  slot: HookEventSlot;
  onChange: (next: DecisionBlockConfig) => void;
}

function EventDecisionEditor({ slot, onChange }: EventDecisionEditorProps) {
  const config = slot.decisionConfig ?? emptyDecisionConfig();
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    for (const api of slot.apis) {
      for (const cap of api.outputCaptures) {
        if (cap.storeType !== 'none' && cap.storeName.trim()) fields.add(cap.storeName.trim());
      }
    }
    return Array.from(fields);
  }, [slot.apis]);

  function updateRule(ruleId: string, updates: Partial<DecisionRule>) {
    onChange({ ...config, rules: config.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)) });
  }

  function addRule() {
    const defaultField = availableFields[0] ?? 'native.pan_number';
    const rule: DecisionRule = {
      id: `rule-${Date.now()}`,
      verdict: 'PASS',
      conditionOperator: 'AND',
      conditions: [{ id: `cond-${Date.now()}`, field: defaultField, operator: '=', value: '' }],
    };
    onChange({ ...config, rules: [...config.rules, rule] });
  }

  function removeRule(id: string) {
    onChange({ ...config, rules: config.rules.filter((r) => r.id !== id) });
  }

  function updateCondition(ruleId: string, condId: string, updates: Partial<DecisionCondition>) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: rule.conditions.map((c) => (c.id === condId ? { ...c, ...updates } : c)) });
  }

  function addCondition(ruleId: string) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const defaultField = availableFields[0] ?? 'native.pan_number';
    const condition: DecisionCondition = {
      id: `cond-${Date.now()}`,
      field: defaultField,
      operator: '=',
      value: '',
    };
    updateRule(ruleId, { conditions: [...rule.conditions, condition] });
  }

  function removeCondition(ruleId: string, condId: string) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    updateRule(ruleId, { conditions: rule.conditions.filter((c) => c.id !== condId) });
  }

  return (
    <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-700">Event Decision (uses all API outputs in this event)</div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addRule}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add rule
        </Button>
      </div>

      {availableFields.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {availableFields.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px] font-mono">{f}</Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-700">Capture output fields first, then write decision rules.</p>
      )}

      {config.rules.map((rule, ruleIdx) => (
        <div key={rule.id} className="border rounded-md bg-white p-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Rule {ruleIdx + 1}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => removeRule(rule.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {rule.conditions.map((cond, idx) => (
            <div key={cond.id} className="space-y-1">
              {idx > 0 && (
                <Select value={rule.conditionOperator} onValueChange={(v) => updateRule(rule.id, { conditionOperator: v as 'AND' | 'OR' })}>
                  <SelectTrigger className="h-7 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND" className="text-xs">AND</SelectItem>
                    <SelectItem value="OR" className="text-xs">OR</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-4">
                  <Select value={cond.field} onValueChange={(v) => updateCondition(rule.id, cond.id, { field: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableFields.map((f) => (
                        <SelectItem key={f} value={f} className="text-xs font-mono">{f}</SelectItem>
                      ))}
                      <SelectItem value="native.pan_number" className="text-xs">native.pan_number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Select value={cond.operator} onValueChange={(v) => updateCondition(rule.id, cond.id, { operator: v as RuleOperator })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op} value={op} className="text-xs">{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  {cond.operator !== 'is empty' && cond.operator !== 'is not empty' ? (
                    <Input className="h-7 text-xs" value={cond.value} onChange={(e) => updateCondition(rule.id, cond.id, { value: e.target.value })} placeholder="value" />
                  ) : (
                    <div className="text-[10px] text-gray-400">No value needed</div>
                  )}
                </div>
                <div className="col-span-1">
                  {rule.conditions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCondition(rule.id, cond.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addCondition(rule.id)}>+ Condition</Button>
            <span className="text-xs text-gray-500">Then</span>
            <Select value={rule.verdict} onValueChange={(v) => updateRule(rule.id, { verdict: v as DecisionVerdict })}>
              <SelectTrigger className="h-7 text-xs w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERDICTS.map((v) => (
                  <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-2 border-t">
        <Label className="text-xs text-gray-600">Default verdict:</Label>
        <Select value={config.defaultVerdict} onValueChange={(v) => onChange({ ...config, defaultVerdict: v as DecisionVerdict })}>
          <SelectTrigger className="h-7 text-xs w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VERDICTS.map((v) => (
              <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface DataHooksSectionProps {
  block: BlockData;
  slots: HookEventSlot[];
  onChange: (slots: HookEventSlot[]) => void;
}

export function DataHooksSection({ block, slots, onChange }: DataHooksSectionProps) {
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  const [expandedApis, setExpandedApis] = useState<Record<string, boolean>>({});

  function updateSlots(next: HookEventSlot[]) {
    onChange(next);
  }

  function updateSlot(slotId: string, updater: (slot: HookEventSlot) => HookEventSlot) {
    updateSlots(slots.map((s) => (s.id === slotId ? updater(s) : s)));
  }

  function addApiToSlot(slotId: string, api: DataHookApiBinding) {
    updateSlot(slotId, (slot) => ({ ...slot, apis: [...slot.apis, api] }));
    setActiveSlotId(null);
    setExpandedSlots((prev) => ({ ...prev, [slotId]: true }));
    setExpandedApis((prev) => ({ ...prev, [api.id]: true }));
  }

  function removeApiFromSlot(slotId: string, apiId: string) {
    updateSlot(slotId, (slot) => ({ ...slot, apis: slot.apis.filter((a) => a.id !== apiId) }));
  }

  function updateSlotDecision(slotId: string, decisionConfig: DecisionBlockConfig) {
    updateSlot(slotId, (slot) => ({ ...slot, decisionConfig }));
  }

  const slotTitle = block.type === 'form' ? 'Form Events' : 'Block Events';

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500">{slotTitle}: fixed event cards for this block. Add any number of APIs inside each event.</div>

      {slots.map((slot) => {
        const expandedSlot = expandedSlots[slot.id] ?? true;
        return (
          <div key={slot.id} className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer" onClick={() => setExpandedSlots((prev) => ({ ...prev, [slot.id]: !expandedSlot }))}>
              {expandedSlot ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{slot.eventLabel}</div>
                <div className="text-xs text-gray-500">{slot.apis.length} API(s) configured</div>
              </div>
              <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">Event</Badge>
            </div>

            {expandedSlot && (
              <div className="p-3 space-y-3">
                {slot.apis.map((api, idx) => {
                  const expandedApi = expandedApis[api.id] ?? idx === 0;
                  const manualInputs = api.inputMappings.filter((m) => !m.isAutoMapped).length;
                  return (
                    <div key={api.id} className="border rounded-md overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white cursor-pointer" onClick={() => setExpandedApis((prev) => ({ ...prev, [api.id]: !expandedApi }))}>
                        {expandedApi ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{api.apiName}</span>
                            {api.latencyP95Ms ? (
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">p95 {api.latencyP95Ms}ms</Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-gray-500">{api.outputCaptures.length} captures · {manualInputs} manual inputs</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeApiFromSlot(slot.id, api.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>

                      {expandedApi && (
                        <div className="px-3 pb-3 space-y-2 bg-gray-50/50">
                          <div>
                            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Inputs</div>
                            <div className="space-y-1">
                              {api.inputMappings.map((m) => (
                                <div key={m.requestPath} className="text-xs flex items-center gap-1.5">
                                  <span className="font-mono text-gray-500 truncate flex-1">{m.requestPath}</span>
                                  <span className="text-gray-400">?</span>
                                  <span className="font-medium text-blue-700">{m.sourceType}.{m.sourceValue || '-'}</span>
                                  {(m.transforms?.length ?? 0) > 0 && <Badge variant="secondary" className="text-[10px]">{m.transforms?.length} tfm</Badge>}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Outputs</div>
                            {api.outputCaptures.length === 0 ? (
                              <div className="text-xs text-gray-400">No captures configured</div>
                            ) : (
                              <div className="space-y-1">
                                {api.outputCaptures.map((c) => (
                                  <div key={c.id} className="text-xs flex items-center gap-1.5">
                                    <span className="font-mono text-gray-500 truncate flex-1">{c.path}</span>
                                    <span className="text-gray-400">?</span>
                                    <span className="font-mono text-purple-700">{c.storeType === 'none' ? 'ref only' : `${c.storeType}.${c.storeName}`}</span>
                                    {(c.transforms?.length ?? 0) > 0 && <Badge variant="secondary" className="text-[10px]">{c.transforms?.length} tfm</Badge>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button variant="outline" size="sm" className="text-xs" onClick={() => setActiveSlotId(slot.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add API in {slot.eventLabel}
                </Button>

                <EventDecisionEditor
                  slot={slot}
                  onChange={(decision) => updateSlotDecision(slot.id, decision)}
                />
              </div>
            )}
          </div>
        );
      })}

      <AddHookDialog
        open={Boolean(activeSlotId)}
        onClose={() => setActiveSlotId(null)}
        onSave={(api) => {
          if (!activeSlotId) return;
          addApiToSlot(activeSlotId, api);
        }}
      />
    </div>
  );
}
