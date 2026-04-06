import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { API_CATALOG, ApiDefinition } from '../data/apiCatalog';
import { ResponseTree, CaptureSpec } from './ResponseTree';
import {
  DataHookApiBinding,
  InputMapping,
  InputSourceType,
  OutputCapture,
  TransformationStep,
  TransformationType,
} from '../types/journey';

const NATIVE_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'pan_number', label: 'PAN Number' },
  { key: 'aadhaar_number', label: 'Aadhaar Number' },
  { key: 'mobile', label: 'Mobile Number' },
  { key: 'email', label: 'Email' },
  { key: 'pincode', label: 'Pincode' },
];

const SYSTEM_FIELDS = [
  { key: 'current_timestamp_utc', label: 'Current timestamp (UTC)' },
  { key: 'application_id', label: 'Application ID' },
  { key: 'journey_id', label: 'Journey ID' },
  { key: 'block_id', label: 'Block ID' },
  { key: 'tenant_id', label: 'Tenant ID' },
  { key: 'user_id', label: 'User ID' },
];

const TRANSFORM_OPTIONS: Array<{ value: TransformationType; label: string }> = [
  { value: 'trim', label: 'Trim text' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'replace', label: 'Replace text' },
  { value: 'regex_extract', label: 'Regex extract' },
  { value: 'to_number', label: 'Convert to number' },
  { value: 'round', label: 'Round number' },
  { value: 'default_if_empty', label: 'Default if empty' },
  { value: 'timezone_convert', label: 'Timezone convert' },
  { value: 'date_format', label: 'Date format' },
  { value: 'join', label: 'Join list' },
  { value: 'unique', label: 'Unique values' },
];

function buildMappings(api: ApiDefinition): InputMapping[] {
  return api.requestFields.map((f) => ({
    requestPath: f.path,
    label: f.label,
    isAutoMapped: Boolean(f.isAutoMapped),
    sourceType: f.isSystem ? 'system' : f.autoMapSource ? f.autoMapSource.type : 'native',
    sourceValue: f.isSystem ? (f.staticValue ?? 'current_timestamp_utc') : f.autoMapSource ? f.autoMapSource.value : '',
    extractPath: '',
    transforms: [],
  }));
}

function createTransform(type: TransformationType): TransformationStep {
  return {
    id: `transform-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    config:
      type === 'replace'
        ? { from: '', to: '' }
        : type === 'regex_extract'
        ? { pattern: '', group: '0' }
        : type === 'default_if_empty'
        ? { value: '' }
        : type === 'timezone_convert'
        ? { from: 'UTC', to: 'Asia/Kolkata' }
        : type === 'date_format'
        ? { format: 'MM/DD/YYYY' }
        : type === 'join'
        ? { delimiter: ', ' }
        : type === 'round'
        ? { digits: '0' }
        : {},
  };
}

interface TransformEditorProps {
  transforms: TransformationStep[];
  onAdd: (type: TransformationType) => void;
  onChange: (id: string, field: string, value: string) => void;
  onTypeChange: (id: string, type: TransformationType) => void;
  onRemove: (id: string) => void;
}

function TransformEditor({ transforms, onAdd, onChange, onTypeChange, onRemove }: TransformEditorProps) {
  return (
    <div className="space-y-1.5">
      {transforms.map((t) => (
        <div key={t.id} className="border rounded-md p-2 bg-gray-50 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Select value={t.type} onValueChange={(v) => onTypeChange(t.id, v as TransformationType)}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSFORM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(t.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {t.type === 'replace' && (
            <div className="grid grid-cols-2 gap-1.5">
              <Input className="h-7 text-xs" placeholder="from" value={t.config?.from ?? ''} onChange={(e) => onChange(t.id, 'from', e.target.value)} />
              <Input className="h-7 text-xs" placeholder="to" value={t.config?.to ?? ''} onChange={(e) => onChange(t.id, 'to', e.target.value)} />
            </div>
          )}

          {t.type === 'regex_extract' && (
            <div className="grid grid-cols-2 gap-1.5">
              <Input className="h-7 text-xs" placeholder="pattern" value={t.config?.pattern ?? ''} onChange={(e) => onChange(t.id, 'pattern', e.target.value)} />
              <Input className="h-7 text-xs" placeholder="group index" value={t.config?.group ?? ''} onChange={(e) => onChange(t.id, 'group', e.target.value)} />
            </div>
          )}

          {t.type === 'default_if_empty' && (
            <Input className="h-7 text-xs" placeholder="default value" value={t.config?.value ?? ''} onChange={(e) => onChange(t.id, 'value', e.target.value)} />
          )}

          {t.type === 'timezone_convert' && (
            <div className="grid grid-cols-2 gap-1.5">
              <Input className="h-7 text-xs" placeholder="from TZ" value={t.config?.from ?? ''} onChange={(e) => onChange(t.id, 'from', e.target.value)} />
              <Input className="h-7 text-xs" placeholder="to TZ" value={t.config?.to ?? ''} onChange={(e) => onChange(t.id, 'to', e.target.value)} />
            </div>
          )}

          {t.type === 'date_format' && (
            <Input className="h-7 text-xs" placeholder="MM/DD/YYYY" value={t.config?.format ?? ''} onChange={(e) => onChange(t.id, 'format', e.target.value)} />
          )}

          {t.type === 'join' && (
            <Input className="h-7 text-xs" placeholder=", " value={t.config?.delimiter ?? ''} onChange={(e) => onChange(t.id, 'delimiter', e.target.value)} />
          )}

          {t.type === 'round' && (
            <Input className="h-7 text-xs" placeholder="digits" value={t.config?.digits ?? ''} onChange={(e) => onChange(t.id, 'digits', e.target.value)} />
          )}
        </div>
      ))}

      <Select onValueChange={(v) => onAdd(v as TransformationType)}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="+ Add transformation" />
        </SelectTrigger>
        <SelectContent>
          {TRANSFORM_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface AddHookDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (hook: DataHookApiBinding) => void;
}

export function AddHookDialog({ open, onClose, onSave }: AddHookDialogProps) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedApi, setSelectedApi] = useState<ApiDefinition | null>(null);
  const [mappings, setMappings] = useState<InputMapping[]>([]);
  const [captures, setCaptures] = useState<OutputCapture[]>([]);

  const [pendingCapture, setPendingCapture] = useState<Omit<CaptureSpec, 'storagePath'> | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState<'custom' | 'native' | 'none'>('custom');
  const [captureTransforms, setCaptureTransforms] = useState<TransformationStep[]>([]);
  const [extractTargetPath, setExtractTargetPath] = useState<string | null>(null);
  const [extractSampleText, setExtractSampleText] = useState('{}');
  const [extractParsedJson, setExtractParsedJson] = useState<Record<string, any> | null>(null);
  const [extractParseError, setExtractParseError] = useState<string>('');

  const capturedPaths = new Set(captures.map((c) => c.path));

  const filteredApis = useMemo(
    () =>
      API_CATALOG.filter(
        (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  function reset() {
    setStep(1);
    setSearch('');
    setSelectedApi(null);
    setMappings([]);
    setCaptures([]);
    setPendingCapture(null);
    setStoreName('');
    setStoreType('custom');
    setCaptureTransforms([]);
    setExtractTargetPath(null);
    setExtractSampleText('{}');
    setExtractParsedJson(null);
    setExtractParseError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function selectApi(api: ApiDefinition) {
    setSelectedApi(api);
    setMappings(buildMappings(api));
    setCaptures([]);
  }

  function updateMapping(path: string, updates: Partial<InputMapping>) {
    setMappings((prev) => prev.map((m) => (m.requestPath === path ? { ...m, ...updates } : m)));
  }

  function openInputExtractor(path: string) {
    setExtractTargetPath(path);
    const seed = selectedApi?.sampleResponse ? JSON.stringify(selectedApi.sampleResponse, null, 2) : '{}';
    setExtractSampleText(seed);
    try {
      const parsed = JSON.parse(seed);
      setExtractParsedJson(parsed && typeof parsed === 'object' ? parsed : {});
      setExtractParseError('');
    } catch {
      setExtractParsedJson(null);
      setExtractParseError('Invalid JSON');
    }
  }

  function parseExtractorJson(raw: string) {
    setExtractSampleText(raw);
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        setExtractParsedJson(null);
        setExtractParseError('JSON must be an object or array');
        return;
      }
      setExtractParsedJson(parsed as Record<string, any>);
      setExtractParseError('');
    } catch {
      setExtractParsedJson(null);
      setExtractParseError('Invalid JSON');
    }
  }

  function applyInputExtraction(spec: Omit<CaptureSpec, 'storagePath'>) {
    if (!extractTargetPath) return;
    updateMapping(extractTargetPath, { extractPath: spec.displayPath });
    setExtractTargetPath(null);
  }

  function addInputTransform(path: string, type: TransformationType) {
    setMappings((prev) =>
      prev.map((m) =>
        m.requestPath === path ? { ...m, transforms: [...(m.transforms ?? []), createTransform(type)] } : m
      )
    );
  }

  function updateInputTransform(path: string, id: string, field: string, value: string) {
    setMappings((prev) =>
      prev.map((m) =>
        m.requestPath === path
          ? {
              ...m,
              transforms: (m.transforms ?? []).map((t) =>
                t.id === id ? { ...t, config: { ...(t.config ?? {}), [field]: value } } : t
              ),
            }
          : m
      )
    );
  }

  function updateInputTransformType(path: string, id: string, type: TransformationType) {
    setMappings((prev) =>
      prev.map((m) =>
        m.requestPath === path
          ? { ...m, transforms: (m.transforms ?? []).map((t) => (t.id === id ? createTransform(type) : t)) }
          : m
      )
    );
  }

  function removeInputTransform(path: string, id: string) {
    setMappings((prev) =>
      prev.map((m) => (m.requestPath === path ? { ...m, transforms: (m.transforms ?? []).filter((t) => t.id !== id) } : m))
    );
  }

  function handleCaptureRequest(spec: Omit<CaptureSpec, 'storagePath'>) {
    const rawName = spec.label.toLowerCase().replace(/[^a-z0-9\s_]/g, '').trim().replace(/\s+/g, '_');
    setStoreName(rawName);
    setStoreType('custom');
    setCaptureTransforms([]);
    setPendingCapture(spec);
  }

  function addCaptureTransform(type: TransformationType) {
    setCaptureTransforms((prev) => [...prev, createTransform(type)]);
  }

  function updateCaptureTransform(id: string, field: string, value: string) {
    setCaptureTransforms((prev) => prev.map((t) => (t.id === id ? { ...t, config: { ...(t.config ?? {}), [field]: value } } : t)));
  }

  function updateCaptureTransformType(id: string, type: TransformationType) {
    setCaptureTransforms((prev) => prev.map((t) => (t.id === id ? createTransform(type) : t)));
  }

  function removeCaptureTransform(id: string) {
    setCaptureTransforms((prev) => prev.filter((t) => t.id !== id));
  }

  function confirmCapture() {
    if (!pendingCapture) return;
    const id = `capture-${Date.now()}`;
    setCaptures((prev) => [
      ...prev.filter((c) => c.path !== pendingCapture.displayPath),
      {
        id,
        path: pendingCapture.displayPath,
        label: pendingCapture.label,
        storeType,
        storeName,
        transforms: captureTransforms,
        isArrayExtract: pendingCapture.isArray,
        ...(pendingCapture.arrayOptions
          ? {
              arrayPath: pendingCapture.arrayOptions.arrayPath,
              aggregation: pendingCapture.arrayOptions.aggregate as any,
              filterField: pendingCapture.arrayOptions.filterField,
              filterValue: pendingCapture.arrayOptions.filterValue,
              latestByField: pendingCapture.arrayOptions.latestByField,
              joinDelimiter: pendingCapture.arrayOptions.joinDelimiter,
            }
          : {}),
      },
    ]);
    setPendingCapture(null);
  }

  function removeCapture(id: string) {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  }

  function handleSave() {
    if (!selectedApi) return;
    onSave({
      id: `hook-api-${Date.now()}`,
      apiId: selectedApi.id,
      apiName: selectedApi.name,
      latencyP95Ms: selectedApi.latencyP95Ms,
      inputMappings: mappings,
      outputCaptures: captures,
    });
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[96vw] max-w-[1500px] sm:max-w-[1500px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b">
          <DialogTitle className="text-sm font-semibold">Add API in Event</DialogTitle>
        </DialogHeader>

        <div className="flex border-b">
          {[
            { n: 1, label: 'Select API' },
            { n: 2, label: 'Map Inputs' },
            { n: 3, label: 'Capture Outputs' },
          ].map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-colors ${
                n === step
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : n < step
                  ? 'border-green-400 text-green-700 bg-green-50'
                  : 'border-transparent text-gray-400 bg-white'
              }`}
            >
              {n < step ? '? ' : `${n}. `}
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {step === 1 && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Select API</Label>
                  <div className="relative mb-3">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input className="pl-7 h-8 text-xs" placeholder="Search APIs..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    {filteredApis.map((api) => (
                      <div
                        key={api.id}
                        onClick={() => selectApi(api)}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          selectedApi?.id === api.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{api.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold">{api.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {api.category}
                              </Badge>
                              {api.latencyP95Ms ? (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                  p95 {api.latencyP95Ms}ms
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-500">{api.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{api.requestFields.length} input fields</p>
                          </div>
                          {selectedApi?.id === api.id && <span className="text-blue-600 font-bold text-sm">?</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {step === 2 && selectedApi && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-3">
                <div className="text-xs text-gray-500">Configure source, extraction, and transformation for each input.</div>
                <div className="space-y-2">
                  {mappings.map((m) => (
                    <div key={m.requestPath} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-700">{m.requestPath}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {m.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <Label className="text-[10px] text-gray-500">Source</Label>
                          <Select value={m.sourceType} onValueChange={(v) => updateMapping(m.requestPath, { sourceType: v as InputSourceType, sourceValue: '' })}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="native" className="text-xs">Native field</SelectItem>
                              <SelectItem value="custom" className="text-xs">Custom field</SelectItem>
                              <SelectItem value="system" className="text-xs">System config</SelectItem>
                              <SelectItem value="static" className="text-xs">Static value</SelectItem>
                              <SelectItem value="api_output" className="text-xs">Prior API output</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-4">
                          <Label className="text-[10px] text-gray-500">Source value</Label>
                          {m.sourceType === 'native' ? (
                            <Select value={m.sourceValue} onValueChange={(v) => updateMapping(m.requestPath, { sourceValue: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                {NATIVE_FIELDS.map((f) => (
                                  <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : m.sourceType === 'system' ? (
                            <Select value={m.sourceValue} onValueChange={(v) => updateMapping(m.requestPath, { sourceValue: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select system value" /></SelectTrigger>
                              <SelectContent>
                                {SYSTEM_FIELDS.map((f) => (
                                  <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input className="h-8 text-xs font-mono" value={m.sourceValue} onChange={(e) => updateMapping(m.requestPath, { sourceValue: e.target.value })} placeholder="value/path" />
                          )}
                        </div>

                        <div className="col-span-5">
                          <Label className="text-[10px] text-gray-500">Extraction</Label>
                          <div className="flex gap-1.5">
                            <Input
                              className="h-8 text-xs font-mono"
                              placeholder="No extraction selected"
                              value={m.extractPath ?? ''}
                              readOnly
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs shrink-0"
                              onClick={() => openInputExtractor(m.requestPath)}
                            >
                              Pick from JSON
                            </Button>
                          </div>
                        </div>
                      </div>

                      {extractTargetPath === m.requestPath && (
                        <div className="border rounded-md p-2 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-gray-700">Input Extractor</div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExtractTargetPath(null)}>
                              Close
                            </Button>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            Paste source JSON, then click <span className="font-medium">+ Capture</span> / <span className="font-medium">+ From array</span> to pick extraction.
                          </p>
                          <textarea
                            className="w-full h-28 border rounded-md p-2 text-xs font-mono"
                            value={extractSampleText}
                            onChange={(e) => parseExtractorJson(e.target.value)}
                          />
                          {extractParseError && <p className="text-xs text-red-600">{extractParseError}</p>}
                          {extractParsedJson && (
                            <div className="max-h-64 overflow-auto border rounded-md p-2">
                              <ResponseTree
                                data={extractParsedJson}
                                capturedPaths={new Set(m.extractPath ? [m.extractPath] : [])}
                                onCapture={applyInputExtraction}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label className="text-[10px] text-gray-500">Transformations</Label>
                        <TransformEditor
                          transforms={m.transforms ?? []}
                          onAdd={(type) => addInputTransform(m.requestPath, type)}
                          onChange={(id, field, value) => updateInputTransform(m.requestPath, id, field, value)}
                          onTypeChange={(id, type) => updateInputTransformType(m.requestPath, id, type)}
                          onRemove={(id) => removeInputTransform(m.requestPath, id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          {step === 3 && selectedApi && (
            <div className="flex-1 min-h-0 flex overflow-hidden">
              <div className="flex-1 min-w-[560px] border-r flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 shrink-0">
                  <div className="text-xs font-semibold text-gray-600">{selectedApi.name} - Response Structure</div>
                  <div className="text-xs text-gray-400">Click "+ Capture" or "+ From array"</div>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-2">
                    <ResponseTree data={selectedApi.sampleResponse} capturedPaths={capturedPaths} onCapture={handleCaptureRequest} />
                  </div>
                </ScrollArea>
              </div>

              <div className="w-[34%] min-w-[360px] max-w-[460px] shrink-0 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 shrink-0">
                  <div className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">Captured <Badge variant="secondary" className="text-xs">{captures.length}</Badge></div>
                  <div className="text-xs text-gray-400">Store targets + transformations</div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-2 space-y-2">
                    {pendingCapture && (
                      <div className="border-2 border-blue-300 rounded-lg p-2 bg-blue-50 space-y-2">
                        <div className="text-xs font-semibold text-blue-800 truncate" title={pendingCapture.label}>{pendingCapture.label}</div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Store as</Label>
                          <div className="flex gap-2">
                            {(['custom', 'native', 'none'] as const).map((t) => (
                              <label key={t} className="flex items-center gap-1 text-xs cursor-pointer">
                                <input type="radio" name="storetype" checked={storeType === t} onChange={() => setStoreType(t)} />
                                {t}
                              </label>
                            ))}
                          </div>
                          {storeType !== 'none' && <Input className="h-7 text-xs font-mono" placeholder="field_name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />}
                        </div>

                        <div>
                          <Label className="text-xs text-gray-600">Output transformations</Label>
                          <TransformEditor
                            transforms={captureTransforms}
                            onAdd={addCaptureTransform}
                            onChange={updateCaptureTransform}
                            onTypeChange={updateCaptureTransformType}
                            onRemove={removeCaptureTransform}
                          />
                        </div>

                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="flex-1 h-6 text-xs" onClick={() => setPendingCapture(null)}>Cancel</Button>
                          <Button size="sm" className="flex-1 h-6 text-xs" onClick={confirmCapture} disabled={storeType !== 'none' && !storeName.trim()}>Add</Button>
                        </div>
                      </div>
                    )}

                    {captures.length === 0 && !pendingCapture && <div className="text-xs text-gray-400 text-center pt-6">No captures yet</div>}

                    {captures.map((c) => (
                      <div key={c.id} className="border rounded p-2 bg-white text-xs space-y-0.5">
                        <div className="font-mono text-gray-500 truncate">{c.path}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">?</span>
                          <span className={`font-mono font-medium truncate ${c.storeType === 'none' ? 'text-gray-400 italic' : 'text-purple-600'}`}>
                            {c.storeType === 'none' ? 'ref only' : `${c.storeType}.${c.storeName}`}
                          </span>
                          <button className="ml-auto text-gray-300 hover:text-red-400" onClick={() => removeCapture(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {(c.transforms?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(c.transforms ?? []).map((t) => (
                              <Badge key={t.id} variant="secondary" className="text-[10px]">
                                {t.type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-3 border-t bg-white shrink-0">
          {step > 1 && <Button variant="outline" size="sm" className="text-xs" onClick={() => setStep(step - 1)}>? Back</Button>}
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="text-xs" onClick={handleClose}>Cancel</Button>
          {step < 3 ? (
            <Button size="sm" className="text-xs" disabled={step === 1 && !selectedApi} onClick={() => setStep(step + 1)}>Next ?</Button>
          ) : (
            <Button size="sm" className="text-xs" onClick={handleSave} disabled={!selectedApi}>Save API ?</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
