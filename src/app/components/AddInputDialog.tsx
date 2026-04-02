import { useState, useRef, useEffect } from 'react';
import { FormInputField, ValidationRule, ValidationType } from '../types/journey';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Search, X, Plus, Trash2, Lock, ChevronDown } from 'lucide-react';

// ─── Backend field registry ─────────────────────────────────────────────────

type DataType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE';

interface BackendField {
  id: string;
  key: string;            // e.g. "pan_number"
  fullKey: string;        // e.g. "pan.pan_number"
  label: string;          // default display label
  dataType: DataType;
  source: 'native' | 'custom';
  category?: string;      // e.g. "PAN", "Aadhaar"
}

const BACKEND_FIELDS: BackendField[] = [
  // Native — PAN
  { id: 'n_pan_number',    key: 'pan_number',      fullKey: 'pan.pan_number',      label: 'PAN Number',          dataType: 'STRING',  source: 'native', category: 'PAN' },
  { id: 'n_pan_name',      key: 'name_on_pan',     fullKey: 'pan.name_on_pan',     label: 'Name on PAN',         dataType: 'STRING',  source: 'native', category: 'PAN' },
  { id: 'n_pan_dob',       key: 'pan_dob',         fullKey: 'pan.dob',             label: 'Date of Birth (PAN)', dataType: 'DATE',    source: 'native', category: 'PAN' },
  // Native — Aadhaar
  { id: 'n_aadhaar_uid',   key: 'aadhaar_uid',     fullKey: 'aadhaar.uid',         label: 'Aadhaar Number',      dataType: 'STRING',  source: 'native', category: 'Aadhaar' },
  { id: 'n_aadhaar_name',  key: 'aadhaar_name',    fullKey: 'aadhaar.name',        label: 'Name on Aadhaar',     dataType: 'STRING',  source: 'native', category: 'Aadhaar' },
  { id: 'n_aadhaar_dob',   key: 'aadhaar_dob',     fullKey: 'aadhaar.dob',         label: 'Date of Birth (Aadhaar)', dataType: 'DATE', source: 'native', category: 'Aadhaar' },
  { id: 'n_aadhaar_gender',key: 'aadhaar_gender',  fullKey: 'aadhaar.gender',      label: 'Gender',              dataType: 'STRING',  source: 'native', category: 'Aadhaar' },
  // Native — Contact
  { id: 'n_mobile',        key: 'mobile_number',   fullKey: 'contact.mobile',      label: 'Mobile Number',       dataType: 'STRING',  source: 'native', category: 'Contact' },
  { id: 'n_email',         key: 'email_address',   fullKey: 'contact.email',       label: 'Email Address',       dataType: 'STRING',  source: 'native', category: 'Contact' },
  // Native — Financial
  { id: 'n_annual_income', key: 'annual_income',   fullKey: 'financial.annual_income', label: 'Annual Income',  dataType: 'NUMBER',  source: 'native', category: 'Financial' },
  { id: 'n_loan_amount',   key: 'loan_amount',     fullKey: 'financial.loan_amount',   label: 'Requested Loan Amount', dataType: 'NUMBER', source: 'native', category: 'Financial' },
  // Native — eSign
  { id: 'n_esign_accepted', key: 'esign_accepted', fullKey: 'esign.accepted',      label: 'eSign Accepted',      dataType: 'BOOLEAN', source: 'native', category: 'eSign' },
  // Custom fields
  { id: 'c_applicant_type', key: 'applicant_type', fullKey: 'custom.applicant_type', label: 'Applicant Type',   dataType: 'STRING',  source: 'custom', category: 'Custom' },
  { id: 'c_employer_name',  key: 'employer_name',  fullKey: 'custom.employer_name',  label: 'Employer Name',    dataType: 'STRING',  source: 'custom', category: 'Custom' },
  { id: 'c_poi_number',     key: 'poi_number',     fullKey: 'custom.poi_number',     label: 'POI Number',       dataType: 'STRING',  source: 'custom', category: 'Custom' },
  { id: 'c_loan_purpose',   key: 'loan_purpose',   fullKey: 'custom.loan_purpose',   label: 'Loan Purpose',     dataType: 'STRING',  source: 'custom', category: 'Custom' },
  { id: 'c_consent',        key: 'user_consent',   fullKey: 'custom.user_consent',   label: 'User Consent',     dataType: 'BOOLEAN', source: 'custom', category: 'Custom' },
];

const VALIDATION_TYPES: { value: ValidationType; label: string; placeholder: string }[] = [
  { value: 'regex',         label: 'Regex',         placeholder: 'e.g. ^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
  { value: 'min_length',    label: 'Min Length',    placeholder: 'e.g. 5' },
  { value: 'max_length',    label: 'Max Length',    placeholder: 'e.g. 100' },
  { value: 'min_date',      label: 'Min Date',      placeholder: 'e.g. 1900-01-01' },
  { value: 'max_date',      label: 'Max Date',      placeholder: 'e.g. 2099-12-31' },
  { value: 'boolean_match', label: 'Boolean Match', placeholder: 'true or false' },
  { value: 'api',           label: 'API',           placeholder: 'https://api.example.com/validate' },
  { value: 'is_in_list',    label: 'Is In List',    placeholder: 'value1, value2, value3' },
  { value: 'not_allowed',   label: 'Not Allowed',   placeholder: 'Pattern or value to block' },
];

const dataTypeToInputType = (dt: DataType): FormInputField['type'] => {
  if (dt === 'NUMBER') return 'number';
  if (dt === 'DATE') return 'date';
  return 'text';
};

// ─── Field search dropdown ───────────────────────────────────────────────────

interface FieldSearchProps {
  value: BackendField | null;
  onChange: (field: BackendField | null) => void;
}

function FieldSearch({ value, onChange }: FieldSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = BACKEND_FIELDS.filter((f) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      f.label.toLowerCase().includes(q) ||
      f.key.toLowerCase().includes(q) ||
      f.fullKey.toLowerCase().includes(q) ||
      (f.category || '').toLowerCase().includes(q)
    );
  });

  const nativeFields = filtered.filter((f) => f.source === 'native');
  const customFields = filtered.filter((f) => f.source === 'custom');

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chip */}
      {value ? (
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
          <span className={`h-2 w-2 rounded-full shrink-0 ${value.source === 'native' ? 'bg-blue-500' : 'bg-purple-500'}`} />
          <span className="text-sm font-medium flex-1">{value.label}</span>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${value.source === 'native' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
            {value.source === 'native' ? 'NATIVE' : 'CUSTOM'}
          </Badge>
          <code className="text-[10px] text-gray-400 shrink-0">{value.key}</code>
          <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 shrink-0">{value.dataType}</Badge>
          <button className="text-gray-400 hover:text-red-500 shrink-0" onClick={(e) => { e.stopPropagation(); onChange(null); setQuery(''); }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* Empty state — search box */
        <div
          className="flex items-center gap-2 border rounded-lg px-3 py-2.5 bg-white cursor-text hover:border-blue-300 transition-colors"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400"
            placeholder="Search native or custom fields…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {query && (
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setQuery('')}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        </div>
      )}

      {/* Dropdown */}
      {open && !value && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {nativeFields.length === 0 && customFields.length === 0 ? (
            <div className="p-4 text-sm text-center text-gray-400">No matching fields</div>
          ) : (
            <>
              {/* Native section */}
              {nativeFields.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Native Fields</span>
                    <span className="text-[10px] text-gray-400 ml-auto">Platform built-in</span>
                  </div>
                  {nativeFields.map((f) => (
                    <button
                      key={f.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors group"
                      onClick={() => { onChange(f); setOpen(false); setQuery(''); }}
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{f.label}</span>
                          <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500">{f.dataType}</Badge>
                        </div>
                        <code className="text-[10px] text-blue-500">{f.fullKey}</code>
                      </div>
                      {f.category && <span className="text-[10px] text-gray-400 shrink-0">{f.category}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom section */}
              {customFields.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Custom Fields</span>
                    <span className="text-[10px] text-gray-400 ml-auto">Your org's fields</span>
                  </div>
                  {customFields.map((f) => (
                    <button
                      key={f.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-purple-50 transition-colors group"
                      onClick={() => { onChange(f); setOpen(false); setQuery(''); }}
                    >
                      <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{f.label}</span>
                          <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500">{f.dataType}</Badge>
                        </div>
                        <code className="text-[10px] text-purple-500">{f.fullKey}</code>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Validation Rows ─────────────────────────────────────────────────────────

interface ValidationEditorProps {
  rules: ValidationRule[];
  onChange: (rules: ValidationRule[]) => void;
}

function ValidationEditor({ rules, onChange }: ValidationEditorProps) {
  const addRule = () => {
    onChange([
      ...rules,
      { id: `vr-${Date.now()}`, type: 'regex', value: '', errorMessage: '' },
    ]);
  };

  const updateRule = (id: string, patch: Partial<ValidationRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  const getPlaceholder = (type: ValidationType) =>
    VALIDATION_TYPES.find((v) => v.value === type)?.placeholder ?? '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-gray-700">Validations</Label>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={addRule}>
          <Plus className="h-3 w-3 mr-1" />
          + Add
        </Button>
      </div>

      {rules.length === 0 && (
        <p className="text-xs text-gray-400 italic">No validations added</p>
      )}

      {rules.map((rule) => (
        <div key={rule.id} className="grid grid-cols-[140px_1fr_1fr_28px] gap-2 items-start">
          {/* Type */}
          <Select
            value={rule.type}
            onValueChange={(v) => updateRule(rule.id, { type: v as ValidationType, value: '' })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {VALIDATION_TYPES.map((vt) => (
                <SelectItem key={vt.value} value={vt.value}>
                  {vt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Value */}
          <input
            className="h-8 text-xs border rounded px-2 outline-none focus:ring-1 focus:ring-blue-300 w-full"
            placeholder={getPlaceholder(rule.type)}
            value={rule.value}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          />

          {/* Error message */}
          <input
            className="h-8 text-xs border rounded px-2 outline-none focus:ring-1 focus:ring-blue-300 w-full"
            placeholder="Error message…"
            value={rule.errorMessage}
            onChange={(e) => updateRule(rule.id, { errorMessage: e.target.value })}
          />

          {/* Delete */}
          <button
            className="h-8 w-7 flex items-center justify-center text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            onClick={() => removeRule(rule.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

interface AddInputDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (field: FormInputField) => void;
  existingField?: FormInputField | null;
}

export function AddInputDialog({ open, onClose, onSave, existingField }: AddInputDialogProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [label, setLabel] = useState('');
  const [selectedBackendField, setSelectedBackendField] = useState<BackendField | null>(null);
  const [required, setRequired] = useState(false);
  const [validations, setValidations] = useState<ValidationRule[]>([]);

  // Pre-fill when editing an existing field
  useEffect(() => {
    if (open && existingField) {
      setLabel(existingField.name);
      setRequired(existingField.required);
      setValidations(existingField.validations ?? []);
      // Try to find the matching backend field by key
      const match = BACKEND_FIELDS.find(
        (f) => f.key === existingField.key || f.fullKey === existingField.key
      );
      setSelectedBackendField(match ?? null);
    } else if (open && !existingField) {
      setLabel('');
      setSelectedBackendField(null);
      setRequired(false);
      setValidations([]);
    }
  }, [open, existingField]);

  // When a backend field is selected, auto-fill label if empty
  const handleFieldSelect = (field: BackendField | null) => {
    setSelectedBackendField(field);
    if (field && !label.trim()) {
      setLabel(field.label);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const canSave = label.trim() && selectedBackendField;

  const handleSave = () => {
    if (!canSave) return;
    const bf = selectedBackendField!;
    const field: FormInputField = {
      id: existingField?.id ?? `fi-${Date.now()}`,
      name: label.trim(),
      type: dataTypeToInputType(bf.dataType),
      dataType: bf.dataType,
      required,
      fieldSource: bf.source,
      key: bf.key,
      validations,
    };
    onSave(field);
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            {existingField ? 'Edit Input Field' : 'Add Input Field'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-2 py-1">

          {/* ── Step 1: Field Label ─────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Field Label
              <span className="text-gray-400 font-normal ml-1.5">— shown to the applicant</span>
            </Label>
            <input
              className="w-full h-9 border rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-shadow"
              placeholder="e.g. PAN Number, Applicant Type…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          {/* ── Step 2: Connect to Backend Field ───────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Connect to Backend Field
              <span className="text-gray-400 font-normal ml-1.5">— where this value is stored</span>
            </Label>
            <FieldSearch value={selectedBackendField} onChange={handleFieldSelect} />

            {/* Auto-filled details */}
            {selectedBackendField && (
              <div className="rounded-lg border bg-gray-50 px-3 py-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* Key */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Lock className="h-2.5 w-2.5 text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Field Key</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono bg-white border rounded px-2 py-1 text-gray-700 flex-1">
                        {selectedBackendField.key}
                      </code>
                      <Badge variant="outline" className="text-[9px] text-gray-400 border-gray-200">
                        Read-only
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Used by frontend to render the field</p>
                  </div>

                  {/* Data Type */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Lock className="h-2.5 w-2.5 text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Data Type</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono bg-white border rounded px-2 py-1 text-gray-700 flex-1">
                        {selectedBackendField.dataType}
                      </code>
                      <Badge variant="outline" className="text-[9px] text-gray-400 border-gray-200">
                        Auto-filled
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Determined by the backend field schema</p>
                  </div>
                </div>

                {/* Full key path */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${selectedBackendField.source === 'native' ? 'bg-blue-500' : 'bg-purple-500'}`}
                  />
                  <code className="text-[11px] text-gray-500">{selectedBackendField.fullKey}</code>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ml-auto ${selectedBackendField.source === 'native' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}
                  >
                    {selectedBackendField.source === 'native' ? 'NATIVE' : 'CUSTOM'}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* ── Validations ─────────────────────────────────────── */}
          <div className="border-t pt-4">
            <ValidationEditor rules={validations} onChange={setValidations} />
          </div>

          {/* ── Required ───────────────────────────────────────── */}
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 bg-white">
            <div>
              <Label className="text-sm font-medium">Required field</Label>
              <p className="text-xs text-gray-400">Applicant must fill this before proceeding</p>
            </div>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            {existingField ? 'Save Changes' : 'Add Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
