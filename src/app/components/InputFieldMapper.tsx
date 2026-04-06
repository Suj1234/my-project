import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import type { ApiRequestField } from '../data/apiCatalog';
import type {
  InputMapping, InputSourceType,
  ExtractionType, ExtractionConfig, AggregationType,
  TransformationType, TransformationStep,
} from '../types/journey';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const NATIVE_FIELDS = [
  { key: 'first_name',     label: 'First Name' },
  { key: 'last_name',      label: 'Last Name' },
  { key: 'dob',            label: 'Date of Birth' },
  { key: 'gender',         label: 'Gender' },
  { key: 'pan_number',     label: 'PAN Number' },
  { key: 'aadhaar_number', label: 'Aadhaar Number' },
  { key: 'mobile',         label: 'Mobile Number' },
  { key: 'email',          label: 'Email' },
  { key: 'pincode',        label: 'Pincode' },
];

export interface AvailableField {
  storeName: string;
  label: string;
  isArray: boolean;
}

const EXTRACTION_TYPES: { value: ExtractionType; label: string }[] = [
  { value: 'none',                   label: 'None — use value directly' },
  { value: 'json_path',              label: 'JSON / Object — navigate to sub-field' },
  { value: 'array_index',            label: 'Array — get item at specific index' },
  { value: 'array_first',            label: 'Array — first item' },
  { value: 'array_last',             label: 'Array — last item' },
  { value: 'array_aggregate',        label: 'Array — aggregate (max / min / sum / count...)' },
  { value: 'array_filter_aggregate', label: 'Array — filter first, then aggregate' },
  { value: 'regex_extract',          label: 'String — extract via regex pattern' },
  { value: 'string_split',           label: 'String — split by delimiter, take part' },
  { value: 'date_component',         label: 'Date — extract year / month / day / hour...' },
];

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'first',  label: 'First item' },
  { value: 'last',   label: 'Last item' },
  { value: 'max',    label: 'Maximum value' },
  { value: 'min',    label: 'Minimum value' },
  { value: 'sum',    label: 'Sum (total)' },
  { value: 'count',  label: 'Count of items' },
  { value: 'all',    label: 'All values (as list)' },
  { value: 'unique', label: 'Unique values only' },
  { value: 'join',   label: 'Join as single string' },
];

const TRANSFORM_TYPES: { value: TransformationType; label: string }[] = [
  { value: 'trim',             label: 'Trim whitespace' },
  { value: 'uppercase',        label: 'Uppercase' },
  { value: 'lowercase',        label: 'Lowercase' },
  { value: 'replace',          label: 'Find & Replace' },
  { value: 'regex_extract',    label: 'Regex extract' },
  { value: 'to_number',        label: 'Convert to number' },
  { value: 'round',            label: 'Round number' },
  { value: 'default_if_empty', label: 'Default if empty' },
  { value: 'timezone_convert', label: 'Convert timezone' },
  { value: 'date_format',      label: 'Format date' },
  { value: 'join',             label: 'Join array into string' },
  { value: 'unique',           label: 'Remove duplicates' },
];

const TIMEZONES = [
  'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles',
  'America/Chicago', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Singapore', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney',
];

const DATE_FORMATS = [
  'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY',
  'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DDTHH:mm:ssZ',
  'DD MMM YYYY', 'MMM DD, YYYY',
  'x (Unix milliseconds)', 'X (Unix seconds)',
];

const DATE_COMPONENTS = ['year', 'month', 'day', 'hour', 'minute', 'second'] as const;

// ─── Section label ──────────────────────────────────────────────────────────────

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{children}</span>
      {hint && <span className="text-[10px] text-gray-400 font-normal normal-case">{hint}</span>}
    </div>
  );
}

// ─── Extraction editor ──────────────────────────────────────────────────────────

function ExtractionEditor({ config, onChange }: { config: ExtractionConfig; onChange: (c: ExtractionConfig) => void }) {
  const u = (partial: Partial<ExtractionConfig>) => onChange({ ...config, ...partial });
  return (
    <div className="space-y-2 p-3 rounded-lg border bg-gray-50">
      <div>
        <Label className="text-[10px] text-gray-500 mb-1 block">Method</Label>
        <Select value={config.type} onValueChange={v => onChange({ type: v as ExtractionType })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXTRACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {config.type === 'json_path' && (
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Path (dot notation, e.g. .customer.segment)</Label>
          <Input className="h-7 text-xs font-mono" placeholder=".field.subfield" value={config.path ?? ''} onChange={e => u({ path: e.target.value })} />
        </div>
      )}

      {config.type === 'array_index' && (
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Index (0 = first item)</Label>
          <Input type="number" min={0} className="h-7 text-xs w-24" placeholder="0"
            value={config.index ?? ''} onChange={e => u({ index: parseInt(e.target.value) || 0 })} />
        </div>
      )}

      {(config.type === 'array_first' || config.type === 'array_last') && (
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Field within item (optional)</Label>
          <Input className="h-7 text-xs font-mono" placeholder="e.g. maxDPD"
            value={config.fieldPath ?? ''} onChange={e => u({ fieldPath: e.target.value })} />
        </div>
      )}

      {(config.type === 'array_aggregate' || config.type === 'array_filter_aggregate') && (
        <>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Field within item (e.g. dpdSummary.maxDPD)</Label>
            <Input className="h-7 text-xs font-mono" placeholder="fieldName or nested.path"
              value={config.fieldPath ?? ''} onChange={e => u({ fieldPath: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Aggregate function</Label>
            <Select value={config.aggregate ?? 'max'} onValueChange={v => u({ aggregate: v as AggregationType })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGGREGATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {config.type === 'array_filter_aggregate' && (
            <div>
              <Label className="text-[10px] text-gray-500 mb-1 block">Filter: only where field = value</Label>
              <div className="flex gap-1.5">
                <Input className="h-7 text-xs font-mono flex-1" placeholder="field name"
                  value={config.filterField ?? ''} onChange={e => u({ filterField: e.target.value })} />
                <span className="text-xs text-gray-400 self-center shrink-0">=</span>
                <Input className="h-7 text-xs flex-1" placeholder="value"
                  value={config.filterValue ?? ''} onChange={e => u({ filterValue: e.target.value })} />
              </div>
            </div>
          )}
        </>
      )}

      {config.type === 'regex_extract' && (
        <>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Regex pattern</Label>
            <Input className="h-7 text-xs font-mono" placeholder="e.g. (\d+)"
              value={config.pattern ?? ''} onChange={e => u({ pattern: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Capture group (0 = full match, 1 = first group)</Label>
            <Input type="number" min={0} className="h-7 text-xs w-24" placeholder="1"
              value={config.groupIndex ?? ''} onChange={e => u({ groupIndex: parseInt(e.target.value) || 0 })} />
          </div>
        </>
      )}

      {config.type === 'string_split' && (
        <>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Delimiter character</Label>
            <Input className="h-7 text-xs font-mono w-24" placeholder=","
              value={config.delimiter ?? ''} onChange={e => u({ delimiter: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Part index (0 = first part)</Label>
            <Input type="number" min={0} className="h-7 text-xs w-24" placeholder="0"
              value={config.splitIndex ?? ''} onChange={e => u({ splitIndex: parseInt(e.target.value) || 0 })} />
          </div>
        </>
      )}

      {config.type === 'date_component' && (
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Component to extract</Label>
          <Select value={config.dateComponent ?? 'year'} onValueChange={v => u({ dateComponent: v as ExtractionConfig['dateComponent'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_COMPONENTS.map(c => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ─── Single transform step ──────────────────────────────────────────────────────

function TransformRow({
  step, idx, total, onChange, onRemove, onMove,
}: {
  step: TransformationStep; idx: number; total: number;
  onChange: (s: TransformationStep) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) {
  const cfg = step.config ?? {};
  const u = (key: string, val: string) => onChange({ ...step, config: { ...cfg, [key]: val } });

  return (
    <div className="border rounded-lg p-2.5 bg-white space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-400 w-5 shrink-0 text-right">{idx + 1}.</span>
        <Select value={step.type} onValueChange={v => onChange({ ...step, type: v as TransformationType, config: {} })}>
          <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TRANSFORM_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={() => onMove('up')} disabled={idx === 0}
          className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 hover:bg-gray-100">
          <ArrowUp className="h-3 w-3" />
        </button>
        <button onClick={() => onMove('down')} disabled={idx === total - 1}
          className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 hover:bg-gray-100">
          <ArrowDown className="h-3 w-3" />
        </button>
        <button onClick={onRemove}
          className="h-6 w-6 flex items-center justify-center rounded text-red-300 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {step.type === 'replace' && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input className="h-7 text-xs" placeholder="Find text" value={cfg.find ?? ''} onChange={e => u('find', e.target.value)} />
          <Input className="h-7 text-xs" placeholder="Replace with" value={cfg.replaceWith ?? ''} onChange={e => u('replaceWith', e.target.value)} />
        </div>
      )}
      {step.type === 'regex_extract' && (
        <div className="grid grid-cols-2 gap-1.5">
          <Input className="h-7 text-xs font-mono" placeholder="Pattern e.g. (\d+)" value={cfg.pattern ?? ''} onChange={e => u('pattern', e.target.value)} />
          <Input type="number" className="h-7 text-xs" placeholder="Group (0=full)" value={cfg.group ?? ''} onChange={e => u('group', e.target.value)} />
        </div>
      )}
      {step.type === 'round' && (
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-gray-500 shrink-0">Decimal places:</Label>
          <Input type="number" min={0} max={10} className="h-7 text-xs w-20" placeholder="0" value={cfg.decimals ?? ''} onChange={e => u('decimals', e.target.value)} />
        </div>
      )}
      {step.type === 'default_if_empty' && (
        <Input className="h-7 text-xs" placeholder="Fallback value" value={cfg.fallback ?? ''} onChange={e => u('fallback', e.target.value)} />
      )}
      {step.type === 'timezone_convert' && (
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <Label className="text-[10px] text-gray-400 mb-0.5 block">From timezone</Label>
            <Select value={cfg.from ?? 'UTC'} onValueChange={v => u('from', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-gray-400 mb-0.5 block">To timezone</Label>
            <Select value={cfg.to ?? 'Asia/Kolkata'} onValueChange={v => u('to', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      )}
      {step.type === 'date_format' && (
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <Label className="text-[10px] text-gray-400 mb-0.5 block">From format</Label>
            <Select value={cfg.fromFormat ?? ''} onValueChange={v => u('fromFormat', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{DATE_FORMATS.map(f => <SelectItem key={f} value={f} className="text-xs font-mono">{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-gray-400 mb-0.5 block">To format</Label>
            <Select value={cfg.toFormat ?? ''} onValueChange={v => u('toFormat', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{DATE_FORMATS.map(f => <SelectItem key={f} value={f} className="text-xs font-mono">{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      )}
      {step.type === 'join' && (
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-gray-500 shrink-0">Delimiter:</Label>
          <Input className="h-7 text-xs w-28" placeholder=", " value={cfg.delimiter ?? ''} onChange={e => u('delimiter', e.target.value)} />
        </div>
      )}
      {/* trim, uppercase, lowercase, to_number, unique — no config needed */}
    </div>
  );
}

// ─── Public: InputFieldMapper ──────────────────────────────────────────────────

interface Props {
  field: ApiRequestField | null;
  mapping: InputMapping | null;
  availableFields: AvailableField[];
  onSave: (m: InputMapping) => void;
}

export function InputFieldMapper({ field, mapping, availableFields, onSave }: Props) {
  const [sourceType, setSourceType] = useState<InputSourceType>(mapping?.sourceType ?? 'native');
  const [sourceValue, setSourceValue] = useState(mapping?.sourceValue ?? '');
  const [extraction, setExtraction] = useState<ExtractionConfig>(mapping?.extraction ?? { type: 'none' });
  const [transforms, setTransforms] = useState<TransformationStep[]>(mapping?.transforms ?? []);

  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-center px-8">
        <p className="text-xs text-gray-400 leading-relaxed">
          ← Click any field in the request tree to configure its source, extraction, and transformations
        </p>
      </div>
    );
  }

  const SOURCE_BTNS: { value: InputSourceType; label: string }[] = [
    { value: 'native',     label: 'Native' },
    { value: 'custom',     label: 'Custom' },
    { value: 'static',     label: 'Static' },
    { value: 'api_output', label: 'API Output' },
  ];

  function addTransform() {
    setTransforms(prev => [...prev, { id: `t-${Date.now()}`, type: 'trim' as TransformationType }]);
  }
  function updateTransform(id: string, s: TransformationStep) {
    setTransforms(prev => prev.map(t => t.id === id ? s : t));
  }
  function removeTransform(id: string) {
    setTransforms(prev => prev.filter(t => t.id !== id));
  }
  function moveTransform(idx: number, dir: 'up' | 'down') {
    setTransforms(prev => {
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function handleApply() {
    onSave({
      requestPath: field.path,
      label: field.label,
      sourceType,
      sourceValue,
      extraction: extraction.type !== 'none' ? extraction : undefined,
      transforms: transforms.length > 0 ? transforms : undefined,
      isAutoMapped: false,
    });
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-5">
        {/* Field info */}
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="flex items-start justify-between gap-2">
            <code className="text-xs text-blue-700 font-semibold break-all">{field.path}</code>
            {field.isRequired && <Badge variant="destructive" className="text-[10px] shrink-0 h-4">Required</Badge>}
          </div>
          <p className="text-xs text-gray-500 mt-1">{field.label}</p>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <SectionLabel>Source</SectionLabel>
          <div className="flex gap-1.5 flex-wrap">
            {SOURCE_BTNS.map(s => (
              <button key={s.value}
                onClick={() => { setSourceType(s.value); setSourceValue(''); }}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  sourceType === s.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                }`}
              >{s.label}</button>
            ))}
          </div>

          {sourceType === 'native' && (
            <Select value={sourceValue} onValueChange={setSourceValue}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select native field…" /></SelectTrigger>
              <SelectContent>
                {NATIVE_FIELDS.map(f => (
                  <SelectItem key={f.key} value={f.key} className="text-xs">
                    {f.label} <span className="text-gray-400 font-mono ml-1">({f.key})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {sourceType === 'custom' && (
            <Input className="h-8 text-xs font-mono" placeholder="custom_field_name"
              value={sourceValue} onChange={e => setSourceValue(e.target.value)} />
          )}
          {sourceType === 'static' && (
            <Input className="h-8 text-xs" placeholder="Enter a static value"
              value={sourceValue} onChange={e => setSourceValue(e.target.value)} />
          )}
          {sourceType === 'api_output' && (
            availableFields.length > 0 ? (
              <Select value={sourceValue} onValueChange={setSourceValue}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select captured field…" /></SelectTrigger>
                <SelectContent>
                  {availableFields.map(f => (
                    <SelectItem key={f.storeName} value={f.storeName} className="text-xs">
                      <span className="font-mono">{f.storeName}</span>
                      {f.isArray && <span className="ml-1.5 text-purple-500 text-[10px]">[array]</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                No captured fields available in this block. Configure API output captures in other event slots first.
              </p>
            )
          )}
        </div>

        {/* Extraction */}
        <div className="space-y-2">
          <SectionLabel hint="optional — drill into complex source values">Extraction</SectionLabel>
          <ExtractionEditor config={extraction} onChange={setExtraction} />
        </div>

        {/* Transformations */}
        <div className="space-y-2">
          <SectionLabel hint="optional — applied in order shown">Transformations</SectionLabel>
          {transforms.length === 0
            ? <p className="text-xs text-gray-400 italic">No transformations configured.</p>
            : <div className="space-y-2">
                {transforms.map((step, idx) => (
                  <TransformRow key={step.id} step={step} idx={idx} total={transforms.length}
                    onChange={s => updateTransform(step.id, s)}
                    onRemove={() => removeTransform(step.id)}
                    onMove={dir => moveTransform(idx, dir)} />
                ))}
              </div>
          }
          <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={addTransform}>
            <Plus className="h-3 w-3 mr-1" /> Add transformation step
          </Button>
        </div>

        {/* Apply */}
        <Button className="w-full text-xs" size="sm" onClick={handleApply} disabled={!sourceValue.trim()}>
          Apply Mapping ✓
        </Button>
      </div>
    </ScrollArea>
  );
}
