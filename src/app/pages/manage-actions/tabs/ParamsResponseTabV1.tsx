import { Plus, Trash2, Info, SlidersHorizontal, FileJson, Route } from 'lucide-react';
import {
  ApiIntegrationV1, KeyValuePairV1, BodyFieldV1,
  FieldTypeV1, FIELD_TYPE_LABELS,
} from '../../../types/apiIntegrationV1';

interface ParamsResponseTabV1Props {
  integration: ApiIntegrationV1;
  onChange: (updated: ApiIntegrationV1) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract {{var}} names from the URL path portion only (before ?) */
function extractPathVarsFromUrl(url: string): string[] {
  const pathPart = url.split('?')[0];
  const matches  = pathPart.match(/\{\{([^}]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function nextId(rows: { id: string }[]): string {
  return String(Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1);
}

// ─── Type selector ────────────────────────────────────────────────────────────

function TypeSelect({ value, onChange }: { value: FieldTypeV1 | undefined; onChange: (v: FieldTypeV1) => void }) {
  return (
    <select
      value={value ?? 'string'}
      onChange={(e) => onChange(e.target.value as FieldTypeV1)}
      className="text-[11px] border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700 cursor-pointer"
    >
      {(Object.keys(FIELD_TYPE_LABELS) as FieldTypeV1[]).map((t) => (
        <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
      ))}
    </select>
  );
}

// ─── Required toggle ──────────────────────────────────────────────────────────

function ReqToggle({ required, onChange }: { required: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!required)}
      title={required ? 'Required — click to make optional' : 'Optional — click to make required'}
      className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold transition-colors ${
        required ? 'bg-red-100 text-red-600 border border-red-300' : 'bg-gray-100 text-gray-400 border border-gray-200'
      }`}
    >
      *
    </button>
  );
}

// ─── Path parameters table ────────────────────────────────────────────────────

function PathParamsTable({
  detectedVars,
  pathParams,
  onChange,
}: {
  detectedVars: string[];
  pathParams: KeyValuePairV1[];
  onChange: (rows: KeyValuePairV1[]) => void;
}) {
  const getConfig = (varName: string): KeyValuePairV1 =>
    pathParams.find((p) => p.key === varName) ?? {
      id: varName, key: varName, value: '', enabled: true, required: false, fieldType: 'string',
    };

  const updateVar = (varName: string, field: keyof KeyValuePairV1, val: string | boolean) => {
    const existing = pathParams.find((p) => p.key === varName);
    if (existing) {
      onChange(pathParams.map((p) => (p.key === varName ? { ...p, [field]: val } : p)));
    } else {
      onChange([...pathParams, { ...getConfig(varName), [field]: val }]);
    }
  };

  if (detectedVars.length === 0) {
    return (
      <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          No path parameters detected. Use <code className="bg-gray-200 px-1 rounded font-mono text-[10px]">{`{{param}}`}</code> inside the URL path in the Endpoint tab.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_110px_36px_1fr] gap-x-2 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Variable</p>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</p>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Req</p>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Description</p>
      </div>
      <div className="divide-y divide-gray-100">
        {detectedVars.map((varName) => {
          const cfg = getConfig(varName);
          return (
            <div key={varName} className="grid grid-cols-[1fr_110px_36px_1fr] gap-x-2 items-center px-3 py-2.5">
              <p className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 truncate">
                {`{{${varName}}}`}
              </p>
              <TypeSelect
                value={cfg.fieldType}
                onChange={(v) => updateVar(varName, 'fieldType', v)}
              />
              <ReqToggle
                required={cfg.required}
                onChange={(v) => updateVar(varName, 'required', v)}
              />
              <input
                type="text"
                value={cfg.description ?? ''}
                onChange={(e) => updateVar(varName, 'description', e.target.value)}
                placeholder="e.g. Loan identifier"
                className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-300 w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Query params table (with required + type) ────────────────────────────────

function QueryParamTable({ rows, onChange }: { rows: KeyValuePairV1[]; onChange: (rows: KeyValuePairV1[]) => void }) {
  const update = (id: string, field: keyof KeyValuePairV1, val: string | boolean) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add    = () => onChange([...rows, { id: nextId(rows), key: '', value: '', enabled: true, required: false, fieldType: 'string' }]);

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid grid-cols-[20px_1fr_1fr_110px_36px_28px] gap-x-2 pb-1 border-b border-gray-100">
          <div />
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Parameter</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Value</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Type</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Req</p>
          <div />
        </div>
      )}
      {rows.map((row) => (
        <div key={row.id} className={`grid grid-cols-[20px_1fr_1fr_110px_36px_28px] gap-x-2 items-center ${!row.enabled ? 'opacity-40' : ''}`}>
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
            placeholder="value or {{var}}"
            className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-300"
          />
          <TypeSelect value={row.fieldType} onChange={(v) => update(row.id, 'fieldType', v)} />
          <ReqToggle required={row.required} onChange={(v) => update(row.id, 'required', v)} />
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

// ─── Body field rules table (POST) ────────────────────────────────────────────

function BodyFieldRulesTable({ rows, onChange }: { rows: BodyFieldV1[]; onChange: (rows: BodyFieldV1[]) => void }) {
  const update = (id: string, field: keyof BodyFieldV1, val: string | boolean) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add    = () => onChange([...rows, { id: nextId(rows), path: '', required: false, fieldType: 'string' }]);

  return (
    <div className="space-y-2">
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_110px_36px_1fr_28px] gap-x-2 pb-1 border-b border-gray-100">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Field Path</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Type</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Req</p>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Description</p>
          <div />
        </div>
      )}
      {rows.map((row) => (
        <div key={row.id} className="space-y-1">
          <div className="grid grid-cols-[1fr_110px_36px_1fr_28px] gap-x-2 items-center">
            <input
              type="text" value={row.path}
              onChange={(e) => update(row.id, 'path', e.target.value)}
              placeholder="e.g. applicant.pan"
              className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-300"
            />
            <TypeSelect value={row.fieldType} onChange={(v) => update(row.id, 'fieldType', v)} />
            <ReqToggle required={row.required} onChange={(v) => update(row.id, 'required', v)} />
            <input
              type="text" value={row.description ?? ''}
              onChange={(e) => update(row.id, 'description', e.target.value)}
              placeholder="optional description"
              className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-300"
            />
            <button onClick={() => remove(row.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          {/* Regex pattern sub-row */}
          {row.fieldType === 'regex' && (
            <div className="pl-0">
              <input
                type="text" value={row.pattern ?? ''}
                onChange={(e) => update(row.id, 'pattern', e.target.value)}
                placeholder="Regex pattern, e.g. ^[A-Z]{5}[0-9]{4}[A-Z]$"
                className="w-full text-xs border border-amber-200 bg-amber-50 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono placeholder:text-gray-400"
              />
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 py-1 px-1 rounded hover:bg-blue-50 transition-colors">
        <Plus size={12} />
        Add Field Rule
      </button>
    </div>
  );
}

// ─── JSON editor ──────────────────────────────────────────────────────────────

function JsonEditor({ value, onChange, placeholder, rows = 14 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
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
  const isGet        = integration.method === 'GET';
  const detectedPath = extractPathVarsFromUrl(integration.url);

  return (
    <div className="space-y-3">

      {/* Method badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
          isGet ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {integration.method}
        </span>
        <span className="text-sm text-gray-500">
          {isGet ? 'Path & Query Parameters' : 'Path Parameters & Request Body'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">

        {/* ── Left panel ── */}
        <div className="space-y-4">

          {/* Path parameters (both GET and POST) */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <Route size={15} className="text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-800">Path Parameters</h3>
              {detectedPath.length > 0 && (
                <span className="ml-auto text-[10px] bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
                  {detectedPath.length} detected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Variables embedded in the URL path, e.g.{' '}
              <code className="bg-gray-100 px-1 rounded font-mono text-[10px]">/resource/{`{{id}}`}</code>
            </p>
            <PathParamsTable
              detectedVars={detectedPath}
              pathParams={integration.pathParams}
              onChange={(pathParams) => onChange({ ...integration, pathParams })}
            />
          </div>

          {/* GET: query params */}
          {isGet && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
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
                Appended to the URL as{' '}
                <code className="bg-gray-100 px-1 rounded font-mono text-[10px]">?key=value</code> pairs.{' '}
                Use <code className="bg-gray-100 px-1 rounded font-mono text-[10px]">{`{{var}}`}</code> for dynamic values.
              </p>
              <QueryParamTable
                rows={integration.params}
                onChange={(params) => onChange({ ...integration, params })}
              />
            </div>
          )}

          {/* POST: body + field rules */}
          {!isGet && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
              {/* Body editor */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileJson size={15} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Request Body</h3>
                </div>
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {CONTENT_TYPES.map((ct) => (
                    <button key={ct.label} disabled={!ct.supported}
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
                  rows={12}
                />
              </div>

              {/* Field rules */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal size={14} className="text-amber-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Field Rules</h3>
                  <span className="ml-1 text-[10px] text-gray-400">(validation applied in Try It)</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Define which body fields are required and what type they must be.{' '}
                  Use dot-notation for nested fields, e.g.{' '}
                  <code className="bg-gray-100 px-1 rounded font-mono text-[10px]">applicant.pan</code>
                </p>
                <BodyFieldRulesTable
                  rows={integration.bodySchema}
                  onChange={(bodySchema) => onChange({ ...integration, bodySchema })}
                />
              </div>
            </div>
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
