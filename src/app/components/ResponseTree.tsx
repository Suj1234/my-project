import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaptureSpec {
  displayPath: string;     // Human readable path shown in UI
  storagePath: string;     // Technical path / expression used internally
  label: string;
  sampleValue: string;
  isArray: boolean;
  captureLevel?: 'field' | 'object' | 'array' | 'full_response';
  arrayOptions?: ArrayCaptureOptions;
}

export interface ArrayCaptureOptions {
  arrayPath: string;
  fieldPath: string;       // path within each item
  aggregate: 'first' | 'last' | 'all' | 'max' | 'min' | 'sum' | 'count' | 'unique' | 'join' | 'latest_by_field';
  filterField?: string;
  filterValue?: string;
  latestByField?: string;
  joinDelimiter?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSample(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'number') return val.toLocaleString('en-IN');
  if (typeof val === 'string') return `"${val.length > 28 ? val.slice(0, 28) + '…' : val}"`;
  return String(val);
}

function inferType(val: any): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?\s*$/.test(val)) return 'date';
    return 'string';
  }
  return 'string';
}

const TYPE_BADGE: Record<string, string> = {
  string:  'bg-gray-100 text-gray-500',
  number:  'bg-blue-50 text-blue-600',
  boolean: 'bg-green-50 text-green-600',
  date:    'bg-purple-50 text-purple-600',
  null:    'bg-gray-100 text-gray-400',
};

function toLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function aggregateLabel(aggregate: ArrayCaptureOptions['aggregate']): string {
  if (aggregate === 'latest_by_field') return 'Latest';
  return toLabel(aggregate.replace(/_/g, ' '));
}

// ─── Array Capture Inline Panel ───────────────────────────────────────────────

interface ArrayCapturePanelProps {
  arrayPath: string;
  fieldPath: string;
  fieldLabel: string;
  sampleItems: any[];
  onConfirm: (opts: ArrayCaptureOptions, sample: string) => void;
  onCancel: () => void;
}

function ArrayCapturePanel({ arrayPath, fieldPath, fieldLabel, sampleItems, onConfirm, onCancel }: ArrayCapturePanelProps) {
  const [aggregate, setAggregate] = useState<ArrayCaptureOptions['aggregate']>('first');
  const [useFilter, setUseFilter] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [latestByField, setLatestByField] = useState('');
  const [joinDelimiter, setJoinDelimiter] = useState(', ');

  // Find string keys for filtering
  const stringKeys = sampleItems.length > 0
    ? Object.keys(sampleItems[0]).filter(k => typeof sampleItems[0][k] === 'string')
    : [];

  // Unique values for selected filter field
  const filterValues = filterField
    ? Array.from(new Set(sampleItems.map((i: any) => i[filterField]).filter(Boolean)))
    : [];

  const sortableKeys = sampleItems.length > 0
    ? Object.keys(sampleItems[0]).filter((k) => {
        const v = sampleItems[0][k];
        return typeof v === 'string' || typeof v === 'number';
      })
    : [];

  // Resolve field value from a nested path like "dpdSummary.maxDPD"
  function resolveField(item: any, path: string): any {
    return path.split('.').reduce((acc, k) => acc?.[k], item);
  }

  function isDateLike(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return !Number.isNaN(Date.parse(value));
  }

  function sortByLatest(items: any[], field: string): any[] {
    return [...items].sort((a: any, b: any) => {
      const av = a?.[field];
      const bv = b?.[field];
      if (isDateLike(av) && isDateLike(bv)) {
        return new Date(bv).getTime() - new Date(av).getTime();
      }
      return String(bv ?? '').localeCompare(String(av ?? ''), undefined, { numeric: true });
    });
  }

  // Compute sample result
  function computeSample(): string {
    let items = sampleItems;
    if (useFilter && filterField && filterValue) {
      items = items.filter((i: any) => String(i[filterField]) === filterValue);
    }
    if (aggregate === 'latest_by_field' && latestByField) {
      items = sortByLatest(items, latestByField);
      items = items.slice(0, 1);
    }

    const vals = items.map((i: any) => resolveField(i, fieldPath)).filter((v: any) => v !== undefined && v !== null);
    if (vals.length === 0) return 'no matching items';
    if (aggregate === 'first') return formatSample(vals[0]);
    if (aggregate === 'last') return formatSample(vals[vals.length - 1]);
    if (aggregate === 'all') return `[${vals.map((v: any) => formatSample(v)).join(', ')}]`;
    if (aggregate === 'unique') return `[${Array.from(new Set(vals.map((v: any) => String(v)))).map((v) => formatSample(v)).join(', ')}]`;
    if (aggregate === 'join') return vals.map((v: any) => String(v)).join(joinDelimiter);
    if (aggregate === 'latest_by_field') return formatSample(vals[0]);
    if (aggregate === 'count') return String(vals.length);
    const nums = vals.filter((v: any) => typeof v === 'number');
    if (aggregate === 'max') return String(Math.max(...nums));
    if (aggregate === 'min') return String(Math.min(...nums));
    if (aggregate === 'sum') return String(nums.reduce((a: number, b: number) => a + b, 0));
    return formatSample(vals[0]);
  }

  const AGGREGATE_OPTIONS = [
    { value: 'first',  label: 'First item only' },
    { value: 'last',   label: 'Last item only' },
    { value: 'all',    label: 'All values (as list)' },
    { value: 'unique', label: 'Unique values only' },
    { value: 'join',   label: 'Join values as text' },
    { value: 'latest_by_field', label: 'Latest by field' },
    { value: 'max',    label: 'Maximum value' },
    { value: 'min',    label: 'Minimum value' },
    { value: 'sum',    label: 'Total (sum)' },
    { value: 'count',  label: 'Count of items' },
  ];

  return (
    <div className="border-2 border-purple-300 rounded-lg p-3 bg-purple-50 space-y-3 mt-1">
      <div className="text-xs font-semibold text-purple-800">
        Capture "<span className="font-mono">{fieldLabel}</span>" from {sampleItems.length} items in <span className="font-mono">{arrayPath}</span>
      </div>

      {/* How to pick */}
      <div>
        <div className="text-xs text-gray-600 font-medium mb-1">How to select?</div>
        <Select value={aggregate} onValueChange={(v) => setAggregate(v as any)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGGREGATE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {aggregate === 'latest_by_field' && (
        <div>
          <div className="text-xs text-gray-600 font-medium mb-1">Latest by which field?</div>
          <Select value={latestByField} onValueChange={setLatestByField}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select date/time or sortable field" />
            </SelectTrigger>
            <SelectContent>
              {sortableKeys.map((k) => (
                <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {aggregate === 'join' && (
        <div>
          <div className="text-xs text-gray-600 font-medium mb-1">Delimiter</div>
          <Input
            className="h-8 text-xs font-mono"
            value={joinDelimiter}
            onChange={(e) => setJoinDelimiter(e.target.value)}
            placeholder=", "
          />
        </div>
      )}

      {/* Filter */}
      {stringKeys.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input type="checkbox" checked={useFilter} onChange={e => { setUseFilter(e.target.checked); }} id="use-filter" className="h-3 w-3" />
            <label htmlFor="use-filter" className="text-xs text-gray-600 font-medium cursor-pointer">Filter: only where…</label>
          </div>
          {useFilter && (
            <div className="flex gap-1.5 items-center">
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="field" />
                </SelectTrigger>
                <SelectContent>
                  {stringKeys.map(k => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-400">=</span>
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="value" />
                </SelectTrigger>
                <SelectContent>
                  {filterValues.map((v: any) => <SelectItem key={v} value={String(v)} className="text-xs">{String(v)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <div className="bg-white border border-purple-200 rounded p-2 text-xs">
        <span className="text-gray-500">Result example: </span>
        <span className="font-mono font-semibold text-purple-700">{computeSample()}</span>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => onConfirm(
            {
              arrayPath,
              fieldPath,
              aggregate,
              filterField: useFilter ? filterField : undefined,
              filterValue: useFilter ? filterValue : undefined,
              latestByField: aggregate === 'latest_by_field' ? latestByField : undefined,
              joinDelimiter: aggregate === 'join' ? joinDelimiter : undefined,
            },
            computeSample()
          )}
          disabled={(aggregate === 'latest_by_field' && !latestByField) || (aggregate === 'join' && joinDelimiter.length === 0)}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function TreeNode({
  nodeKey,
  value,
  path,
  depth,
  capturedPaths,
  onCapture,
  arrayContext,
}: {
  nodeKey: string;
  value: any;
  path: string;
  depth: number;
  capturedPaths: Set<string>;
  onCapture: (spec: Omit<CaptureSpec, 'storagePath'>) => void;
  arrayContext?: { arrayPath: string; items: any[] };
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [showArrayPanel, setShowArrayPanel] = useState(false);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;
  const label = toLabel(nodeKey);
  const isCaptured = capturedPaths.has(path);

  if (isPrimitive) {
    const type = inferType(value);
    return (
      <div className="space-y-0">
        <div className="flex items-center gap-1 py-1 w-full" style={{ paddingLeft: `${depth * 14}px` }}>
          <span className="w-2 shrink-0" />
          <span className="text-blue-700 text-xs font-medium truncate max-w-[45%]">{nodeKey}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${TYPE_BADGE[type] ?? TYPE_BADGE.string}`}>{type}</span>
          <span className="flex-1 min-w-0" />

          {/* If inside an array, show array capture button */}
          {arrayContext ? (
            <button
              className={`ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded border font-semibold transition-colors shadow-sm ${
                isCaptured
                  ? 'bg-purple-200 text-purple-700 border-purple-400'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
              onClick={() => setShowArrayPanel(!showArrayPanel)}
            >
              {isCaptured ? '✓ Captured' : '+ From array'}
            </button>
          ) : (
            <button
              className={`ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded border font-semibold transition-colors shadow-sm ${
                isCaptured
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              onClick={() => !isCaptured && onCapture({ displayPath: path, label, sampleValue: formatSample(value), isArray: false })}
            >
              {isCaptured ? '✓ Captured' : '+ Capture'}
            </button>
          )}
        </div>

        {/* Array capture panel inline */}
        {showArrayPanel && arrayContext && (
          <div style={{ paddingLeft: `${depth * 14}px` }}>
            <ArrayCapturePanel
              arrayPath={arrayContext.arrayPath}
              fieldPath={path.replace(`${arrayContext.arrayPath}[].`, '')}
              fieldLabel={label}
              sampleItems={arrayContext.items}
              onConfirm={(opts, sample) => {
                const agg = opts.aggregate.toUpperCase();
                const base = opts.filterField
                  ? `${opts.arrayPath}[${opts.filterField}=${opts.filterValue}].${opts.fieldPath}`
                  : `${opts.arrayPath}[].${opts.fieldPath}`;
                const expr = opts.aggregate === 'latest_by_field' && opts.latestByField
                  ? `${agg}(${base}; sortBy=${opts.latestByField})`
                  : opts.aggregate === 'join'
                  ? `${agg}(${base}; delim="${opts.joinDelimiter ?? ', '}")`
                  : `${agg}(${base})`;
                onCapture({
                  displayPath: expr,
                  label: `${aggregateLabel(opts.aggregate)} of ${label}${opts.filterField ? ` (${opts.filterField}=${opts.filterValue})` : ''} from ${opts.arrayPath}`,
                  sampleValue: sample,
                  isArray: true,
                  arrayOptions: opts,
                });
                setShowArrayPanel(false);
              }}
              onCancel={() => setShowArrayPanel(false)}
            />
          </div>
        )}
      </div>
    );
  }

  if (isArray) {
    const objectItems = value.filter((i: any) => i !== null && typeof i === 'object' && !Array.isArray(i));
    const primitiveItems = value.filter((i: any) => typeof i !== 'object');

    return (
      <div style={{ paddingLeft: `${depth * 14}px` }}>
        <div className="flex items-center gap-1 py-1 cursor-pointer w-full" onClick={() => setExpanded(!expanded)}>
          <span className="text-gray-400 shrink-0">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
          <span className="text-blue-700 text-xs font-medium truncate max-w-[45%]">{nodeKey}</span>
          <span className="text-gray-400 text-xs italic ml-1 flex-1 min-w-0 truncate">
            [ {value.length} {objectItems.length > 0 ? 'objects' : 'values'} ]
          </span>
          {/* Capture entire array (objects or primitives) */}
          <button
            className={`ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded border font-semibold shadow-sm ${
              capturedPaths.has(path)
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (!capturedPaths.has(path)) {
                const sample = primitiveItems.length > 0
                  ? `[${primitiveItems.slice(0, 2).map(formatSample).join(', ')}…]`
                  : `[{...} × ${value.length}]`;
                onCapture({ displayPath: path, label, sampleValue: sample, isArray: true, captureLevel: 'array' });
              }
            }}
          >
            {capturedPaths.has(path) ? '✓ Captured' : '+ Capture array'}
          </button>
        </div>
        {expanded && objectItems.length > 0 && (
          <div className="border-l-2 border-purple-100 ml-2 pl-1">
            <div className="text-xs text-purple-400 italic pl-1 py-0.5">▼ each item has these fields (click to capture from all {value.length} items):</div>
            {Object.entries(objectItems[0]).map(([k, v]) => (
              <TreeNode
                key={k}
                nodeKey={k}
                value={v}
                path={`${path}[].${k}`}
                depth={depth + 1}
                capturedPaths={capturedPaths}
                onCapture={onCapture}
                arrayContext={{ arrayPath: path, items: objectItems }}
              />
            ))}
          </div>
        )}
        {expanded && primitiveItems.length > 0 && (
          <div className="border-l-2 border-gray-100 ml-2 pl-2 py-0.5">
            <span className="text-xs text-gray-400">{primitiveItems.slice(0, 3).map(formatSample).join(', ')}{primitiveItems.length > 3 ? '…' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  // Object
  return (
    <div style={{ paddingLeft: `${depth * 14}px` }}>
      <div className="flex items-center gap-1 py-1 w-full">
        <span className="text-gray-400 shrink-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </span>
        <span className="text-blue-700 text-xs font-medium shrink-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>{nodeKey}</span>
        <span className="text-gray-400 text-xs italic ml-1 flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>{'{ object }'}</span>
        <button
          className={`ml-auto shrink-0 text-[11px] px-2 py-0.5 rounded border font-semibold shadow-sm ${
            capturedPaths.has(path)
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
          onClick={() => !capturedPaths.has(path) && onCapture({ displayPath: path, label, sampleValue: '{...}', isArray: false, captureLevel: 'object' })}
        >
          {capturedPaths.has(path) ? '✓ Captured' : '+ Capture'}
        </button>
      </div>
      {expanded && (
        <div className="border-l-2 border-gray-100 ml-2 pl-1">
          {Object.entries(value).map(([k, v]) => (
            <TreeNode
              key={k}
              nodeKey={k}
              value={v}
              path={`${path}.${k}`}
              depth={depth + 1}
              capturedPaths={capturedPaths}
              onCapture={onCapture}
              arrayContext={arrayContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Public: ResponseTree ─────────────────────────────────────────────────────

interface ResponseTreeProps {
  data: Record<string, any>;
  capturedPaths: Set<string>;
  onCapture: (spec: Omit<CaptureSpec, 'storagePath'>) => void;
}

export function ResponseTree({ data, capturedPaths, onCapture }: ResponseTreeProps) {
  const fullResponseCaptured = capturedPaths.has('__full_response__');
  return (
    <div className="font-mono text-sm">
      {/* Capture entire response */}
      <div className="flex items-center gap-2 px-2 py-1.5 mb-1 border-b border-dashed border-gray-200">
        <span className="text-xs text-gray-500 flex-1">Full API response</span>
        <button
          className={`shrink-0 text-[11px] px-2 py-0.5 rounded border font-semibold shadow-sm ${
            fullResponseCaptured
              ? 'bg-green-100 text-green-700 border-green-300'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
          onClick={() => !fullResponseCaptured && onCapture({ displayPath: '__full_response__', label: 'Full Response', sampleValue: '{...}', isArray: false, captureLevel: 'full_response' })}
        >
          {fullResponseCaptured ? '✓ Captured' : '+ Capture entire response'}
        </button>
      </div>

      {Object.entries(data).map(([key, value]) => (
        <TreeNode
          key={key}
          nodeKey={key}
          value={value}
          path={key}
          depth={0}
          capturedPaths={capturedPaths}
          onCapture={onCapture}
        />
      ))}
    </div>
  );
}
