import { BlockData, PageConfig, DecisionBlockConfig } from '../types/journey';
import { X, Info, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
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


// Predefined form fields (used for router block condition dropdowns)
const PREDEFINED_FORM_FIELDS = [
  { name: "Father's Name", type: 'text' as const, required: false },
  { name: "Mother's Name", type: 'text' as const, required: false },
  { name: 'Gender', type: 'select' as const, required: false },
  { name: 'Annual Income', type: 'number' as const, required: false },
  { name: 'Date of Birth', type: 'date' as const, required: false },
  { name: 'Email Address', type: 'email' as const, required: false },
  { name: 'Phone Number', type: 'tel' as const, required: false },
  { name: 'Address Line 1', type: 'text' as const, required: false },
  { name: 'Address Line 2', type: 'text' as const, required: false },
  { name: 'City', type: 'text' as const, required: false },
  { name: 'State', type: 'text' as const, required: false },
  { name: 'PIN Code', type: 'text' as const, required: false },
  { name: 'Occupation', type: 'text' as const, required: false },
  { name: 'Marital Status', type: 'select' as const, required: false },
  { name: 'Education Level', type: 'select' as const, required: false },
];


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
    updatedRoutings[routingIndex] = {
      ...updatedRoutings[routingIndex],
      saved: false,
    };
    handleFieldChange('routings', updatedRoutings);
  };

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
                    {/* Existing Routings */}
                    {block.routings && block.routings.length > 0 ? (
                      <div className="space-y-4">
                        {block.routings.map((routing, routingIndex) => (
                          <div key={routing.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <button
                                className="flex items-center gap-2 text-left"
                                onClick={() =>
                                  setExpandedRoutingIds((prev) => ({
                                    ...prev,
                                    [routing.id]: !prev[routing.id],
                                  }))
                                }
                              >
                                {expandedRoutingIds[routing.id] ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <div>
                                  <h4 className="font-medium text-sm">Route {routingIndex + 1}</h4>
                                  <p className="text-xs text-gray-500">
                                    {routing.operator} · {routing.conditions.length} condition
                                    {routing.conditions.length !== 1 ? 's' : ''} ·{' '}
                                    {routing.targetBlockId
                                      ? allBlocks.find((b) => b.id === routing.targetBlockId)?.name || 'Target selected'
                                      : 'No target selected'}
                                  </p>
                                </div>
                              </button>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={
                                    routing.saved
                                      ? 'bg-emerald-100 text-emerald-700 text-xs'
                                      : 'bg-amber-100 text-amber-700 text-xs'
                                  }
                                >
                                  {routing.saved ? 'Saved' : 'Draft'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedRoutings = block.routings!.filter((_, i) => i !== routingIndex);
                                    handleFieldChange('routings', updatedRoutings);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {expandedRoutingIds[routing.id] && (
                              <>
                                {/* Conditions */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Label className="text-sm">All conditions must be:</Label>
                                    <Select
                                      value={routing.operator}
                                      onValueChange={(value: 'AND' | 'OR') => {
                                        const updatedRoutings = [...block.routings!];
                                        updatedRoutings[routingIndex].operator = value;
                                        markRoutingAsDraft(updatedRoutings, routingIndex);
                                      }}
                                    >
                                      <SelectTrigger className="w-20 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="AND">AND</SelectItem>
                                        <SelectItem value="OR">OR</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {routing.conditions.map((condition, conditionIndex) => (
                                    <div key={condition.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                      <span className="text-sm text-gray-600">If</span>

                                      <Select
                                        value={condition.parameter}
                                        onValueChange={(value) => {
                                          const updatedRoutings = [...block.routings!];
                                          updatedRoutings[routingIndex].conditions[conditionIndex].parameter = value;
                                          markRoutingAsDraft(updatedRoutings, routingIndex);
                                        }}
                                      >
                                        <SelectTrigger className="w-32 h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {PREDEFINED_FORM_FIELDS.map((field) => (
                                            <SelectItem key={field.name} value={field.name}>
                                              {field.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      <Select
                                        value={condition.operator}
                                        onValueChange={(value: any) => {
                                          const updatedRoutings = [...block.routings!];
                                          updatedRoutings[routingIndex].conditions[conditionIndex].operator = value;
                                          markRoutingAsDraft(updatedRoutings, routingIndex);
                                        }}
                                      >
                                        <SelectTrigger className="w-24 h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="=">equals</SelectItem>
                                          <SelectItem value="!=">not equals</SelectItem>
                                          <SelectItem value=">">greater than</SelectItem>
                                          <SelectItem value="<">less than</SelectItem>
                                          <SelectItem value=">=">greater or equal</SelectItem>
                                          <SelectItem value="<=">less or equal</SelectItem>
                                          <SelectItem value="contains">contains</SelectItem>
                                          <SelectItem value="not contains">not contains</SelectItem>
                                          <SelectItem value="is empty">is empty</SelectItem>
                                          <SelectItem value="is not empty">is not empty</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <Input
                                        value={condition.value}
                                        onChange={(e) => {
                                          const updatedRoutings = [...block.routings!];
                                          updatedRoutings[routingIndex].conditions[conditionIndex].value = e.target.value;
                                          markRoutingAsDraft(updatedRoutings, routingIndex);
                                        }}
                                        placeholder="value"
                                        className="flex-1 h-8 text-xs"
                                      />

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updatedRoutings = [...block.routings!];
                                          updatedRoutings[routingIndex].conditions = updatedRoutings[routingIndex].conditions.filter((_, i) => i !== conditionIndex);
                                          markRoutingAsDraft(updatedRoutings, routingIndex);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}

                                  {/* Add condition button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const updatedRoutings = [...block.routings!];
                                      const newCondition = {
                                        id: `condition-${Date.now()}`,
                                        parameter: PREDEFINED_FORM_FIELDS[0].name,
                                        operator: '=' as const,
                                        value: '',
                                      };
                                      updatedRoutings[routingIndex].conditions.push(newCondition);
                                      markRoutingAsDraft(updatedRoutings, routingIndex);
                                    }}
                                    className="w-full"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Condition
                                  </Button>
                                </div>

                                {/* Route to */}
                                <div className="mt-4 pt-3 border-t">
                                  <Label className="text-sm font-medium">Then route to:</Label>
                                  <Select
                                    value={routing.targetBlockId}
                                    onValueChange={(value) => {
                                      const updatedRoutings = [...block.routings!];
                                      updatedRoutings[routingIndex].targetBlockId = value;
                                      markRoutingAsDraft(updatedRoutings, routingIndex);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 mt-1">
                                      <SelectValue placeholder="Select target block..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allBlocks
                                        .filter(b => b.id !== block.id) // Don't allow routing to self
                                        .map((b) => (
                                          <SelectItem key={b.id} value={b.id}>
                                            {b.name} ({b.type})
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Button
                                  size="sm"
                                  className="w-full mt-3"
                                  onClick={() => {
                                    if (!routing.targetBlockId) return;
                                    const updatedRoutings = [...block.routings!];
                                    updatedRoutings[routingIndex] = {
                                      ...updatedRoutings[routingIndex],
                                      saved: true,
                                    };
                                    handleFieldChange('routings', updatedRoutings);
                                  }}
                                  disabled={!routing.targetBlockId}
                                >
                                  Save Route
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No routing conditions configured</p>
                    )}

                    {/* Add Routing Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newRouting = {
                          id: `routing-${Date.now()}`,
                          conditions: [{
                            id: `condition-${Date.now()}`,
                            parameter: PREDEFINED_FORM_FIELDS[0].name,
                            operator: '=' as const,
                            value: '',
                          }],
                          operator: 'AND' as const,
                          targetBlockId: '',
                          saved: false,
                        };
                        const updatedRoutings = [...(block.routings || []), newRouting];
                        handleFieldChange('routings', updatedRoutings);
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
                          {allBlocks
                            .filter(b => b.id !== block.id)
                            .map((b) => (
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

                {/* Data Hooks (Smart + Form + Start blocks) */}
                {(block.type === 'smart' || block.type === 'form' || block.type === 'start') && (
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
                        {block.pages && block.pages.every((p) => p.isConfigured) && (
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
