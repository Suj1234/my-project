import { BlockData, PageConfig, DecisionBlockConfig, ConditionGroup, Condition, ConditionOperator, FieldType } from '../types/journey';
import { X, Info, Trash2, Plus, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { getShortDescription } from '../data/blockDefinitions';
import { useState } from 'react';
import { PageConfigCard } from './PageConfigCard';
import { ABTestingPageCard } from './ABTestingPageCard';
import { DataHooksSection } from './DataHooksSection';
import { DecisionRulesSection } from './DecisionRulesSection';
import { getDefaultHookEventSlots, mergeWithDefaultSlots } from '../data/hookEventTemplates';

interface ConfigurationPanelProps {
  block: BlockData | null;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}


interface RouterField {
  value: string;
  label: string;
  group: 'native' | 'custom' | 'system';
  fieldType: FieldType;
  sourceBlockName?: string;
}

const OPERATORS_BY_TYPE: Record<FieldType, { value: ConditionOperator; label: string }[]> = {
  text: [
    { value: '=',            label: 'equals' },
    { value: '!=',           label: 'not equals' },
    { value: 'contains',     label: 'contains' },
    { value: 'not contains', label: 'not contains' },
    { value: 'in',           label: 'in (comma list)' },
    { value: 'not in',       label: 'not in (comma list)' },
    { value: 'is empty',     label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
    { value: 'matches regex',label: 'matches regex' },
  ],
  number: [
    { value: '=',            label: 'equals' },
    { value: '!=',           label: 'not equals' },
    { value: '>',            label: 'greater than' },
    { value: '<',            label: 'less than' },
    { value: '>=',           label: 'greater or equal' },
    { value: '<=',           label: 'less or equal' },
    { value: 'between',      label: 'between' },
    { value: 'is empty',     label: 'is empty' },
    { value: 'is not empty', label: 'is not empty' },
  ],
  date: [
    { value: '=',                  label: 'equals (YYYY-MM-DD)' },
    { value: '!=',                 label: 'not equals' },
    { value: '>',                  label: 'after date' },
    { value: '<',                  label: 'before date' },
    { value: 'between',            label: 'between dates' },
    { value: 'is before today',    label: 'is before today' },
    { value: 'is after today',     label: 'is after today' },
    { value: 'is in last N days',  label: 'is in last N days' },
    { value: 'is empty',           label: 'is empty' },
    { value: 'is not empty',       label: 'is not empty' },
  ],
  boolean: [
    { value: '=',  label: 'equals' },
    { value: '!=', label: 'not equals' },
  ],
};

const SYSTEM_FIELDS: RouterField[] = [
  { value: 'system.attempt_count', label: 'Attempt Count', group: 'system', fieldType: 'number' },
  { value: 'system.device_type',   label: 'Device Type',   group: 'system', fieldType: 'text' },
  { value: 'system.timestamp',     label: 'Timestamp',     group: 'system', fieldType: 'date' },
  { value: 'system.platform',      label: 'Platform',      group: 'system', fieldType: 'text' },
  { value: 'system.journey_step',  label: 'Journey Step',  group: 'system', fieldType: 'number' },
];

function getRouterFields(allBlocks: BlockData[], currentBlockId: string): RouterField[] {
  const fields: RouterField[] = [];
  const currentIndex = allBlocks.findIndex((b) => b.id === currentBlockId);
  const upstreamBlocks = currentIndex >= 0 ? allBlocks.slice(0, currentIndex) : [];

  for (const block of upstreamBlocks) {
    // User inputs declared on pages (any block type)
    for (const page of block.pages ?? []) {
      for (const inp of page.userInputs ?? []) {
        if (inp.fieldSource && inp.key) {
          const ft: FieldType = inp.type === 'number' ? 'number' : inp.type === 'date' ? 'date' : 'text';
          fields.push({
            value: `${inp.fieldSource}.${inp.key}`,
            label: inp.name || inp.key,
            group: inp.fieldSource,
            fieldType: ft,
            sourceBlockName: block.name,
          });
        }
      }
    }

    // Form block formFields
    if (block.type === 'form' && block.formFields) {
      for (const f of block.formFields) {
        if (f.fieldSource && f.key) {
          const ft: FieldType = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
          fields.push({
            value: `${f.fieldSource}.${f.key}`,
            label: f.name,
            group: f.fieldSource,
            fieldType: ft,
            sourceBlockName: block.name,
          });
        }
      }
    }

    // Data hook output captures
    for (const slot of block.dataHooks ?? []) {
      for (const hook of slot.apis ?? []) {
        for (const cap of hook.outputCaptures) {
          if (cap.storeType !== 'none' && cap.storeName) {
            fields.push({
              value: cap.storeName,
              label: cap.label || cap.storeName,
              group: cap.storeType === 'native' ? 'native' : 'custom',
              fieldType: 'text',
              sourceBlockName: block.name,
            });
          }
        }
      }
    }

    // Decision block verdict storage
    if (block.type === 'decision' && block.decisionConfig?.verdictStorageKey) {
      const vsk = block.decisionConfig.verdictStorageKey;
      fields.push({
        value: vsk,
        label: `${block.name} verdict`,
        group: vsk.startsWith('native.') ? 'native' : 'custom',
        fieldType: 'text',
        sourceBlockName: block.name,
      });
    }
  }

  // Deduplicate by value (last declaration wins)
  const seen = new Set<string>();
  const deduped = fields.filter((f) => {
    if (seen.has(f.value)) return false;
    seen.add(f.value);
    return true;
  });

  return [...deduped, ...SYSTEM_FIELDS];
}

function getFieldType(fields: RouterField[], parameter: string): FieldType {
  return fields.find((f) => f.value === parameter)?.fieldType ?? 'text';
}

const NO_VALUE_OPERATORS: ConditionOperator[] = ['is empty', 'is not empty', 'is before today', 'is after today'];
const TWO_VALUE_OPERATORS: ConditionOperator[] = ['between'];
const NDAYS_OPERATORS: ConditionOperator[] = ['is in last N days'];


export function ConfigurationPanel({ block, allBlocks, onClose, onSave, onDelete }: ConfigurationPanelProps) {
  if (!block) {
    return (
      <div className="w-[420px] bg-white border-l border-gray-200 flex items-center justify-center text-gray-500">
        <p className="text-sm">Select a component to configure</p>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: any) => {
    onSave({ ...block, [field]: value });
  };

  const handleCheckToggle = (checkId: string) => {
    const updatedChecks = block.checks?.map((check) =>
      check.id === checkId ? { ...check, enabled: !check.enabled } : check
    );
    onSave({ ...block, checks: updatedChecks });
  };

  const handleCheckOutputResponse = (checkId: string, response: 'pass' | 'reject') => {
    const updatedChecks = block.checks?.map((check) =>
      check.id === checkId ? { ...check, outputResponse: response } : check
    );
    onSave({ ...block, checks: updatedChecks });
  };

  const handleCheckFieldChange = (checkId: string, fieldId: string, value: any) => {
    const updatedChecks = block.checks?.map((check) => {
      if (check.id !== checkId) return check;
      const updatedFields = check.fields.map((field) => {
        if (field.id === fieldId) return { ...field, value };
        // Reset dependent-select fields when their master changes
        if (field.type === 'dependent-select' && field.dependsOn === fieldId) {
          return { ...field, value: '' };
        }
        return field;
      });
      return { ...check, fields: updatedFields };
    });
    onSave({ ...block, checks: updatedChecks });
  };

  const handleGeneralConfigChange = (fieldId: string, value: any) => {
    const updatedConfig = block.generalConfig?.map((field) =>
      field.id === fieldId ? { ...field, value } : field
    );
    onSave({ ...block, generalConfig: updatedConfig });
  };

  const canEditName = block.type === 'form' || block.type === 'end' || block.type === 'merge';
  const canEditDescription = block.type === 'form' || block.type === 'end' || block.type === 'merge' || block.type === 'start';
  const hasProvider = block.type === 'smart' && block.provider;
  const hasChecks = block.type === 'smart' && block.checks && block.checks.length > 0;
  const hasGeneralConfig = block.generalConfig && block.generalConfig.length > 0;
  const hasUIConfig = block.pages && block.pages.length > 0;
  const showUIConfigSection = block.type === 'smart' || block.type === 'form' || block.type === 'end' || block.type === 'start';
  const hasRetry = block.type === 'smart' && Boolean(block.hasRetry || block.retryConfig);
  const hookSlots = mergeWithDefaultSlots(block.dataHooks, getDefaultHookEventSlots(block));

  const getBadgeColor = () => {
    switch (block.type) {
      case 'smart':
        return 'bg-blue-100 text-blue-700';
      case 'form':
        return 'bg-green-100 text-green-700';
      case 'router':
        return 'bg-orange-100 text-orange-700';
      case 'merge':
        return 'bg-indigo-100 text-indigo-700';
      case 'end':
        return 'bg-red-100 text-red-700';
      case 'decision':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getBadgeText = () => {
    switch (block.type) {
      case 'smart':    return 'SMART';
      case 'form':     return 'FORM';
      case 'router':   return 'LOGIC';
      case 'merge':    return 'LOGIC';
      case 'end':      return 'END';
      case 'decision': return 'DECISION';
      default:         return '';
    }
  };

  // Decision block config helpers
  const decisionConfig: DecisionBlockConfig = block.decisionConfig ?? { rules: [], defaultVerdict: 'PASS' };

  const handleDecisionConfigChange = (config: DecisionBlockConfig) => {
    onSave({ ...block, decisionConfig: config });
  };

  const [newFormField, setNewFormField] = useState({
    id: '',
    name: '',
    type: 'text',
    required: false,
  });


  const [expandedRoutingIds, setExpandedRoutingIds] = useState<Record<string, boolean>>({});


  const markRoutingAsDraft = (
    updatedRoutings: NonNullable<BlockData['routings']>,
    routingIndex: number
  ) => {
    updatedRoutings[routingIndex] = { ...updatedRoutings[routingIndex], saved: false };
    handleFieldChange('routings', updatedRoutings);
  };

  const routerFields = block?.type === 'router' ? getRouterFields(allBlocks, block.id) : [];

  const handleAddFormField = () => {
    if (newFormField.name) {
      const updatedFormFields = [
        ...(block.formFields || []),
        {
          id: newFormField.id || `field-${Date.now()}`,
          name: newFormField.name,
          type: newFormField.type as 'text' | 'number' | 'email' | 'tel' | 'date' | 'select',
          required: newFormField.required,
        },
      ];
      onSave({ ...block, formFields: updatedFormFields });
      setNewFormField({
        id: '',
        name: '',
        type: 'text',
        required: false,
      });
    }
  };




  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold">{block.name}</h2>
              <Badge variant="secondary" className={getBadgeColor()}>
                {getBadgeText()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {block.type === 'smart' && block.blockTypeId
                ? getShortDescription(block.blockTypeId)
                : block.description}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          <Accordion type="multiple" defaultValue={[]}>
            {/* Block Info */}
            <AccordionItem value="block-info">
              <AccordionTrigger>Component Info</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={block.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      disabled={!canEditName}
                      className={!canEditName ? 'bg-gray-50' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={block.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      disabled={!canEditDescription}
                      className={!canEditDescription ? 'bg-gray-50' : ''}
                      rows={3}
                    />
                  </div>
                  {block.type === 'form' && (
                    <div>
                      <Label htmlFor="journey-state">Journey State</Label>
                      <p className="text-xs text-gray-500 mb-1.5">The state this component represents in the journey flow</p>
                      <Select
                        value={block.journeyState || ''}
                        onValueChange={(value) => handleFieldChange('journeyState', value)}
                      >
                        <SelectTrigger id="journey-state" className="h-9 text-sm">
                          <SelectValue placeholder="Select state..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead_capture">Lead Capture</SelectItem>
                          <SelectItem value="application">Application</SelectItem>
                          <SelectItem value="document_collection">Document Collection</SelectItem>
                          <SelectItem value="verification">Verification</SelectItem>
                          <SelectItem value="credit_assessment">Credit Assessment</SelectItem>
                          <SelectItem value="sanctioning">Sanctioning</SelectItem>
                          <SelectItem value="disbursement">Disbursement</SelectItem>
                          <SelectItem value="post_disbursement">Post-Disbursement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>


            {/* Routing Conditions (Router Block Only) */}
            {block.type === 'router' && (
              <AccordionItem value="routing-conditions">
                <AccordionTrigger>Routing Conditions</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">

                    {/* Branch type selector */}
                    <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <span className="text-xs font-semibold text-orange-800">Branch Mode:</span>
                      {(['exclusive', 'inclusive'] as const).map((mode) => (
                        <button
                          key={mode}
                          className={`text-xs px-3 py-1 rounded border font-semibold transition-colors ${
                            (block.routerBranchType ?? 'exclusive') === mode
                              ? 'bg-orange-500 text-white border-orange-600'
                              : 'bg-white text-orange-700 border-orange-300'
                          }`}
                          onClick={() => handleFieldChange('routerBranchType', mode)}
                        >
                          {mode === 'exclusive' ? 'Exclusive (first match)' : 'Inclusive (all matches)'}
                        </button>
                      ))}
                    </div>

                    {/* Field availability chips */}
                    {routerFields.filter((f) => f.group === 'native').length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1.5">Native fields declared upstream:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {routerFields.filter((f) => f.group === 'native').map((f) => (
                            <span key={f.value} title={f.sourceBlockName} className="bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-mono text-blue-700">{f.value}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {routerFields.filter((f) => f.group === 'custom').length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1.5">Custom fields declared upstream:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {routerFields.filter((f) => f.group === 'custom').map((f) => (
                            <span key={f.value} title={f.sourceBlockName} className="bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 text-xs font-mono text-purple-700">{f.value}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {routerFields.filter((f) => f.group !== 'system').length === 0 && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        No custom or native fields declared upstream. Configure user inputs or output captures with storage in upstream blocks to route on them here.
                      </div>
                    )}

                    <p className="text-xs text-gray-500">Rules are evaluated top-to-bottom. First matching rule wins (exclusive mode) or all matching rules fire (inclusive mode).</p>

                    {/* Existing Routings */}
                    {(block.routings ?? []).map((routing, routingIndex) => {
                      const totalConditions = (routing.conditionGroups ?? []).reduce((sum, g) => sum + g.conditions.length, 0);
                      return (
                        <div key={routing.id} className="border rounded-lg bg-gray-50 overflow-hidden">
                          {/* Route header */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
                            <button
                              className="flex items-center gap-2 text-left flex-1"
                              onClick={() =>
                                setExpandedRoutingIds((prev) => ({ ...prev, [routing.id]: !prev[routing.id] }))
                              }
                            >
                              {expandedRoutingIds[routing.id] ? (
                                <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                              )}
                              <div>
                                <h4 className="font-medium text-sm">{routing.label || `Route ${routingIndex + 1}`}</h4>
                                <p className="text-xs text-gray-500">
                                  {(routing.conditionGroups ?? []).length} group{(routing.conditionGroups ?? []).length !== 1 ? 's' : ''} · {totalConditions} condition{totalConditions !== 1 ? 's' : ''} ·{' '}
                                  {routing.targetBlockId
                                    ? allBlocks.find((b) => b.id === routing.targetBlockId)?.name || 'Target selected'
                                    : 'No target'}
                                </p>
                              </div>
                            </button>
                            <div className="flex items-center gap-1">
                              {/* Reorder buttons */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-gray-700"
                                disabled={routingIndex === 0}
                                onClick={() => {
                                  const r = [...block.routings!];
                                  [r[routingIndex - 1], r[routingIndex]] = [r[routingIndex], r[routingIndex - 1]];
                                  handleFieldChange('routings', r);
                                }}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-gray-700"
                                disabled={routingIndex === block.routings!.length - 1}
                                onClick={() => {
                                  const r = [...block.routings!];
                                  [r[routingIndex], r[routingIndex + 1]] = [r[routingIndex + 1], r[routingIndex]];
                                  handleFieldChange('routings', r);
                                }}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Badge
                                variant="secondary"
                                className={routing.saved ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-amber-100 text-amber-700 text-xs'}
                              >
                                {routing.saved ? 'Saved' : 'Draft'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                  handleFieldChange('routings', block.routings!.filter((_, i) => i !== routingIndex));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {expandedRoutingIds[routing.id] && (
                            <div className="p-3 space-y-3">
                              {/* Route label */}
                              <div>
                                <Label className="text-xs text-gray-500">Route label (shown on canvas edge)</Label>
                                <Input
                                  value={routing.label ?? ''}
                                  onChange={(e) => {
                                    const r = [...block.routings!];
                                    r[routingIndex] = { ...r[routingIndex], label: e.target.value };
                                    markRoutingAsDraft(r, routingIndex);
                                  }}
                                  placeholder={`Route ${routingIndex + 1}`}
                                  className="h-8 text-xs mt-1"
                                />
                              </div>

                              {/* Between-group operator */}
                              {(routing.conditionGroups ?? []).length > 1 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Groups are connected by:</span>
                                  {(['AND', 'OR'] as const).map((op) => (
                                    <button
                                      key={op}
                                      className={`text-xs px-3 py-0.5 rounded border font-semibold transition-colors ${
                                        (routing.groupOperator ?? 'AND') === op
                                          ? op === 'AND' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'
                                          : 'bg-white text-gray-400 border-gray-200'
                                      }`}
                                      onClick={() => {
                                        const r = [...block.routings!];
                                        r[routingIndex] = { ...r[routingIndex], groupOperator: op };
                                        markRoutingAsDraft(r, routingIndex);
                                      }}
                                    >
                                      {op}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Condition groups */}
                              {(routing.conditionGroups ?? []).map((group, groupIndex) => (
                                <div key={group.id} className="border rounded-lg bg-white overflow-hidden">
                                  {/* Group header */}
                                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-gray-500">Group {groupIndex + 1}</span>
                                      <span className="text-xs text-gray-400">—</span>
                                      {(['AND', 'OR'] as const).map((op) => (
                                        <button
                                          key={op}
                                          className={`text-xs px-2 py-0.5 rounded border font-semibold transition-colors ${
                                            group.operator === op
                                              ? op === 'AND' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300'
                                              : 'bg-white text-gray-300 border-gray-200'
                                          }`}
                                          onClick={() => {
                                            const r = [...block.routings!];
                                            const groups = [...(r[routingIndex].conditionGroups ?? [])];
                                            groups[groupIndex] = { ...groups[groupIndex], operator: op };
                                            r[routingIndex] = { ...r[routingIndex], conditionGroups: groups };
                                            markRoutingAsDraft(r, routingIndex);
                                          }}
                                        >
                                          {op}
                                        </button>
                                      ))}
                                    </div>
                                    {(routing.conditionGroups ?? []).length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-gray-300 hover:text-red-400"
                                        onClick={() => {
                                          const r = [...block.routings!];
                                          const groups = (r[routingIndex].conditionGroups ?? []).filter((_, i) => i !== groupIndex);
                                          r[routingIndex] = { ...r[routingIndex], conditionGroups: groups };
                                          markRoutingAsDraft(r, routingIndex);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>

                                  {/* Conditions in this group */}
                                  <div className="p-2 space-y-2">
                                    {group.conditions.map((condition, conditionIndex) => {
                                      const ft = getFieldType(routerFields, condition.parameter);
                                      const ops = OPERATORS_BY_TYPE[ft];
                                      const noVal = NO_VALUE_OPERATORS.includes(condition.operator);
                                      const twoVal = TWO_VALUE_OPERATORS.includes(condition.operator);
                                      const nDays = NDAYS_OPERATORS.includes(condition.operator);

                                      const updateCond = (updates: Partial<Condition>) => {
                                        const r = [...block.routings!];
                                        const groups = [...(r[routingIndex].conditionGroups ?? [])];
                                        const conds = [...groups[groupIndex].conditions];
                                        conds[conditionIndex] = { ...conds[conditionIndex], ...updates };
                                        groups[groupIndex] = { ...groups[groupIndex], conditions: conds };
                                        r[routingIndex] = { ...r[routingIndex], conditionGroups: groups };
                                        markRoutingAsDraft(r, routingIndex);
                                      };

                                      return (
                                        <div key={condition.id} className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-50 rounded border text-xs">
                                          {conditionIndex > 0 && (
                                            <span className={`px-1.5 py-0.5 rounded font-semibold text-xs ${
                                              group.operator === 'AND' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>{group.operator}</span>
                                          )}

                                          {/* Field selector */}
                                          <Select
                                            value={condition.parameter}
                                            onValueChange={(v) => {
                                              const newFt = getFieldType(routerFields, v);
                                              const defaultOp = OPERATORS_BY_TYPE[newFt][0].value;
                                              updateCond({ parameter: v, fieldType: newFt, operator: defaultOp, value: '', valueTo: '' });
                                            }}
                                          >
                                            <SelectTrigger className="h-7 text-xs flex-1 min-w-[110px] max-w-[150px] font-mono">
                                              <SelectValue placeholder="Field…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {(['native', 'custom', 'system'] as const).map((groupName) => {
                                                const groupFields = routerFields.filter((f) => f.group === groupName);
                                                if (groupFields.length === 0) return null;
                                                return (
                                                  <div key={groupName}>
                                                    <div className="px-2 py-1 text-xs text-gray-400 font-semibold border-t first:border-t-0 uppercase tracking-wide">
                                                      {groupName}
                                                    </div>
                                                    {groupFields.map((f) => (
                                                      <SelectItem key={f.value} value={f.value} className="font-mono text-xs">
                                                        <span>{f.label}</span>
                                                        {f.sourceBlockName && <span className="ml-1.5 text-[10px] text-gray-400 non-mono">({f.sourceBlockName})</span>}
                                                      </SelectItem>
                                                    ))}
                                                  </div>
                                                );
                                              })}
                                            </SelectContent>
                                          </Select>

                                          {/* Operator selector */}
                                          <Select
                                            value={condition.operator}
                                            onValueChange={(v) => updateCond({ operator: v as ConditionOperator, value: '', valueTo: '' })}
                                          >
                                            <SelectTrigger className="h-7 text-xs w-[130px]">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {ops.map((op) => (
                                                <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>

                                          {/* Value input(s) */}
                                          {!noVal && (
                                            twoVal ? (
                                              <>
                                                <Input className="h-7 text-xs w-16" placeholder="from" value={condition.value}
                                                  onChange={(e) => updateCond({ value: e.target.value })} />
                                                <span className="text-gray-400">–</span>
                                                <Input className="h-7 text-xs w-16" placeholder="to" value={condition.valueTo ?? ''}
                                                  onChange={(e) => updateCond({ valueTo: e.target.value })} />
                                              </>
                                            ) : nDays ? (
                                              <Input className="h-7 text-xs w-16" placeholder="N" type="number" value={condition.value}
                                                onChange={(e) => updateCond({ value: e.target.value })} />
                                            ) : (
                                              <Input
                                                className="h-7 text-xs flex-1 min-w-[60px]"
                                                placeholder={condition.operator === 'in' || condition.operator === 'not in' ? 'a, b, c' : 'value'}
                                                value={condition.value}
                                                onChange={(e) => updateCond({ value: e.target.value })}
                                              />
                                            )
                                          )}

                                          {group.conditions.length > 1 && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-gray-300 hover:text-red-500 shrink-0"
                                              onClick={() => {
                                                const r = [...block.routings!];
                                                const groups = [...(r[routingIndex].conditionGroups ?? [])];
                                                groups[groupIndex] = { ...groups[groupIndex], conditions: groups[groupIndex].conditions.filter((_, i) => i !== conditionIndex) };
                                                r[routingIndex] = { ...r[routingIndex], conditionGroups: groups };
                                                markRoutingAsDraft(r, routingIndex);
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-7 w-full"
                                      onClick={() => {
                                        const r = [...block.routings!];
                                        const groups = [...(r[routingIndex].conditionGroups ?? [])];
                                        const firstField = routerFields[0];
                                        groups[groupIndex] = {
                                          ...groups[groupIndex],
                                          conditions: [...groups[groupIndex].conditions, {
                                            id: `cond-${Date.now()}`,
                                            parameter: firstField?.value ?? '',
                                            operator: '=' as ConditionOperator,
                                            value: '',
                                            fieldType: firstField?.fieldType ?? 'text',
                                          }],
                                        };
                                        r[routingIndex] = { ...r[routingIndex], conditionGroups: groups };
                                        markRoutingAsDraft(r, routingIndex);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add Condition
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {/* Add condition group */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 w-full border-dashed"
                                onClick={() => {
                                  const r = [...block.routings!];
                                  const firstField = routerFields[0];
                                  const newGroup: ConditionGroup = {
                                    id: `group-${Date.now()}`,
                                    operator: 'AND',
                                    conditions: [{
                                      id: `cond-${Date.now()}`,
                                      parameter: firstField?.value ?? '',
                                      operator: '=' as ConditionOperator,
                                      value: '',
                                      fieldType: firstField?.fieldType ?? 'text',
                                    }],
                                  };
                                  r[routingIndex] = { ...r[routingIndex], conditionGroups: [...(r[routingIndex].conditionGroups ?? []), newGroup] };
                                  markRoutingAsDraft(r, routingIndex);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Condition Group
                              </Button>

                              {/* Route to */}
                              <div className="pt-2 border-t">
                                <Label className="text-xs font-medium text-gray-600">Then route to:</Label>
                                <Select
                                  value={routing.targetBlockId}
                                  onValueChange={(value) => {
                                    const r = [...block.routings!];
                                    r[routingIndex] = { ...r[routingIndex], targetBlockId: value };
                                    markRoutingAsDraft(r, routingIndex);
                                  }}
                                >
                                  <SelectTrigger className="h-8 mt-1 text-xs">
                                    <SelectValue placeholder="Select target block..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allBlocks.filter((b) => b.id !== block.id).map((b) => (
                                      <SelectItem key={b.id} value={b.id} className="text-xs">
                                        {b.name} ({b.type})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  if (!routing.targetBlockId) return;
                                  const r = [...block.routings!];
                                  r[routingIndex] = { ...r[routingIndex], saved: true };
                                  handleFieldChange('routings', r);
                                }}
                                disabled={!routing.targetBlockId}
                              >
                                Save Route
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(block.routings ?? []).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2">No routes configured yet.</p>
                    )}

                    {/* Add Route button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const firstField = routerFields[0];
                        const newRouting = {
                          id: `routing-${Date.now()}`,
                          label: '',
                          conditionGroups: [{
                            id: `group-${Date.now()}`,
                            operator: 'AND' as const,
                            conditions: [{
                              id: `cond-${Date.now()}`,
                              parameter: firstField?.value ?? '',
                              operator: '=' as ConditionOperator,
                              value: '',
                              fieldType: firstField?.fieldType ?? 'text' as FieldType,
                            }],
                          }],
                          groupOperator: 'AND' as const,
                          targetBlockId: '',
                          saved: false,
                        };
                        handleFieldChange('routings', [...(block.routings ?? []), newRouting]);
                        setExpandedRoutingIds((prev) => ({ ...prev, [newRouting.id]: true }));
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Route
                    </Button>

                    {/* Default Route */}
                    <div className="pt-4 border-t">
                      <Label className="text-sm font-medium">Default Route</Label>
                      <p className="text-xs text-gray-600 mb-2">If no conditions match, route here:</p>
                      <Select
                        value={block.defaultRoute || ''}
                        onValueChange={(value) => handleFieldChange('defaultRoute', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select default block..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allBlocks.filter((b) => b.id !== block.id).map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} ({b.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Other sections (not shown for router blocks) */}
            {block.type !== 'router' && (
              <>
                {/* Service Provider (Smart Blocks Only) */}
                {block.type === 'smart' && (
                  <AccordionItem value="provider">
                    <AccordionTrigger>Service Provider</AccordionTrigger>
                    <AccordionContent>
                      {hasProvider ? (
                        <div>
                          <Label>Provider</Label>
                          {block.blockTypeId === 'bank_account_selection' ? (
                            <Select
                              value={block.provider}
                              onValueChange={(value) => handleFieldChange('provider', value)}
                            >
                              <SelectTrigger>
                                <SelectValue>{block.provider}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tkyc_api_v1">TKYC API v1</SelectItem>
                                <SelectItem value="tkyc_api_v2">TKYC API v2</SelectItem>
                                <SelectItem value="tkyc_api_v3">TKYC API v3</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={block.provider}
                              onValueChange={(value) => handleFieldChange('provider', value)}
                            >
                              <SelectTrigger>
                                <SelectValue>{block.provider}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={block.provider!}>{block.provider}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Current provider configuration</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No configuration available</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}


                {/* Checks & Validations (Smart Blocks Only) */}
                {block.type === 'smart' && (
                  <AccordionItem value="checks" disabled={!hasChecks}>
                    <AccordionTrigger className={!hasChecks ? 'opacity-50' : ''}>
                      Checks & Validations
                    </AccordionTrigger>
                    <AccordionContent>
                      {hasChecks ? (
                      <div className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Checks will run in sequence order as listed below
                          </AlertDescription>
                        </Alert>
                        {block.checks!.map((check) => (
                          <div key={check.id} className="border rounded p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`check-${check.id}`} className="text-sm font-medium">
                                {check.name}
                              </Label>
                              <Switch
                                id={`check-${check.id}`}
                                checked={check.enabled}
                                onCheckedChange={() => handleCheckToggle(check.id)}
                              />
                            </div>
                            {check.enabled && (
                              <div className="space-y-3 pl-1">
                                {/* Output Response */}
                                <div>
                                  <Label className="text-xs">Output Response</Label>
                                  <Select
                                    value={check.outputResponse || 'reject'}
                                    onValueChange={(value: 'pass' | 'reject') =>
                                      handleCheckOutputResponse(check.id, value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pass">Pass</SelectItem>
                                      <SelectItem value="reject">Reject</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Check Fields */}
                                {check.fields.map((field) => (
                                  <div key={field.id}>
                                    <Label className="text-xs">{field.name}</Label>
                                    {field.type === 'toggle' ? (
                                      <div className="flex items-center gap-2 mt-1">
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={(checked) =>
                                            handleCheckFieldChange(check.id, field.id, checked)
                                          }
                                        />
                                      </div>
                                    ) : field.type === 'select' ? (
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) =>
                                          handleCheckFieldChange(check.id, field.id, value)
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {field.options?.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : field.type === 'dependent-select' ? (
                                      (() => {
                                        const masterField = check.fields.find(
                                          (f) => f.id === field.dependsOn
                                        );
                                        const masterValue = masterField?.value || '';
                                        const columnOptions =
                                          masterValue && field.masterColumns
                                            ? field.masterColumns[masterValue] || []
                                            : [];
                                        const isDisabled = !masterValue;
                                        return (
                                          <Select
                                            value={field.value}
                                            onValueChange={(value) =>
                                              handleCheckFieldChange(check.id, field.id, value)
                                            }
                                            disabled={isDisabled}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue
                                                placeholder={
                                                  isDisabled
                                                    ? 'Select a master first...'
                                                    : 'Select column...'
                                                }
                                              />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {columnOptions.map((col) => (
                                                <SelectItem key={col.value} value={col.value}>
                                                  <div className="flex items-center gap-1.5">
                                                    <span>{col.label}</span>
                                                    {col.isPrimaryKey && (
                                                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium leading-none">
                                                        Primary Key
                                                      </span>
                                                    )}
                                                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded leading-none">
                                                      {col.dataType}
                                                    </span>
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        );
                                      })()
                                    ) : (
                                      <Input
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        value={field.value}
                                        onChange={(e) =>
                                          handleCheckFieldChange(
                                            check.id,
                                            field.id,
                                            field.type === 'number'
                                              ? Number(e.target.value)
                                              : e.target.value
                                          )
                                        }
                                        placeholder={field.type === 'text' ? 'Enter value...' : ''}
                                        className="h-8 text-sm"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not applicable for this block type</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* General Configuration (Smart Blocks Only) */}
                {block.type === 'smart' && (
                  <AccordionItem value="general-config">
                    <AccordionTrigger>General Configuration</AccordionTrigger>
                    <AccordionContent>
                      {hasGeneralConfig ? (
                      <div className="space-y-3">
                        {block.generalConfig!.map((field) => (
                          <div key={field.id}>
                            <Label className="text-sm">{field.name}</Label>
                            {field.type === 'toggle' ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) =>
                                    handleGeneralConfigChange(field.id, checked)
                                  }
                                />
                              </div>
                            ) : field.type === 'select' ? (
                              <Select
                                value={field.value}
                                onValueChange={(value) => handleGeneralConfigChange(field.id, value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={field.value}
                                onChange={(e) =>
                                  handleGeneralConfigChange(
                                    field.id,
                                    field.type === 'number'
                                      ? Number(e.target.value)
                                      : e.target.value
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      ) : (
                        <p className="text-sm text-gray-500">No configuration available</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Data Hooks (Smart + Form blocks only) */}
                {(block.type === 'smart' || block.type === 'form') && (
                  <AccordionItem value="data-hooks">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2 flex-1 pr-2">
                        <span>Data Hooks</span>
                        {block.dataHooks && block.dataHooks.length > 0 && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                            {block.dataHooks.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <DataHooksSection
                        block={block}
                        slots={hookSlots}
                        onChange={(slots) => onSave({ ...block, dataHooks: slots })}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Decision Rules (Decision blocks only) */}
                {block.type === 'decision' && (
                  <AccordionItem value="decision-rules">
                    <AccordionTrigger>Decision Rules</AccordionTrigger>
                    <AccordionContent>
                      <DecisionRulesSection
                        config={decisionConfig}
                        allBlocks={allBlocks}
                        currentBlockId={block.id}
                        onChange={handleDecisionConfigChange}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* UI Configuration */}
                {showUIConfigSection && (
                  <AccordionItem value="ui-config">
                    <AccordionTrigger>
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <span>UI Configuration</span>
                        {block.type === 'start' ? (
                          (block.pages ?? []).length > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              {(block.pages ?? []).length} page{(block.pages ?? []).length !== 1 ? 's' : ''}
                            </Badge>
                          )
                        ) : (
                          block.pages && block.pages.every((p) => p.isConfigured) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              All Configured
                            </Badge>
                          )
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {block.type === 'start' ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 mb-3">
                            Landing pages shown at journey entry. You can add multiple.
                          </p>
                          {(block.pages ?? []).map((page, index) => (
                            <div key={page.id} className="relative">
                              <PageConfigCard
                                page={page}
                                index={index}
                                onChange={(updated: PageConfig) => {
                                  const updatedPages = block.pages!.map((p) =>
                                    p.id === updated.id ? updated : p
                                  );
                                  onSave({ ...block, pages: updatedPages });
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-5 w-5 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                  const updatedPages = (block.pages ?? []).filter((p) => p.id !== page.id);
                                  onSave({ ...block, pages: updatedPages });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              const newPage: PageConfig = {
                                id: `landing-${Date.now()}`,
                                name: `Landing Page ${(block.pages ?? []).length + 1}`,
                                action: 'User confirmed',
                                userInputs: [],
                                isConfigured: false,
                              };
                              onSave({ ...block, pages: [...(block.pages ?? []), newPage] });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Landing Page
                          </Button>
                        </div>
                      ) : hasUIConfig ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 mb-3">
                            Each card below represents a required page for this block. Open a card to configure it.
                          </p>
                          {block.pages!.map((page, index) => (
                            <PageConfigCard
                              key={page.id}
                              page={page}
                              index={index}
                              onChange={(updated: PageConfig) => {
                                const updatedPages = block.pages!.map((p) =>
                                  p.id === updated.id ? updated : p
                                );
                                onSave({ ...block, pages: updatedPages });
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No UI configuration</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* UI Configuration (A/B) */}
                {showUIConfigSection && block.type !== 'start' && block.type !== 'end' && (
                  <AccordionItem value="ui-config-ab">
                    <AccordionTrigger>
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <span>UI Configuration (A/B)</span>
                        {block.abPages && block.abPages.every((p) => p.isConfigured) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            All Configured
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {hasUIConfig ? (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 mb-3">
                            Configure A/B test pages for this block. Each card can be assigned from existing pages or generated with AI.
                          </p>
                          {(block.abPages ?? block.pages!).map((page, index) => (
                            <ABTestingPageCard
                              key={page.id}
                              page={page}
                              index={index}
                              onChange={(updated: PageConfig) => {
                                const base = block.abPages ?? block.pages!;
                                const updatedPages = base.map((p) =>
                                  p.id === updated.id ? updated : p
                                );
                                onSave({ ...block, abPages: updatedPages });
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No UI configuration</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}


                {/* Retry Rules (Smart Blocks Only) */}
                {block.type === 'smart' && (
                  <AccordionItem value="retry" disabled={!hasRetry}>
                    <AccordionTrigger className={!hasRetry ? 'opacity-50' : ''}>
                      Retry Rules
                    </AccordionTrigger>
                    <AccordionContent>
                      {hasRetry ? (
                      <div className="space-y-4">
                        {/* How Retry Logic Works Info */}
                        <Alert className="bg-blue-50 border-blue-200">
                          <Info className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-xs text-blue-900 leading-relaxed">
                            <strong>How Retry Logic Works:</strong>
                            <br /><br />
                            <strong>Max Retry Attempts:</strong> Number of times user can retry within one velocity cycle
                            <br />
                            <strong>Cooling Period:</strong> Wait time (in minutes) after max attempts before next cycle starts
                            <br />
                            <strong>Velocity Cycle:</strong> Total number of retry cycles allowed
                            <br /><br />
                            <em>Example: 3 attempts × 3 cycles = 9 total attempts with cooling periods between cycles</em>
                          </AlertDescription>
                        </Alert>

                        {Array.isArray(block.retryConfig) ? (
                          // Multiple retry configs
                          <div className="space-y-4">
                            {(block.retryConfig as any[]).map((retryItem: any, index: number) => (
                              <div key={retryItem.id || index} className="border rounded-lg p-3 bg-gray-50">
                                <h4 className="font-medium text-sm mb-3">{retryItem.name}</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs">Max Attempts</Label>
                                    <Input
                                      type="number"
                                      value={retryItem.maxAttempts || 3}
                                      onChange={(e) => {
                                        const updatedConfigs = [...(block.retryConfig as any[])];
                                        updatedConfigs[index] = {
                                          ...retryItem,
                                          maxAttempts: Number(e.target.value) || 3,
                                        };
                                        handleFieldChange('retryConfig', updatedConfigs);
                                      }}
                                      className="h-7 text-xs"
                                      min={1}
                                      max={10}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Cooling Period (min)</Label>
                                    <Input
                                      type="number"
                                  value={retryItem.coolingPeriod || 120}
                                  onChange={(e) => {
                                    const updatedConfigs = [...(block.retryConfig as any[])];
                                    updatedConfigs[index] = {
                                      ...retryItem,
                                      coolingPeriod: Number(e.target.value) || 120,
                                    };
                                    handleFieldChange('retryConfig', updatedConfigs);
                                  }}
                                  className="h-7 text-xs"
                                  min={0}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Velocity Cycle</Label>
                                <Input
                                  type="number"
                                  value={retryItem.velocityCycle || 3}
                                  onChange={(e) => {
                                    const updatedConfigs = [...(block.retryConfig as any[])];
                                    updatedConfigs[index] = {
                                      ...retryItem,
                                      velocityCycle: Number(e.target.value) || 3,
                                    };
                                    handleFieldChange('retryConfig', updatedConfigs);
                                  }}
                                  className="h-7 text-xs"
                                  min={1}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Single retry config
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Max Retry Attempts</Label>
                          <Input
                            type="number"
                            value={block.retryConfig?.maxAttempts || 3}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...block.retryConfig,
                                maxAttempts: Number(e.target.value) || 3,
                              };
                              handleFieldChange('retryConfig', updatedConfig);
                            }}
                            className="h-8 text-sm"
                            min={1}
                            max={10}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Number of times user can retry within one velocity cycle
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm">Cooling Period (minutes)</Label>
                          <Input
                            type="number"
                            value={block.retryConfig?.coolingPeriod || 120}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...block.retryConfig,
                                coolingPeriod: Number(e.target.value) || 120,
                              };
                              handleFieldChange('retryConfig', updatedConfig);
                            }}
                            className="h-8 text-sm"
                            min={0}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Wait time after max attempts before next cycle starts
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm">Velocity Cycle</Label>
                          <Input
                            type="number"
                            value={block.retryConfig?.velocityCycle || 3}
                            onChange={(e) => {
                              const updatedConfig = {
                                ...block.retryConfig,
                                velocityCycle: Number(e.target.value) || 3,
                              };
                              handleFieldChange('retryConfig', updatedConfig);
                            }}
                            className="h-8 text-sm"
                            min={1}
                            max={10}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Total number of retry cycles allowed
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Warning Alert */}
                    <Alert className="bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs text-amber-900">
                        <strong>Note:</strong> After all retry attempts are exhausted, the application will be automatically rejected.
                      </AlertDescription>
                    </Alert>
                  </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not applicable for this block type</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </>
            )}
          </Accordion>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        {block.type !== 'start' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(block.id)}
          >
            Delete
          </Button>
        )}
        <Button size="sm" onClick={() => onSave(block)} className="flex-1">
          Save
        </Button>
      </div>
    </div>
  );
}
