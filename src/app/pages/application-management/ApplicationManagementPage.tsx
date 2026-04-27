import { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, X, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '../../components/ui/command';
import { applicationsApi, programsApi } from '../../services/mockApi';
import type { Program, ProgramIdentifier, IdentifierType } from '../../types/program';

// ---------------------------------------------------------------------------
// Flow variant — dev-only toggle, remove before production
// ---------------------------------------------------------------------------
type FlowVariant = 'A' | 'B' | 'C' | 'D' | 'E';

const FLOW_LABELS: Record<FlowVariant, string> = {
  A: 'A — Fixed types',
  B: 'B — Free text',
  C: 'C — Program types',
  D: 'D — Value only',
  E: 'E — Type + Value',
};

// Flows that show the program selection step
const PROGRAM_FLOWS: FlowVariant[] = ['A', 'B', 'C'];
// Flows that require an identifier type to be chosen
const TYPE_FLOWS: FlowVariant[] = ['A', 'E'];

// ---------------------------------------------------------------------------
// Fixed identifier types (Flow A & E)
// ---------------------------------------------------------------------------
const FIXED_IDENTIFIERS: ProgramIdentifier[] = [
  { type: 'mobile',  label: 'Mobile Number',  placeholder: 'e.g. +91 9876543210' },
  { type: 'pan',     label: 'PAN Number',     placeholder: 'e.g. ABCDE1234F'     },
  { type: 'account', label: 'Account Number', placeholder: 'e.g. 001234567890'   },
  { type: 'aadhaar', label: 'Aadhaar Number', placeholder: 'e.g. 1234 5678 9012' },
];

// ---------------------------------------------------------------------------
// Auto-formatting per identifier type
// PAN  → uppercase, strip non-alphanumeric, cap at 10 chars
// Aadhaar → digits only, auto-space every 4 digits (display only; stripped before API)
// ---------------------------------------------------------------------------
function formatIdentifierInput(type: IdentifierType | null, raw: string): string {
  if (type === 'pan') {
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  }
  if (type === 'aadhaar') {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    // Insert space after every 4th digit, but not at the end
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const VALIDATORS: Record<IdentifierType, (v: string) => boolean> = {
  mobile:  (v) => /^\+?\d{7,15}$/.test(v.replace(/\s/g, '')),
  pan:     (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.trim().toUpperCase()),
  account: (v) => /^\d{9,18}$/.test(v.trim()),
  aadhaar: (v) => /^\d{12}$/.test(v.replace(/\s/g, '')),
};

const VALIDATION_HINTS: Record<IdentifierType, string> = {
  mobile:  'Enter a valid international mobile number (7–15 digits, optionally starting with +)',
  pan:     'Enter a valid 10-character PAN (e.g. ABCDE1234F)',
  account: 'Enter a valid account number (9–18 digits)',
  aadhaar: 'Enter a valid 12-digit Aadhaar number',
};

function validate(type: IdentifierType | null, value: string): boolean {
  if (!type) return value.trim().length > 0;
  return VALIDATORS[type](value);
}

interface Toast { message: string; type: 'success' | 'error'; }

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function FlowToggle({ value, onChange }: { value: FlowVariant; onChange: (v: FlowVariant) => void }) {
  return (
    <div className="flex items-center flex-wrap gap-2 mb-6">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Flow Variant</span>
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
        {(Object.keys(FLOW_LABELS) as FlowVariant[]).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`px-3 py-1.5 transition-colors border-r border-gray-200 last:border-0 ${
              value === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {FLOW_LABELS[v]}
          </button>
        ))}
      </div>
      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
        Dev only
      </span>
    </div>
  );
}

function StepHeader({
  number,
  label,
  subtitle,
  active,
}: {
  number: number;
  label: string;
  subtitle?: string;
  active: boolean;
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-start space-x-3">
      <span
        className={`mt-0.5 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${
          active ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        {number}
      </span>
      <div>
        <h2 className={`text-sm font-semibold ${active ? 'text-gray-800' : 'text-gray-400'}`}>{label}</h2>
        {subtitle && (
          <p className={`text-xs mt-0.5 leading-relaxed ${active ? 'text-gray-400' : 'text-gray-300'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function ApplicationManagementPage() {
  const [flow, setFlow] = useState<FlowVariant>('A');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programComboOpen, setProgramComboOpen] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [identifierType, setIdentifierType] = useState<ProgramIdentifier | null>(null);
  const [identifierValue, setIdentifierValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    programsApi.list().then((all) => {
      setPrograms(all.filter((p) => p.status === 'Active'));
      setProgramsLoading(false);
    });
  }, []);

  // Reset identifier state on program or flow change
  useEffect(() => {
    setIdentifierValue('');
    if (flow === 'C' && selectedProgram) {
      setIdentifierType(selectedProgram.supported_identifiers[0] ?? null);
    } else if (flow !== 'A' && flow !== 'E') {
      setIdentifierType(null);
    }
  }, [selectedProgram, flow]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const requiresProgram = PROGRAM_FLOWS.includes(flow);
  const requiresType    = TYPE_FLOWS.includes(flow);
  const activeType: IdentifierType | null = identifierType?.type ?? null;
  const valueError = identifierValue.length > 0 && !validate(activeType, identifierValue);
  const flowCBlocked = flow === 'C' && selectedProgram !== null && !identifierType;

  const valueInputDisabled =
    (requiresProgram && !selectedProgram) ||
    (requiresType && !identifierType)     ||
    flowCBlocked;

  const canProceed =
    (!requiresProgram || selectedProgram !== null) &&
    (!requiresType    || identifierType !== null)  &&
    !flowCBlocked                                  &&
    identifierValue.trim().length > 0              &&
    !valueError;

  const handleDelete = async () => {
    if (!canProceed) return;
    setLoading(true);
    try {
      // Strip display-only spaces (e.g. Aadhaar "1234 5678 9012" → "123456789012")
      const rawValue = identifierValue.replace(/\s/g, '').trim();
      const result = await applicationsApi.deleteByIdentifier(rawValue);
      setShowConfirm(false);
      setIdentifierValue('');
      if (flow !== 'C' && flow !== 'E') setIdentifierType(null);
      showToast(
        result.deleted_count > 0
          ? `Successfully deleted ${result.deleted_count} application(s)${selectedProgram ? ` from ${selectedProgram.program_name}` : ''}`
          : 'No applications found for the provided identifier',
        result.deleted_count > 0 ? 'success' : 'error',
      );
    } catch {
      showToast('Error deleting applications. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (raw: string) => {
    setIdentifierValue(formatIdentifierInput(activeType, raw));
  };

  const currentPlaceholder =
    flow === 'B' || flow === 'D'
      ? 'Enter identifier value'
      : identifierType?.placeholder ?? 'Select an application identifier first';

  const identifierStepNumber = requiresProgram ? 2 : 1;
  const identifierStepLabel =
    flow === 'B' || flow === 'D'
      ? 'Enter Application Identifier Value'
      : 'Select Application Identifier & Enter Value';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm ${
            toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
            : <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />}
          <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Application Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Delete all applications linked to a unique identifier
            {requiresProgram ? ' within a selected program' : ''}.
          </p>
        </div>

        {/* Flow toggle (dev-only) */}
        <FlowToggle
          value={flow}
          onChange={(v) => {
            setFlow(v);
            setSelectedProgram(null);
            setIdentifierType(null);
            setIdentifierValue('');
          }}
        />

        {/* Step 1 — Program selection (Flows A, B, C only) */}
        {requiresProgram && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
            <StepHeader number={1} label="Select Program" active />
            <div className="p-6">
              {programsLoading ? (
                <p className="text-sm text-gray-400">Loading programs…</p>
              ) : programs.length === 0 ? (
                <p className="text-sm text-amber-700">No active programs available. Contact your administrator.</p>
              ) : (
                <Popover open={programComboOpen} onOpenChange={setProgramComboOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={programComboOpen}
                      className="flex h-9 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                    >
                      <span className={selectedProgram ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedProgram
                          ? `${selectedProgram.program_name} — ${selectedProgram.program_code}`
                          : 'Select a program…'}
                      </span>
                      <ChevronsUpDown size={14} className="shrink-0 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0"
                    align="start"
                    style={{ width: 'var(--radix-popover-trigger-width)' }}
                  >
                    <Command>
                      <CommandInput placeholder="Search by name or code…" />
                      <CommandList>
                        <CommandEmpty>No programs found.</CommandEmpty>
                        <CommandGroup>
                          {programs.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.program_name} ${p.program_code}`}
                              onSelect={() => {
                                setSelectedProgram(selectedProgram?.id === p.id ? null : p);
                                setProgramComboOpen(false);
                              }}
                            >
                              <Check
                                size={14}
                                className={`mr-2 shrink-0 text-blue-500 ${
                                  selectedProgram?.id === p.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <span className="font-medium">{p.program_name}</span>
                              <span className="ml-1.5 text-xs text-gray-400">— {p.program_code}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        )}

        {/* Step 2 / 1 — Identifier capture */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <StepHeader
            number={identifierStepNumber}
            label={identifierStepLabel}
            subtitle="The unique attribute used to identify and match an applicant's applications. Selecting the correct type ensures only the intended applicant's records are targeted."
            active={!requiresProgram || !!selectedProgram}
          />
          <div className="p-6 space-y-4">

            {/* Application Identifier dropdown — Flows A and E (fixed list) */}
            {(flow === 'A' || flow === 'E') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Application Identifier</label>
                <Select
                  value={identifierType?.type ?? ''}
                  onValueChange={(val) => {
                    setIdentifierType(FIXED_IDENTIFIERS.find((x) => x.type === val) ?? null);
                    setIdentifierValue('');
                  }}
                  disabled={flow === 'A' && !selectedProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select application identifier" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIXED_IDENTIFIERS.map((opt) => (
                      <SelectItem key={opt.type} value={opt.type}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Auto-selected identifier badge — Flow C */}
            {flow === 'C' && selectedProgram && identifierType && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Application Identifier</label>
                <div className="flex items-center space-x-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-800">{identifierType.label}</span>
                  <span className="text-xs text-blue-400">(auto-selected from program config)</span>
                </div>
              </div>
            )}

            {/* Flow C — program has no identifiers configured */}
            {flow === 'C' && selectedProgram && !identifierType && (
              <div className="flex items-start space-x-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This program has no identifier types configured. Contact your administrator.
                </p>
              </div>
            )}

            {/* Value input */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Application Identifier Value
              </label>
              <Input
                type="text"
                value={identifierValue}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={currentPlaceholder}
                disabled={valueInputDisabled}
                className={`font-mono tracking-wide ${valueError ? 'border-red-400 focus-visible:ring-red-300' : ''} ${
                  valueInputDisabled ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              {valueError && activeType && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center space-x-1">
                  <AlertTriangle size={11} />
                  <span>{VALIDATION_HINTS[activeType]}</span>
                </p>
              )}
              {requiresProgram && !selectedProgram && (
                <p className="text-xs text-gray-400 mt-1.5">Select a program above to enable this field.</p>
              )}
              {requiresType && !identifierType && (requiresProgram ? !!selectedProgram : true) && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Select an application identifier above to enable this field.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Warning + Delete action */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={17} />
              <div>
                <p className="text-sm font-semibold text-red-800">This action is permanent and irreversible</p>
                <p className="text-xs text-red-700 mt-0.5">
                  All applications linked to the provided identifier will be permanently deleted.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!canProceed}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-11 text-sm font-medium disabled:opacity-50"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Applications
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 mb-5 text-sm">
              {selectedProgram && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-gray-500">Program</span>
                  <span className="font-medium text-gray-900">{selectedProgram.program_name}</span>
                </div>
              )}
              {identifierType && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-gray-500">Application Identifier</span>
                  <span className="font-medium text-gray-900">{identifierType.label}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-500">Identifier Value</span>
                <span className="font-mono font-semibold text-gray-900">{identifierValue}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mb-5">
              All applications matching this identifier
              {selectedProgram ? <> in <strong>{selectedProgram.program_name}</strong></> : ''}
              {' '}will be permanently removed.
            </p>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={15} className="mr-2" />
                {loading ? 'Deleting…' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
