import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ConditionGroup, Condition, ConditionOperator } from '../../types/journey';
import {
  RouterField, ACTION_PARAM,
  OPERATORS_BY_TYPE, NO_VALUE_OPERATORS, TWO_VALUE_OPERATORS, NDAYS_OPERATORS,
  getFieldType, makeEmptyConditionGroup,
} from './routerShared';

interface RouterConditionBuilderProps {
  conditionGroups: ConditionGroup[];
  routerFields: RouterField[];
  prevBlockActions: string[];
  onChange: (groups: ConditionGroup[]) => void;
  hideAction?: boolean;
}

export function RouterConditionBuilder({ conditionGroups, routerFields, prevBlockActions, onChange, hideAction }: RouterConditionBuilderProps) {
  const groups = conditionGroups.length > 0 ? conditionGroups : [makeEmptyConditionGroup(routerFields)];

  const updateGroups = (updated: ConditionGroup[]) => onChange(updated);

  const updateCondition = (groupIdx: number, condIdx: number, updates: Partial<Condition>) => {
    const g = groups.map((gr, gi) => {
      if (gi !== groupIdx) return gr;
      const conds = gr.conditions.map((c, ci) => ci === condIdx ? { ...c, ...updates } : c);
      return { ...gr, conditions: conds };
    });
    updateGroups(g);
  };

  const deleteCondition = (groupIdx: number, condIdx: number) => {
    const g = groups.map((gr, gi) => {
      if (gi !== groupIdx) return gr;
      return { ...gr, conditions: gr.conditions.filter((_, ci) => ci !== condIdx) };
    });
    updateGroups(g);
  };

  const addCondition = (groupIdx: number) => {
    const firstField = routerFields[0];
    const g = groups.map((gr, gi) => {
      if (gi !== groupIdx) return gr;
      return {
        ...gr, conditions: [...gr.conditions, {
          id: `cond-${Date.now()}`,
          parameter: firstField?.value ?? '',
          operator: '=' as ConditionOperator,
          value: '',
          fieldType: firstField?.fieldType ?? 'text',
        }],
      };
    });
    updateGroups(g);
  };

  const updateGroupOperator = (groupIdx: number, op: 'AND' | 'OR') => {
    updateGroups(groups.map((gr, gi) => gi === groupIdx ? { ...gr, operator: op } : gr));
  };

  const updateNextGroupOperator = (groupIdx: number, op: 'AND' | 'OR') => {
    updateGroups(groups.map((gr, gi) => gi === groupIdx ? { ...gr, nextGroupOperator: op } : gr));
  };

  const deleteGroup = (groupIdx: number) => {
    updateGroups(groups.filter((_, gi) => gi !== groupIdx));
  };

  const addGroup = () => {
    const withConnector = groups.map((gr, gi) =>
      gi === groups.length - 1 ? { ...gr, nextGroupOperator: gr.nextGroupOperator ?? 'AND' as const } : gr
    );
    updateGroups([...withConnector, makeEmptyConditionGroup(routerFields)]);
  };

  return (
    <div className="space-y-2">
      {groups.map((group, groupIdx) => (
        <div key={group.id}>
          {/* Group card */}
          <div className="border rounded-lg bg-white overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Group {groupIdx + 1}</span>
                <span className="text-xs text-gray-400">—</span>
                {(['AND', 'OR'] as const).map((op) => (
                  <button
                    key={op}
                    className={`text-xs px-2 py-0.5 rounded border font-semibold transition-colors ${
                      group.operator === op
                        ? op === 'AND' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-white text-gray-300 border-gray-200'
                    }`}
                    onClick={() => updateGroupOperator(groupIdx, op)}
                  >{op}</button>
                ))}
              </div>
              {groups.length > 1 && (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-300 hover:text-red-400"
                  onClick={() => deleteGroup(groupIdx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Conditions */}
            <div className="p-2 space-y-2">
              {group.conditions.map((condition, condIdx) => {
                const isAction = condition.parameter === ACTION_PARAM;
                const ft = isAction ? 'text' : getFieldType(routerFields, condition.parameter);
                const ops = OPERATORS_BY_TYPE[ft];
                const noVal = NO_VALUE_OPERATORS.includes(condition.operator);
                const twoVal = TWO_VALUE_OPERATORS.includes(condition.operator);
                const nDays = NDAYS_OPERATORS.includes(condition.operator);

                return (
                  <div key={condition.id}>
                    {condIdx > 0 && (
                      <div className="flex justify-start pl-1 pb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                          group.operator === 'AND' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>{group.operator}</span>
                      </div>
                    )}

                    {isAction && !hideAction ? (
                      /* User tapped row — only shown when hideAction is false */
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-orange-50 rounded border border-orange-200 text-xs">
                        <span className="text-xs font-medium text-orange-600 whitespace-nowrap shrink-0">⚡ User tapped</span>
                        <Select value={condition.value}
                          onValueChange={(v) => updateCondition(groupIdx, condIdx, { value: v })}>
                          <SelectTrigger className="h-7 text-xs flex-1 min-w-[120px]">
                            <SelectValue placeholder="Select action..." />
                          </SelectTrigger>
                          <SelectContent>
                            {prevBlockActions.length === 0
                              ? <div className="px-2 py-2 text-xs text-gray-400">No previous block with actions found</div>
                              : prevBlockActions.map((a) => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                        {group.conditions.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-red-500 shrink-0"
                            onClick={() => deleteCondition(groupIdx, condIdx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ) : isAction && hideAction ? null : (
                      /* Regular field condition row */
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-50 rounded border text-xs">
                        {/* Field picker */}
                        <Select value={condition.parameter}
                          onValueChange={(v) => {
                            if (v === ACTION_PARAM) {
                              updateCondition(groupIdx, condIdx, { parameter: ACTION_PARAM, operator: '=' as ConditionOperator, value: '', valueTo: '', fieldType: 'text' });
                            } else {
                              const newFt = getFieldType(routerFields, v);
                              const defaultOp = OPERATORS_BY_TYPE[newFt][0].value;
                              updateCondition(groupIdx, condIdx, { parameter: v, fieldType: newFt, operator: defaultOp, value: '', valueTo: '' });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1 min-w-[110px] max-w-[160px]">
                            <SelectValue placeholder="Field…" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Triggers group — hidden in Canvas B where action is a top-level card */}
                            {!hideAction && (
                              <>
                                <div className="px-2 py-1 text-xs text-orange-500 font-semibold uppercase tracking-wide">Triggers</div>
                                <SelectItem value={ACTION_PARAM} className="text-xs text-orange-600 font-medium">⚡ User tapped...</SelectItem>
                              </>
                            )}
                            {/* Field groups */}
                            {(['native', 'custom', 'system'] as const).map((groupName) => {
                              const groupFields = routerFields.filter((f) => f.group === groupName);
                              if (groupFields.length === 0) return null;
                              return (
                                <div key={groupName}>
                                  <div className="px-2 py-1 text-xs text-gray-400 font-semibold border-t uppercase tracking-wide">{groupName}</div>
                                  {groupFields.map((f) => (
                                    <SelectItem key={f.value} value={f.value} className="font-mono text-xs">
                                      <span>{f.label}</span>
                                      {f.sourceBlockName && <span className="ml-1.5 text-[10px] text-gray-400">({f.sourceBlockName})</span>}
                                    </SelectItem>
                                  ))}
                                </div>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        {/* Operator */}
                        <Select value={condition.operator}
                          onValueChange={(v) => updateCondition(groupIdx, condIdx, { operator: v as ConditionOperator, value: '', valueTo: '' })}>
                          <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ops.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}
                          </SelectContent>
                        </Select>

                        {/* Value(s) */}
                        {!noVal && (
                          twoVal ? (
                            <>
                              <Input className="h-7 text-xs w-16" placeholder="from" value={condition.value} onChange={(e) => updateCondition(groupIdx, condIdx, { value: e.target.value })} />
                              <span className="text-gray-400 text-xs">–</span>
                              <Input className="h-7 text-xs w-16" placeholder="to" value={condition.valueTo ?? ''} onChange={(e) => updateCondition(groupIdx, condIdx, { valueTo: e.target.value })} />
                            </>
                          ) : nDays ? (
                            <Input className="h-7 text-xs w-16" placeholder="N" type="number" value={condition.value} onChange={(e) => updateCondition(groupIdx, condIdx, { value: e.target.value })} />
                          ) : (
                            <Input className="h-7 text-xs flex-1 min-w-[60px]"
                              placeholder={condition.operator === 'in' || condition.operator === 'not in' ? 'a, b, c' : 'value'}
                              value={condition.value} onChange={(e) => updateCondition(groupIdx, condIdx, { value: e.target.value })} />
                          )
                        )}

                        {group.conditions.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-red-500 shrink-0"
                            onClick={() => deleteCondition(groupIdx, condIdx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <Button variant="outline" size="sm" className="text-xs h-7 w-full"
                onClick={() => addCondition(groupIdx)}>
                <Plus className="h-3 w-3 mr-1" /> Add Condition
              </Button>
            </div>
          </div>

          {/* Between-group operator */}
          {groupIdx < groups.length - 1 && (
            <div className="flex items-center justify-center gap-2 py-2">
              {(['AND', 'OR'] as const).map((op) => (
                <button key={op}
                  className={`text-xs px-3 py-0.5 rounded border font-semibold transition-colors ${
                    (group.nextGroupOperator ?? 'AND') === op
                      ? op === 'AND' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'bg-white text-gray-300 border-gray-200'
                  }`}
                  onClick={() => updateNextGroupOperator(groupIdx, op)}
                >{op}</button>
              ))}
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" className="text-xs h-7 w-full border-dashed" onClick={addGroup}>
        <Plus className="h-3 w-3 mr-1" /> Add Group
      </Button>
    </div>
  );
}
