import { Plus, Trash2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  ApiIntegration,
  ResponseMapping,
  StatusRouting,
  StatusAction,
  PaginationType,
  ResponseFormat,
} from '../../../types/apiIntegration';
import { VariableInput } from '../components/VariableInput';

interface ResponseTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

const STATUS_LABELS: Record<StatusRouting['statusRange'], string> = {
  '2xx':          '2xx — Success',
  '3xx':          '3xx — Redirect',
  '4xx':          '4xx — Client Error',
  '5xx':          '5xx — Server Error',
  'timeout':      'Timeout',
  'network_error':'Network Error',
};

const STATUS_COLORS: Record<StatusRouting['statusRange'], string> = {
  '2xx':          'text-emerald-700 bg-emerald-50 border-emerald-200',
  '3xx':          'text-blue-700 bg-blue-50 border-blue-200',
  '4xx':          'text-orange-700 bg-orange-50 border-orange-200',
  '5xx':          'text-red-700 bg-red-50 border-red-200',
  'timeout':      'text-yellow-700 bg-yellow-50 border-yellow-200',
  'network_error':'text-gray-700 bg-gray-100 border-gray-200',
};

const ACTION_OPTIONS: { value: StatusAction; label: string }[] = [
  { value: 'continue',             label: 'Continue journey' },
  { value: 'retry',                label: 'Retry request' },
  { value: 'fail',                 label: 'Fail journey' },
  { value: 'continue_with_error',  label: 'Continue with error flag' },
];

const FORMAT_OPTIONS: { value: ResponseFormat; label: string }[] = [
  { value: 'auto',   label: 'Auto-detect' },
  { value: 'json',   label: 'JSON' },
  { value: 'xml',    label: 'XML' },
  { value: 'text',   label: 'Plain Text' },
  { value: 'binary', label: 'Binary / File' },
];

const PAGINATION_TYPES: { value: PaginationType; label: string; description: string }[] = [
  { value: 'none',   label: 'None',            description: 'Single page response' },
  { value: 'offset', label: 'Offset-based',    description: 'Uses offset + limit params' },
  { value: 'page',   label: 'Page-based',      description: 'Uses page number + per_page' },
  { value: 'cursor', label: 'Cursor / Token',  description: 'Cursor or token from response' },
  { value: 'link',   label: 'Link Header',     description: 'Follows Link: <next> header' },
];

function nextId(items: { id: string }[]) {
  return String(Math.max(0, ...items.map((i) => Number(i.id) || 0)) + 1);
}

export function ResponseTab({ integration, onChange }: ResponseTabProps) {
  const { response } = integration;
  const [paginationOpen, setPaginationOpen] = useState(false);

  const setResponse = (updates: Partial<typeof response>) =>
    onChange({ ...integration, response: { ...response, ...updates } });

  const addMapping = () =>
    setResponse({
      mappings: [
        ...response.mappings,
        { id: nextId(response.mappings), responsePath: '', variableName: '', label: '' },
      ],
    });

  const updateMapping = (id: string, field: keyof ResponseMapping, value: string) =>
    setResponse({
      mappings: response.mappings.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    });

  const removeMapping = (id: string) =>
    setResponse({ mappings: response.mappings.filter((m) => m.id !== id) });

  const updateStatusAction = (range: StatusRouting['statusRange'], action: StatusAction) =>
    setResponse({
      statusRouting: response.statusRouting.map((s) =>
        s.statusRange === range ? { ...s, action } : s
      ),
    });

  const setPagination = (updates: Partial<typeof response.pagination>) =>
    setResponse({ pagination: { ...response.pagination, ...updates } });

  return (
    <div className="space-y-6">
      {/* Parse + Format */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Parse Response</label>
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={response.parseResponse === val}
                  onChange={() => setResponse({ parseResponse: val })}
                  className="accent-teal-600"
                />
                <span className="text-xs text-gray-700">{val ? 'Yes — parse into variables' : 'No — raw response only'}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Expected Format</label>
          <select
            value={response.format}
            onChange={(e) => setResponse({ format: e.target.value as ResponseFormat })}
            className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Status-based routing */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-3">Status-Based Routing</p>
        <div className="space-y-2">
          {response.statusRouting.map((routing) => (
            <div key={routing.statusRange} className="flex items-center gap-3">
              <div className={`flex-shrink-0 px-2.5 py-1 rounded border text-[10px] font-bold w-36 text-center ${STATUS_COLORS[routing.statusRange]}`}>
                {STATUS_LABELS[routing.statusRange]}
              </div>
              <div className="text-gray-400 text-xs">→</div>
              <select
                value={routing.action}
                onChange={(e) => updateStatusAction(routing.statusRange, e.target.value as StatusAction)}
                className="flex-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Response field mappings */}
      {response.parseResponse && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-700">Response Field Mappings</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Map response values to journey variables for use in later blocks</p>
            </div>
          </div>

          {response.mappings.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_100px_28px] gap-x-2 mb-1">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Response Path (JSONPath)</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Journey Variable</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Label</p>
              <div />
            </div>
          )}

          <div className="space-y-2">
            {response.mappings.map((mapping) => (
              <div key={mapping.id} className="grid grid-cols-[1fr_1fr_100px_28px] gap-x-2 items-start">
                <input
                  type="text"
                  value={mapping.responsePath}
                  onChange={(e) => updateMapping(mapping.id, 'responsePath', e.target.value)}
                  placeholder="$.data.creditScore"
                  className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono placeholder:text-gray-300"
                />
                <input
                  type="text"
                  value={mapping.variableName}
                  onChange={(e) => updateMapping(mapping.id, 'variableName', e.target.value)}
                  placeholder="journey.creditScore"
                  className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono placeholder:text-gray-300"
                />
                <input
                  type="text"
                  value={mapping.label}
                  onChange={(e) => updateMapping(mapping.id, 'label', e.target.value)}
                  placeholder="Credit Score"
                  className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300"
                />
                <button onClick={() => removeMapping(mapping.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 mt-0.5">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addMapping}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-600 mt-2 py-1 px-1 rounded hover:bg-teal-50"
          >
            <Plus size={12} />
            Add Mapping
          </button>

          {response.mappings.length === 0 && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-400">No mappings yet. Add mappings to expose response data to later journey blocks.</p>
              <p className="text-[10px] text-gray-400 mt-1">Tip: Run a test first to see the response structure.</p>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-gray-100" />

      {/* Pagination */}
      <div>
        <button
          onClick={() => setPaginationOpen(!paginationOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-teal-700 transition-colors"
        >
          {paginationOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Pagination (optional)
          {response.pagination.type !== 'none' && (
            <span className="ml-1 text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              {response.pagination.type}
            </span>
          )}
        </button>

        {paginationOpen && (
          <div className="mt-3 space-y-4 pl-5 border-l-2 border-gray-100">
            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Pagination Type</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PAGINATION_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setPagination({ type: pt.value })}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      response.pagination.type === pt.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-[10px] font-medium ${response.pagination.type === pt.value ? 'text-teal-800' : 'text-gray-700'}`}>
                      {pt.label}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{pt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {response.pagination.type !== 'none' && (
              <div className="space-y-3">
                {/* Items path — all types */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Items Path</label>
                  <input
                    type="text"
                    value={response.pagination.itemsPath ?? ''}
                    onChange={(e) => setPagination({ itemsPath: e.target.value })}
                    placeholder="results  or  data.items"
                    className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono placeholder:text-gray-300"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Path to the array of items in the response body</p>
                </div>

                {/* Offset */}
                {response.pagination.type === 'offset' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Offset Param Name</label>
                      <input type="text" value={response.pagination.offsetParamName ?? ''} onChange={(e) => setPagination({ offsetParamName: e.target.value })} placeholder="offset" className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Initial Offset</label>
                      <input type="number" value={response.pagination.initialOffset ?? 0} onChange={(e) => setPagination({ initialOffset: Number(e.target.value) })} className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                  </div>
                )}

                {/* Page */}
                {response.pagination.type === 'page' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Page Param Name</label>
                      <input type="text" value={response.pagination.pageParamName ?? ''} onChange={(e) => setPagination({ pageParamName: e.target.value })} placeholder="page" className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Initial Page</label>
                      <input type="number" value={response.pagination.initialPage ?? 1} onChange={(e) => setPagination({ initialPage: Number(e.target.value) })} className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                    </div>
                  </div>
                )}

                {/* Cursor */}
                {response.pagination.type === 'cursor' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cursor Param Name</label>
                      <input type="text" value={response.pagination.cursorParamName ?? ''} onChange={(e) => setPagination({ cursorParamName: e.target.value })} placeholder="cursor" className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cursor Response Path</label>
                      <input type="text" value={response.pagination.cursorResponsePath ?? ''} onChange={(e) => setPagination({ cursorResponsePath: e.target.value })} placeholder="next_cursor" className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                    </div>
                  </div>
                )}

                {/* Link */}
                {response.pagination.type === 'link' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Next Link Response Path</label>
                    <input type="text" value={response.pagination.linkResponsePath ?? ''} onChange={(e) => setPagination({ linkResponsePath: e.target.value })} placeholder="links.next  or leave blank for Link header" className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                  </div>
                )}

                {/* Common: page size + max items */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Page Size Param</label>
                    <input type="text" value={response.pagination.pageSizeParamName ?? ''} onChange={(e) => setPagination({ pageSizeParamName: e.target.value })} placeholder="limit" className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Page Size</label>
                    <input type="number" value={response.pagination.pageSize ?? 100} onChange={(e) => setPagination({ pageSize: Number(e.target.value) })} className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Items</label>
                    <input type="number" value={response.pagination.maxItems ?? 1000} onChange={(e) => setPagination({ maxItems: Number(e.target.value) })} className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </div>
                </div>

                {/* Output format */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Output Format</label>
                  <div className="flex gap-3">
                    {(['array_items', 'array_pages'] as const).map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={(response.pagination.outputFormat ?? 'array_items') === fmt}
                          onChange={() => setPagination({ outputFormat: fmt })}
                          className="accent-teal-600"
                        />
                        <span className="text-xs text-gray-700">
                          {fmt === 'array_items' ? 'Array of all items (flat)' : 'Array of pages (nested)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
