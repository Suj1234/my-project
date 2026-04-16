import { Plus, Trash2, Info, SlidersHorizontal, FileJson } from 'lucide-react';
import { ApiIntegrationV1, KeyValuePairV1 } from '../../../types/apiIntegrationV1';

interface ParamsResponseTabV1Props {
  integration: ApiIntegrationV1;
  onChange: (updated: ApiIntegrationV1) => void;
}

// ─── Param table ──────────────────────────────────────────────────────────────

function ParamTable({ rows, onChange }: { rows: KeyValuePairV1[]; onChange: (rows: KeyValuePairV1[]) => void }) {
  const nextId = () => String(Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1);
  const update = (id: string, field: keyof KeyValuePairV1, val: string | boolean) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add    = () => onChange([...rows, { id: nextId(), key: '', value: '', enabled: true }]);

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid grid-cols-[20px_1fr_1fr_28px] gap-x-2 pb-1 border-b border-gray-100">
          <div />
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Parameter</p>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Value</p>
          <div />
        </div>
      )}
      {rows.map((row) => (
        <div key={row.id} className={`grid grid-cols-[20px_1fr_1fr_28px] gap-x-2 items-center ${!row.enabled ? 'opacity-40' : ''}`}>
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => update(row.id, 'enabled', e.target.checked)}
            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
          />
          <input
            type="text" value={row.key}
            onChange={(e) => update(row.id, 'key', e.target.value)}
            placeholder="param_name"
            className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-300"
          />
          <input
            type="text" value={row.value}
            onChange={(e) => update(row.id, 'value', e.target.value)}
            placeholder="value"
            className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-300"
          />
          <button onClick={() => remove(row.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 py-1 px-1 rounded hover:bg-blue-50 transition-colors">
        <Plus size={12} />
        Add Parameter
      </button>
    </div>
  );
}

// ─── Code editor textarea ─────────────────────────────────────────────────────

function JsonEditor({ value, onChange, placeholder, rows = 16 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-800">
      <div className="px-3 py-1.5 bg-gray-800 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[10px] text-gray-400 font-mono">JSON</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className="w-full text-xs bg-gray-950 text-green-300 px-4 py-3 focus:outline-none font-mono placeholder:text-gray-600 resize-y leading-relaxed block"
      />
    </div>
  );
}

const CONTENT_TYPES = [
  { label: 'JSON', supported: true },
  { label: 'XML', supported: false },
  { label: 'Form Data', supported: false },
  { label: 'Plain Text', supported: false },
];

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function ParamsResponseTabV1({ integration, onChange }: ParamsResponseTabV1Props) {
  const isGet = integration.method === 'GET';

  return (
    <div className="space-y-3">

      {/* Method context indicator */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
          isGet ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {integration.method}
        </span>
        <span className="text-sm text-gray-500">
          {isGet ? 'Query Parameters (GET)' : 'Request Body (POST)'}
        </span>
      </div>

      {/* ── Two column layout ── */}
      <div className="grid grid-cols-2 gap-4 items-start">

        {/* ── Left: Params or Body ── */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          {isGet ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <SlidersHorizontal size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">Query Parameters</h3>
                {integration.params.filter((p) => p.enabled && p.key).length > 0 && (
                  <span className="ml-auto text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                    {integration.params.filter((p) => p.enabled && p.key).length} active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Appended to the URL as <code className="bg-gray-100 px-1 rounded font-mono">?key=value</code> pairs.
              </p>
              <ParamTable
                rows={integration.params}
                onChange={(params) => onChange({ ...integration, params })}
              />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <FileJson size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">Request Body</h3>
              </div>
              {/* Content type selector */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.label}
                    disabled={!ct.supported}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      ct.supported
                        ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-default'
                        : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    {ct.label}
                    {!ct.supported && <span className="ml-1 text-[9px] text-gray-300 font-normal">Soon</span>}
                  </button>
                ))}
              </div>
              <JsonEditor
                value={integration.bodyRaw}
                onChange={(bodyRaw) => onChange({ ...integration, bodyRaw })}
                placeholder={'{\n  "key": "value"\n}'}
                rows={16}
              />
            </>
          )}
        </div>

        {/* ── Right: Expected Response ── */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileJson size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Expected Response (JSON)</h3>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg mb-4">
            <Info size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Paste a sample JSON response this API returns. Helps document what the integration produces.
            </p>
          </div>
          <JsonEditor
            value={integration.responseJson}
            onChange={(responseJson) => onChange({ ...integration, responseJson })}
            placeholder={'{\n  "status": "success",\n  "data": {}\n}'}
            rows={16}
          />
        </div>

      </div>
    </div>
  );
}
