import { BlockData } from '../types/journey';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Info, Trash2, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { getShortDescription } from '../data/blockDefinitions';
import { useState } from 'react';

interface ConfigurationPanelProps {
  block: BlockData | null;
  allBlocks: BlockData[];
  onClose: () => void;
  onSave: (block: BlockData) => void;
  onDelete: (blockId: string) => void;
}

// Predefined form fields
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
        <p className="text-sm">Select a block to configure</p>
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
    const updatedChecks = block.checks?.map((check) =>
      check.id === checkId
        ? {
            ...check,
            fields: check.fields.map((field) =>
              field.id === fieldId ? { ...field, value } : field
            ),
          }
        : check
    );
    onSave({ ...block, checks: updatedChecks });
  };

  const handleGeneralConfigChange = (fieldId: string, value: any) => {
    const updatedConfig = block.generalConfig?.map((field) =>
      field.id === fieldId ? { ...field, value } : field
    );
    onSave({ ...block, generalConfig: updatedConfig });
  };

  const canEditName = block.type === 'form' || block.type === 'end';
  const canEditDescription = block.type === 'form' || block.type === 'end';
  const hasProvider = block.type === 'smart' && block.provider;
  const hasUserInput = block.type === 'form';
  const hasChecks = block.type === 'smart' && block.checks && block.checks.length > 0;
  const hasGeneralConfig = block.generalConfig && block.generalConfig.length > 0;
  const hasUIConfig = block.pages && block.pages.length > 0;
  const hasRetry = block.type === 'smart' && Boolean(block.hasRetry || block.retryConfig);

  const getBadgeColor = () => {
    switch (block.type) {
      case 'smart':
        return 'bg-blue-100 text-blue-700';
      case 'form':
        return 'bg-green-100 text-green-700';
      case 'router':
        return 'bg-orange-100 text-orange-700';
      case 'end':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getBadgeText = () => {
    switch (block.type) {
      case 'smart':
        return 'SMART';
      case 'form':
        return 'FORM';
      case 'router':
        return 'LOGIC';
      case 'end':
        return 'END';
      default:
        return '';
    }
  };

  const [newFormField, setNewFormField] = useState({
    id: '',
    name: '',
    type: 'text',
    required: false,
  });

  const [selectedPredefinedField, setSelectedPredefinedField] = useState<{
    name: string;
    type: 'text' | 'select' | 'number' | 'email' | 'tel' | 'date';
    required: boolean;
  } | null>(null);

  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [showAddPage, setShowAddPage] = useState(false);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [newUserInput, setNewUserInput] = useState({ name: '', dataType: 'STRING' });

  const selectedPage = block.pages?.find((p) => p.id === selectedPageId);

  const handleAddFormField = () => {
    if (newFormField.name) {
      const updatedFormFields = [
        ...(block.formFields || []),
        {
          id: newFormField.id || `field-${Date.now()}`,
          name: newFormField.name,
          type: newFormField.type,
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

  const handleAddPredefinedField = () => {
    if (selectedPredefinedField) {
      const updatedFormFields = [
        ...(block.formFields || []),
        {
          id: `field-${Date.now()}`,
          name: selectedPredefinedField.name,
          type: selectedPredefinedField.type,
          required: selectedPredefinedField.required,
        },
      ];
      onSave({ ...block, formFields: updatedFormFields });
      setSelectedPredefinedField(null);
    }
  };

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-screen">
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
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion type="multiple" defaultValue={[]}>
            {/* Block Info */}
            <AccordionItem value="block-info">
              <AccordionTrigger>Block Info</AccordionTrigger>
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
                              <h4 className="font-medium text-sm">Route {routingIndex + 1}</h4>
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

                            {/* Conditions */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Label className="text-sm">All conditions must be:</Label>
                                <Select
                                  value={routing.operator}
                                  onValueChange={(value: 'AND' | 'OR') => {
                                    const updatedRoutings = [...block.routings!];
                                    updatedRoutings[routingIndex].operator = value;
                                    handleFieldChange('routings', updatedRoutings);
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
                                      handleFieldChange('routings', updatedRoutings);
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
                                      handleFieldChange('routings', updatedRoutings);
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
                                      handleFieldChange('routings', updatedRoutings);
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
                                      handleFieldChange('routings', updatedRoutings);
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
                                  handleFieldChange('routings', updatedRoutings);
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
                                  handleFieldChange('routings', updatedRoutings);
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
                          targetBlockId: allBlocks.find(b => b.id !== block.id)?.id || '',
                        };
                        const updatedRoutings = [...(block.routings || []), newRouting];
                        handleFieldChange('routings', updatedRoutings);
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
                {/* Service Provider */}
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

                {/* User Input (Form Block Only) */}
                {hasUserInput && (
                  <AccordionItem value="user-input">
                    <AccordionTrigger>
                      User Input
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedPredefinedField?.name || ''}
                            onValueChange={(value) => {
                              const field = PREDEFINED_FORM_FIELDS.find(f => f.name === value);
                              setSelectedPredefinedField(field || null);
                            }}
                          >
                            <SelectTrigger className="flex-1 h-8 text-sm">
                              <SelectValue placeholder="Choose field type..." />
                            </SelectTrigger>
                            <SelectContent>
                              {PREDEFINED_FORM_FIELDS.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  {field.name} ({field.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={handleAddPredefinedField} disabled={!selectedPredefinedField}>
                            <Plus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>

                        {block.formFields && block.formFields.length > 0 ? (
                          <div className="space-y-2">
                            {block.formFields.map((field) => (
                              <div key={field.id} className="border rounded p-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{field.name}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {field.type} {field.required && '(Required)'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No input fields added</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Checks & Validations */}
                <AccordionItem value="checks" disabled={!hasChecks && block.type !== 'smart'}>
                  <AccordionTrigger className={!hasChecks && block.type !== 'smart' ? 'opacity-50' : ''}>
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

                {/* General Configuration */}
                <AccordionItem value="general-config">
                  <AccordionTrigger>General Configuration</AccordionTrigger>
                  <AccordionContent>
                    {hasGeneralConfig ? (
                      <div className="space-y-3">
                        {block.generalConfig!.map((field) => (
                          <div key={field.id}>
                            <Label className="text-sm">{field.name}</Label>
                            {field.type === 'select' ? (
                              <Select
                                value={field.value}
                                onValueChange={(value) => handleGeneralConfigChange(field.id, value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
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

                {/* UI Configuration */}
                <AccordionItem value="ui-config">
                  <AccordionTrigger>
                    <div className="flex items-center justify-between flex-1 pr-2">
                      <span>UI Configuration</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        Configured
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {hasUIConfig ? (
                      <div className="space-y-4">
                        {/* Description */}
                        <p className="text-sm text-gray-600">
                          Configure pages and actions for user journey
                        </p>

                        {/* Pages List with Collapsible Sections */}
                        <div className="space-y-2">
                          {block.pages!.map((page, index) => (
                            <div key={page.id} className="border rounded">
                              {/* Page Header - Collapsible */}
                              <button
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                                onClick={() =>
                                  setExpandedPageId(expandedPageId === page.id ? null : page.id)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  {expandedPageId === page.id ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {index + 1} {page.name}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              </button>

                              {/* Page Content - Expanded */}
                              {expandedPageId === page.id && (
                                <div className="p-3 pt-0 space-y-3 border-t">
                                  {/* Page Name */}
                                  <div>
                                    <Label className="text-xs text-gray-700">Page Name</Label>
                                    <div className="mt-1 text-sm font-medium">{page.name}</div>
                                  </div>

                                  {/* Action */}
                                  <div>
                                    <Label className="text-xs text-gray-700">Action</Label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                      {page.action}
                                    </div>
                                  </div>

                                  {/* User Inputs (Display Only) */}
                                  <div>
                                    <Label className="text-xs text-gray-500">
                                      User Inputs (Display Only)
                                    </Label>
                                    <div className="mt-2 space-y-2">
                                      {page.userInputs.length > 0 ? (
                                        page.userInputs.map((input) => (
                                          <div
                                            key={input.id}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <span>•</span>
                                            <span className="font-medium">{input.name}</span>
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                              {input.dataType || 'STRING'}
                                            </Badge>
                                            {input.required && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                              >
                                                Required
                                              </Badge>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">
                                          No user inputs required
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Page Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowAddPage(!showAddPage)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Page
                        </Button>

                        {/* Add Page Form - Shows when button is clicked */}
                        {showAddPage && (
                          <div className="border rounded p-3 bg-gray-50 space-y-3">
                            <h4 className="text-sm font-medium">Configure New Page</h4>

                            {/* Page Dropdown */}
                            <div>
                              <Label className="text-xs">Select Page</Label>
                              <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                                <SelectTrigger className="h-8 text-sm mt-1">
                                  <SelectValue placeholder="Choose a page..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {block.pages!.map((page) => (
                                    <SelectItem key={page.id} value={page.id}>
                                      {page.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Action Dropdown */}
                            {selectedPageId && (
                              <div>
                                <Label className="text-xs">Select Action</Label>
                                <Select value={selectedAction} onValueChange={setSelectedAction}>
                                  <SelectTrigger className="h-8 text-sm mt-1">
                                    <SelectValue placeholder="Choose an action..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="submit">Submit</SelectItem>
                                    <SelectItem value="navigate">Navigate</SelectItem>
                                    <SelectItem value="validate">Validate</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Add User Input Section */}
                            {selectedPageId && selectedAction && (
                              <div className="border-t pt-3">
                                <Label className="text-xs font-medium mb-2 block">Add User Input</Label>
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Input name (e.g., PAN Number)"
                                    value={newUserInput.name}
                                    onChange={(e) =>
                                      setNewUserInput({ ...newUserInput, name: e.target.value })
                                    }
                                    className="h-8 text-sm"
                                  />
                                  <Select
                                    value={newUserInput.dataType}
                                    onValueChange={(value) =>
                                      setNewUserInput({ ...newUserInput, dataType: value })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Data type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="STRING">STRING</SelectItem>
                                      <SelectItem value="NUMBER">NUMBER</SelectItem>
                                      <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                      <SelectItem value="DATE">DATE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" variant="secondary" className="w-full">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Input
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setShowAddPage(false);
                                  setSelectedPageId('');
                                  setSelectedAction('');
                                  setNewUserInput({ name: '', dataType: 'STRING' });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button size="sm" className="flex-1">
                                Save Page
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No UI configuration</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Retry Rules */}
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
