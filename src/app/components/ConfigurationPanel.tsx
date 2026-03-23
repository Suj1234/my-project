import { BlockData, FormInputField } from '../types/journey';
import { X, ChevronDown, ChevronRight, Pencil, RefreshCw } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
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

const UI_DATA_TYPE_OPTIONS = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'] as const;

const UI_CATEGORY_OPTIONS = [
  'Identity',
  'Personal',
  'Contact',
  'Address',
  'Employment',
  'Financial',
  'Documents',
  'Other',
] as const;

const NATIVE_UI_FIELDS = [
  { id: 'pan_number', name: 'PAN Number', dataType: 'STRING' as const },
  { id: 'aadhaar_number', name: 'Aadhaar Number', dataType: 'STRING' as const },
  { id: 'mobile_number', name: 'Mobile Number', dataType: 'STRING' as const },
  { id: 'email_address', name: 'Email Address', dataType: 'STRING' as const },
  { id: 'full_name', name: 'Full Name', dataType: 'STRING' as const },
  { id: 'date_of_birth', name: 'Date Of Birth', dataType: 'DATE' as const },
  { id: 'annual_income', name: 'Annual Income', dataType: 'NUMBER' as const },
  { id: 'loan_amount', name: 'Requested Loan Amount', dataType: 'NUMBER' as const },
  { id: 'employment_type', name: 'Employment Type', dataType: 'STRING' as const },
  { id: 'accept_terms', name: 'Terms Accepted', dataType: 'BOOLEAN' as const },
];

type UIFieldDataType = (typeof UI_DATA_TYPE_OPTIONS)[number];
type UIFieldSource = 'native' | 'custom';

interface UIFieldDraft {
  source: UIFieldSource;
  nativeFieldId: string;
  fieldName: string;
  dataType: UIFieldDataType;
  description: string;
  category: string;
  alias: string;
  required: boolean;
}

const getDefaultUIFieldDraft = (source: UIFieldSource = 'native'): UIFieldDraft => ({
  source,
  nativeFieldId: '',
  fieldName: '',
  dataType: 'STRING',
  description: '',
  category: UI_CATEGORY_OPTIONS[0],
  alias: '',
  required: false,
});

const mapDataTypeToInputType = (dataType: UIFieldDataType): FormInputField['type'] => {
  switch (dataType) {
    case 'NUMBER':
      return 'number';
    case 'DATE':
      return 'date';
    default:
      return 'text';
  }
};

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

  const canEditName = block.type === 'form' || block.type === 'end' || block.type === 'merge';
  const canEditDescription = block.type === 'form' || block.type === 'end' || block.type === 'merge';
  const hasProvider = block.type === 'smart' && block.provider;
  const hasUserInput = block.type === 'form';
  const hasChecks = block.type === 'smart' && block.checks && block.checks.length > 0;
  const hasGeneralConfig = block.generalConfig && block.generalConfig.length > 0;
  const hasUIConfig = block.pages && block.pages.length > 0;
  const showUIConfigSection = block.type === 'smart' || block.type === 'form' || block.type === 'end';
  const hasRetry = block.type === 'smart' && Boolean(block.hasRetry || block.retryConfig);

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
      case 'merge':
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

  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [expandedRoutingIds, setExpandedRoutingIds] = useState<Record<string, boolean>>({});
  const [activeFieldModalPageId, setActiveFieldModalPageId] = useState<string | null>(null);
  const [uiFieldDraft, setUIFieldDraft] = useState<UIFieldDraft>(getDefaultUIFieldDraft());
  const [editingField, setEditingField] = useState<{ pageId: string; fieldId: string } | null>(null);

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

  const updateUIFieldDraft = (updates: Partial<UIFieldDraft>) => {
    setUIFieldDraft((prev) => ({ ...prev, ...updates }));
  };

  const openAddFieldForm = (pageId: string) => {
    setActiveFieldModalPageId(pageId);
    setUIFieldDraft(getDefaultUIFieldDraft('native'));
    setEditingField(null);
  };

  const handleAddPageField = (pageId: string) => {
    const selectedNativeFieldByName = NATIVE_UI_FIELDS.find(
      (field) => field.name.toLowerCase() === uiFieldDraft.fieldName.trim().toLowerCase()
    );
    const selectedNativeField =
      uiFieldDraft.source === 'native'
        ? NATIVE_UI_FIELDS.find((field) => field.id === uiFieldDraft.nativeFieldId) ||
          selectedNativeFieldByName
        : undefined;

    if (uiFieldDraft.source === 'native' && !selectedNativeField) {
      return;
    }

    if (uiFieldDraft.source === 'custom' && !uiFieldDraft.fieldName.trim()) {
      return;
    }

    const newField: FormInputField = {
      id: `user-input-${Date.now()}`,
      name:
        uiFieldDraft.source === 'native'
          ? selectedNativeField!.name
          : uiFieldDraft.fieldName.trim(),
      type: mapDataTypeToInputType(uiFieldDraft.dataType),
      dataType: uiFieldDraft.dataType,
      required: uiFieldDraft.source === 'custom' ? uiFieldDraft.required : false,
      fieldSource: uiFieldDraft.source,
      description: uiFieldDraft.source === 'custom' ? uiFieldDraft.description.trim() : '',
      category: uiFieldDraft.source === 'custom' ? uiFieldDraft.category : '',
      alias: uiFieldDraft.source === 'custom' ? uiFieldDraft.alias.trim() : '',
    };

    const updatedPages = (block.pages || []).map((page) =>
      page.id === pageId
        ? {
            ...page,
            userInputs: [...page.userInputs, newField],
          }
        : page
    );

    onSave({ ...block, pages: updatedPages });
    setUIFieldDraft(getDefaultUIFieldDraft('native'));
    setActiveFieldModalPageId(null);
  };

  const handleDeletePageField = (pageId: string, fieldId: string) => {
    const updatedPages = (block.pages || []).map((page) =>
      page.id === pageId
        ? {
            ...page,
            userInputs: page.userInputs.filter((field) => field.id !== fieldId),
          }
        : page
    );
    onSave({ ...block, pages: updatedPages });
    setEditingField((prev) =>
      prev && prev.pageId === pageId && prev.fieldId === fieldId ? null : prev
    );
  };

  const startEditingField = (pageId: string, field: FormInputField) => {
    setActiveFieldModalPageId(pageId);
    setEditingField({ pageId, fieldId: field.id });
    setUIFieldDraft({
      source: field.fieldSource || 'custom',
      nativeFieldId:
        field.fieldSource === 'native'
          ? NATIVE_UI_FIELDS.find((nativeField) => nativeField.name === field.name)?.id || ''
          : '',
      fieldName: field.name,
      dataType: (field.dataType as UIFieldDataType) || 'STRING',
      description: field.description || '',
      category: field.category || UI_CATEGORY_OPTIONS[0],
      alias: field.alias || '',
      required: field.required,
    });
  };

  const handleSaveEditedField = () => {
    if (!editingField) {
      return;
    }

    const selectedNativeFieldByName = NATIVE_UI_FIELDS.find(
      (field) => field.name.toLowerCase() === uiFieldDraft.fieldName.trim().toLowerCase()
    );
    const selectedNativeField =
      uiFieldDraft.source === 'native'
        ? NATIVE_UI_FIELDS.find((field) => field.id === uiFieldDraft.nativeFieldId) ||
          selectedNativeFieldByName
        : undefined;

    if (uiFieldDraft.source === 'native' && !selectedNativeField) {
      return;
    }

    if (uiFieldDraft.source === 'custom' && !uiFieldDraft.fieldName.trim()) {
      return;
    }

    const updatedPages = (block.pages || []).map((page) => {
      if (page.id !== editingField.pageId) {
        return page;
      }

      return {
        ...page,
        userInputs: page.userInputs.map((field) => {
          if (field.id !== editingField.fieldId) {
            return field;
          }

          return {
            ...field,
            name:
              uiFieldDraft.source === 'native'
                ? selectedNativeField!.name
                : uiFieldDraft.fieldName.trim(),
            type: mapDataTypeToInputType(uiFieldDraft.dataType),
            dataType: uiFieldDraft.dataType,
            required: uiFieldDraft.source === 'custom' ? uiFieldDraft.required : false,
            fieldSource: uiFieldDraft.source,
            description: uiFieldDraft.source === 'custom' ? uiFieldDraft.description.trim() : '',
            category: uiFieldDraft.source === 'custom' ? uiFieldDraft.category : '',
            alias: uiFieldDraft.source === 'custom' ? uiFieldDraft.alias.trim() : '',
          };
        }),
      };
    });

    onSave({ ...block, pages: updatedPages });
    setEditingField(null);
    setActiveFieldModalPageId(null);
    setUIFieldDraft(getDefaultUIFieldDraft('native'));
  };

  const cancelPageFieldForm = () => {
    setActiveFieldModalPageId(null);
    setEditingField(null);
    setUIFieldDraft(getDefaultUIFieldDraft('native'));
  };

  const handleRegeneratePage = (_pageId: string) => {
    // Placeholder action hook for regeneration flow.
  };

  const handleNativeFieldNameChange = (value: string) => {
    const matchedField = NATIVE_UI_FIELDS.find(
      (field) => field.name.toLowerCase() === value.trim().toLowerCase()
    );

    updateUIFieldDraft({
      fieldName: value,
      nativeFieldId: matchedField?.id || '',
      dataType: matchedField?.dataType || uiFieldDraft.dataType,
    });
  };

  const modalPageId = editingField?.pageId || activeFieldModalPageId;
  const isFieldDialogOpen = Boolean(modalPageId);

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
                )}

                {/* UI Configuration */}
                {showUIConfigSection && (
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
                        <p className="text-sm text-gray-600">
                          Configure fields under each predefined page.
                        </p>

                        <div className="space-y-2">
                          {block.pages!.map((page, index) => {
                            const predefinedInputs = page.userInputs.filter((input) => !input.fieldSource);
                            const addedInputs = page.userInputs.filter((input) => Boolean(input.fieldSource));

                            return (
                              <div key={page.id} className="border rounded">
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegeneratePage(page.id);
                                    }}
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Re-generate Page
                                  </Button>
                                </button>

                                {expandedPageId === page.id && (
                                  <div className="p-3 pt-0 space-y-4 border-t">
                                    <div>
                                      <Label className="text-xs text-gray-700">Page Name</Label>
                                      <div className="mt-1 text-sm font-medium">{page.name}</div>
                                    </div>

                                    <div>
                                      <Label className="text-xs text-gray-700">Action</Label>
                                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                        {page.action}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-700">Predefined Fields</Label>
                                        <Badge variant="outline" className="text-[10px]">Read only</Badge>
                                      </div>
                                      <div className="space-y-2">
                                        {predefinedInputs.length > 0 ? (
                                          predefinedInputs.map((input) => (
                                            <div key={input.id} className="flex items-center gap-2 text-sm">
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
                                            No predefined fields
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-xs text-gray-700">Added Fields</Label>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => openAddFieldForm(page.id)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Field
                                        </Button>
                                      </div>

                                      <div className="space-y-2">
                                        {addedInputs.length > 0 ? (
                                          addedInputs.map((input) => {
                                            const sourceLabel = input.fieldSource === 'native' ? 'Native' : 'Custom';

                                            return (
                                              <div key={input.id} className="border rounded p-2 bg-white space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                  <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className="text-sm font-medium">{input.name}</span>
                                                      <Badge
                                                        variant="outline"
                                                        className={
                                                          input.fieldSource === 'native'
                                                            ? 'text-xs bg-sky-50 text-sky-700 border-sky-200'
                                                            : 'text-xs bg-violet-50 text-violet-700 border-violet-200'
                                                        }
                                                      >
                                                        {sourceLabel}
                                                      </Badge>
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
                                                    {input.fieldSource === 'custom' && (
                                                      <div className="text-xs text-gray-600 space-y-0.5">
                                                        {input.alias && <p>Alias: {input.alias}</p>}
                                                        {input.category && <p>Category: {input.category}</p>}
                                                        {input.description && <p>{input.description}</p>}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2"
                                                        onClick={() => startEditingField(page.id, input)}
                                                      >
                                                        <Pencil className="h-3 w-3" />
                                                      </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-7 px-2 text-red-600 hover:text-red-700"
                                                      onClick={() => handleDeletePageField(page.id, input.id)}
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-sm text-gray-500 italic">
                                            No added fields
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <Dialog open={isFieldDialogOpen} onOpenChange={(open) => !open && cancelPageFieldForm()}>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>{editingField ? 'Edit Field' : 'Add Field'}</DialogTitle>
                              <DialogDescription>
                                Configure field details for this page.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Field Source</Label>
                                <Select
                                  value={uiFieldDraft.source}
                                  onValueChange={(value: UIFieldSource) =>
                                    setUIFieldDraft(getDefaultUIFieldDraft(value))
                                  }
                                >
                                  <SelectTrigger className="h-8 text-sm mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="native">Native</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {uiFieldDraft.source === 'native' ? (
                                <>
                                  <div>
                                    <Label className="text-xs">Native Field</Label>
                                    <Input
                                      className="h-8 text-sm mt-1"
                                      value={uiFieldDraft.fieldName}
                                      onChange={(e) => handleNativeFieldNameChange(e.target.value)}
                                      placeholder="Search and select native field..."
                                      list="native-field-options"
                                    />
                                    <datalist id="native-field-options">
                                      {NATIVE_UI_FIELDS.map((field) => (
                                        <option key={field.id} value={field.name} />
                                      ))}
                                    </datalist>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Data Type</Label>
                                    <Select
                                      value={uiFieldDraft.dataType}
                                      onValueChange={(value: UIFieldDataType) =>
                                        updateUIFieldDraft({ dataType: value })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-sm mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UI_DATA_TYPE_OPTIONS.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <Label className="text-xs">Field Name</Label>
                                    <Input
                                      className="h-8 text-sm mt-1"
                                      value={uiFieldDraft.fieldName}
                                      onChange={(e) => updateUIFieldDraft({ fieldName: e.target.value })}
                                      placeholder="Enter field name"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Data Type</Label>
                                    <Select
                                      value={uiFieldDraft.dataType}
                                      onValueChange={(value: UIFieldDataType) =>
                                        updateUIFieldDraft({ dataType: value })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-sm mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UI_DATA_TYPE_OPTIONS.map((option) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                      rows={2}
                                      className="text-sm mt-1"
                                      value={uiFieldDraft.description}
                                      onChange={(e) => updateUIFieldDraft({ description: e.target.value })}
                                      placeholder="Enter description"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Category</Label>
                                    <Select
                                      value={uiFieldDraft.category}
                                      onValueChange={(value) => updateUIFieldDraft({ category: value })}
                                    >
                                      <SelectTrigger className="h-8 text-sm mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {UI_CATEGORY_OPTIONS.map((category) => (
                                          <SelectItem key={category} value={category}>
                                            {category}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Alias</Label>
                                    <Input
                                      className="h-8 text-sm mt-1"
                                      value={uiFieldDraft.alias}
                                      onChange={(e) => updateUIFieldDraft({ alias: e.target.value })}
                                      placeholder="Enter alias"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between rounded border bg-white px-3 py-2">
                                    <Label className="text-xs">Required field</Label>
                                    <Switch
                                      checked={uiFieldDraft.required}
                                      onCheckedChange={(value) => updateUIFieldDraft({ required: value })}
                                    />
                                  </div>
                                </>
                              )}
                            </div>

                            <DialogFooter>
                              <Button variant="outline" size="sm" onClick={cancelPageFieldForm}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  editingField
                                    ? handleSaveEditedField()
                                    : modalPageId
                                      ? handleAddPageField(modalPageId)
                                      : null
                                }
                              >
                                {editingField ? 'Save Changes' : 'Save Field'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
