import { BlockData, ConditionOperator, FieldType, RoutingConfig, ConditionGroup, Condition } from '../../types/journey';

export interface RouterField {
  value: string;
  label: string;
  group: 'native' | 'custom' | 'system';
  fieldType: FieldType;
  sourceBlockName?: string;
}

// Special sentinel value for "User tapped" action condition
export const ACTION_PARAM = '__action__';

export const OPERATORS_BY_TYPE: Record<FieldType, { value: ConditionOperator; label: string }[]> = {
  text: [
    { value: '=',             label: 'equals' },
    { value: '!=',            label: 'not equals' },
    { value: 'contains',      label: 'contains' },
    { value: 'not contains',  label: 'not contains' },
    { value: 'in',            label: 'in (comma list)' },
    { value: 'not in',        label: 'not in (comma list)' },
    { value: 'is empty',      label: 'is empty' },
    { value: 'is not empty',  label: 'is not empty' },
    { value: 'matches regex', label: 'matches regex' },
  ],
  number: [
    { value: '=',             label: 'equals' },
    { value: '!=',            label: 'not equals' },
    { value: '>',             label: 'greater than' },
    { value: '<',             label: 'less than' },
    { value: '>=',            label: 'greater or equal' },
    { value: '<=',            label: 'less or equal' },
    { value: 'between',       label: 'between' },
    { value: 'is empty',      label: 'is empty' },
    { value: 'is not empty',  label: 'is not empty' },
  ],
  date: [
    { value: '=',                 label: 'equals (YYYY-MM-DD)' },
    { value: '!=',                label: 'not equals' },
    { value: '>',                 label: 'after date' },
    { value: '<',                 label: 'before date' },
    { value: 'between',           label: 'between dates' },
    { value: 'is before today',   label: 'is before today' },
    { value: 'is after today',    label: 'is after today' },
    { value: 'is in last N days', label: 'is in last N days' },
    { value: 'is empty',          label: 'is empty' },
    { value: 'is not empty',      label: 'is not empty' },
  ],
  boolean: [
    { value: '=',  label: 'equals' },
    { value: '!=', label: 'not equals' },
  ],
};

export const SYSTEM_FIELDS: RouterField[] = [
  { value: 'system.attempt_count', label: 'Attempt Count', group: 'system', fieldType: 'number' },
  { value: 'system.device_type',   label: 'Device Type',   group: 'system', fieldType: 'text' },
  { value: 'system.timestamp',     label: 'Timestamp',     group: 'system', fieldType: 'date' },
  { value: 'system.platform',      label: 'Platform',      group: 'system', fieldType: 'text' },
  { value: 'system.journey_step',  label: 'Journey Step',  group: 'system', fieldType: 'number' },
];

export const NO_VALUE_OPERATORS: ConditionOperator[] = ['is empty', 'is not empty', 'is before today', 'is after today'];
export const TWO_VALUE_OPERATORS: ConditionOperator[] = ['between'];
export const NDAYS_OPERATORS: ConditionOperator[] = ['is in last N days'];

export function getRouterFields(allBlocks: BlockData[], currentBlockId: string): RouterField[] {
  const fields: RouterField[] = [];
  const currentIndex = allBlocks.findIndex((b) => b.id === currentBlockId);
  const upstreamBlocks = currentIndex >= 0 ? allBlocks.slice(0, currentIndex) : [];

  for (const block of upstreamBlocks) {
    for (const page of block.pages ?? []) {
      for (const inp of page.userInputs ?? []) {
        if (inp.fieldSource && inp.key) {
          const ft: FieldType = inp.type === 'number' ? 'number' : inp.type === 'date' ? 'date' : 'text';
          fields.push({ value: `${inp.fieldSource}.${inp.key}`, label: inp.name || inp.key, group: inp.fieldSource, fieldType: ft, sourceBlockName: block.name });
        }
      }
    }
    if (block.type === 'form' && block.formFields) {
      for (const f of block.formFields) {
        if (f.fieldSource && f.key) {
          const ft: FieldType = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
          fields.push({ value: `${f.fieldSource}.${f.key}`, label: f.name, group: f.fieldSource, fieldType: ft, sourceBlockName: block.name });
        }
      }
    }
    for (const slot of block.dataHooks ?? []) {
      for (const hook of slot.apis ?? []) {
        for (const cap of hook.outputCaptures) {
          if (cap.storeType !== 'none' && cap.storeName) {
            fields.push({ value: cap.storeName, label: cap.label || cap.storeName, group: cap.storeType === 'native' ? 'native' : 'custom', fieldType: 'text', sourceBlockName: block.name });
          }
        }
      }
    }
    if (block.type === 'decision' && block.decisionConfig?.verdictStorageKey) {
      const vsk = block.decisionConfig.verdictStorageKey;
      fields.push({ value: vsk, label: `${block.name} verdict`, group: vsk.startsWith('native.') ? 'native' : 'custom', fieldType: 'text', sourceBlockName: block.name });
    }
  }

  const seen = new Set<string>();
  const deduped = fields.filter((f) => { if (seen.has(f.value)) return false; seen.add(f.value); return true; });
  return [...deduped, ...SYSTEM_FIELDS];
}

export function getFieldType(fields: RouterField[], parameter: string): FieldType {
  return fields.find((f) => f.value === parameter)?.fieldType ?? 'text';
}

// Returns actions[] from the last page of the immediately previous upstream block that has pages
export function getPreviousBlockActions(allBlocks: BlockData[], currentBlockId: string): string[] {
  const currentIndex = allBlocks.findIndex((b) => b.id === currentBlockId);
  if (currentIndex <= 0) return [];
  const upstream = allBlocks.slice(0, currentIndex);
  for (let i = upstream.length - 1; i >= 0; i--) {
    const b = upstream[i];
    if ((b.pages ?? []).length > 0) {
      const lastPage = b.pages![b.pages!.length - 1];
      return lastPage.actions ?? [];
    }
  }
  return [];
}

// Plain-English summary of a routing's conditions (for Canvas C collapsed strip)
export function getConditionSummary(routing: RoutingConfig): string {
  const groups = routing.conditionGroups ?? [];
  const allConds = groups.flatMap((g) => g.conditions);
  if (allConds.length === 0) return 'No conditions set';
  const first = allConds[0];
  const firstStr = first.parameter === ACTION_PARAM
    ? `User tapped: ${first.value || '?'}`
    : `${first.parameter.split('.').pop() ?? first.parameter} ${first.operator} ${first.value}`;
  return allConds.length === 1 ? firstStr : `${firstStr}  +${allConds.length - 1} more`;
}

export function makeEmptyConditionGroup(routerFields: RouterField[]): ConditionGroup {
  const firstField = routerFields[0];
  return {
    id: `group-${Date.now()}`,
    operator: 'AND' as const,
    conditions: [{
      id: `cond-${Date.now()}`,
      parameter: firstField?.value ?? '',
      operator: '=' as ConditionOperator,
      value: '',
      fieldType: firstField?.fieldType ?? 'text',
    }],
  };
}

export function makeEmptyRouting(routerFields: RouterField[]): RoutingConfig {
  return {
    id: `routing-${Date.now()}`,
    label: '',
    routingType: 'condition' as const,
    conditionGroups: [makeEmptyConditionGroup(routerFields)],
    targetBlockId: '',
    saved: false,
  };
}
