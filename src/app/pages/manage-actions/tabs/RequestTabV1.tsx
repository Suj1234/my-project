import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Globe, ShieldCheck, List } from 'lucide-react';
import { ApiIntegrationV1, AuthTypeV1, KeyValuePairV1 } from '../../../types/apiIntegrationV1';

interface RequestTabV1Props {
  integration: ApiIntegrationV1;
  onChange: (updated: ApiIntegrationV1) => void;
}

// ─── Simple key-value table ───────────────────────────────────────────────────

function SimpleKeyValueTable({
  rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', addLabel = 'Add Row',
}: {
  rows: KeyValuePairV1[];
  onChange: (rows: KeyValuePairV1[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}) {
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
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Key</p>
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
            type="text"
            value={row.key}
            onChange={(e) => update(row.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-300"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => update(row.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-300"
          />
          <button onClick={() => remove(row.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 py-1 px-1 rounded hover:bg-blue-50 transition-colors">
        <Plus size={12} />
        {addLabel}
      </button>
    </div>
  );
}

// ─── Auth config fields ───────────────────────────────────────────────────────

const AUTH_OPTIONS: { value: AuthTypeV1; label: string; description: string }[] = [
  { value: 'none',    label: 'No Auth',      description: 'Public endpoint' },
  { value: 'bearer',  label: 'Bearer Token', description: 'Authorization header' },
  { value: 'api_key', label: 'API Key',      description: 'Header or query param' },
  { value: 'basic',   label: 'Basic Auth',   description: 'Username & password' },
];

function AuthFields({ integration, onChange }: { integration: ApiIntegrationV1; onChange: (u: ApiIntegrationV1) => void }) {
  const [showPw,    setShowPw]    = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showKey,   setShowKey]   = useState(false);

  const { auth } = integration;
  const setAuth  = (partial: Partial<typeof auth>) => onChange({ ...integration, auth: { ...auth, ...partial } });

  return (
    <div className="space-y-4">
      {/* Type buttons */}
      <div className="grid grid-cols-2 gap-2">
        {AUTH_OPTIONS.map((opt) => {
          const active = auth.type === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setAuth({ type: opt.value })}
              className={`flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all ${
                active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <p className={`text-xs font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {/* Bearer */}
      {auth.type === 'bearer' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Token</label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={auth.bearerToken ?? ''}
              onChange={(e) => setAuth({ bearerToken: e.target.value })}
              placeholder="Enter bearer token"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-400"
            />
            <button type="button" onClick={() => setShowToken(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* API Key */}
      {auth.type === 'api_key' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Key Name</label>
            <input
              type="text"
              value={auth.apiKeyName ?? ''}
              onChange={(e) => setAuth({ apiKeyName: e.target.value })}
              placeholder="e.g. X-API-Key"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Key Value</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={auth.apiKeyValue ?? ''}
                onChange={(e) => setAuth({ apiKeyValue: e.target.value })}
                placeholder="Enter API key value"
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-400"
              />
              <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Send In</label>
            <div className="flex gap-2">
              {(['header', 'query'] as const).map((p) => (
                <button key={p} onClick={() => setAuth({ apiKeyPlacement: p })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    (auth.apiKeyPlacement ?? 'header') === p
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}>
                  {p === 'header' ? 'Header' : 'Query Param'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Basic */}
      {auth.type === 'basic' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
            <input
              type="text"
              value={auth.basicUsername ?? ''}
              onChange={(e) => setAuth({ basicUsername: e.target.value })}
              placeholder="Username"
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={auth.basicPassword ?? ''}
                onChange={(e) => setAuth({ basicPassword: e.target.value })}
                placeholder="Password"
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {auth.type === 'none' && (
        <p className="text-xs text-gray-400 italic">No authentication required for this endpoint.</p>
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function RequestTabV1({ integration, onChange }: RequestTabV1Props) {
  const activeHeaderCount = integration.headers.filter((h) => h.enabled && h.key).length;

  return (
    <div className="space-y-4">

      {/* ── Row 1: Endpoint — full width ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={15} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Endpoint</h3>
        </div>
        <div className="flex gap-0 rounded-lg border border-gray-300 overflow-hidden">
          {(['GET', 'POST'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...integration, method: m })}
              className={`px-5 py-2.5 text-sm font-bold transition-colors border-r border-gray-300 flex-shrink-0 ${
                integration.method === m
                  ? m === 'GET' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  : 'text-gray-500 bg-white hover:bg-gray-50'
              }`}
            >
              {m}
            </button>
          ))}
          <input
            type="text"
            value={integration.url}
            onChange={(e) => onChange({ ...integration, url: e.target.value })}
            placeholder="https://api.example.com/v1/endpoint"
            className="flex-1 text-sm px-4 py-2.5 focus:outline-none font-mono placeholder:text-gray-400 min-w-0"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Enter the full URL of the API endpoint.</p>
      </div>

      {/* ── Row 2: Auth (left) + Headers (right) ── */}
      <div className="grid grid-cols-[3fr_2fr] gap-4 items-start">

        {/* Auth */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Authentication</h3>
            {integration.auth.type !== 'none' && (
              <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                Configured
              </span>
            )}
          </div>
          <AuthFields integration={integration} onChange={onChange} />
        </div>

        {/* Headers */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-1">
            <List size={15} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Request Headers</h3>
            {activeHeaderCount > 0 && (
              <span className="ml-auto text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                {activeHeaderCount} active
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">
            Auth headers are managed left. Add any additional headers here.
          </p>
          <SimpleKeyValueTable
            rows={integration.headers}
            onChange={(headers) => onChange({ ...integration, headers })}
            keyPlaceholder="Header name"
            valuePlaceholder="Value"
            addLabel="Add Header"
          />
        </div>

      </div>
    </div>
  );
}
