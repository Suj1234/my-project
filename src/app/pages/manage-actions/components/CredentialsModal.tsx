import { useState } from 'react';
import { X, KeyRound, Plus, Trash2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Credential, CredentialType, createDefaultCredential } from '../../../types/apiIntegration';

const MOCK_CREDENTIALS: Credential[] = [
  {
    id: 'cred-1',
    name: 'Bureau API Key',
    type: 'api_key',
    environment: 'production',
    values: { key: '••••••••••••••••' },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
    usedBy: ['api-1', 'api-3'],
  },
  {
    id: 'cred-2',
    name: 'KYC Service Bearer',
    type: 'bearer',
    environment: 'all',
    values: { token: '••••••••••••••••' },
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
    usedBy: ['api-2'],
  },
  {
    id: 'cred-3',
    name: 'Internal API Basic Auth',
    type: 'basic',
    environment: 'staging',
    values: { username: 'admin', password: '••••••••' },
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

const TYPE_LABELS: Record<CredentialType, string> = {
  api_key: 'API Key',
  basic: 'Basic Auth',
  bearer: 'Bearer Token',
  oauth2: 'OAuth 2.0',
  custom: 'Custom',
};

const ENV_COLORS: Record<string, string> = {
  all:         'bg-gray-100 text-gray-600',
  development: 'bg-blue-50 text-blue-600',
  staging:     'bg-yellow-50 text-yellow-700',
  production:  'bg-emerald-50 text-emerald-700',
};

interface CredentialsModalProps {
  onClose: () => void;
  onSelect?: (cred: Credential) => void;
}

export function CredentialsModal({ onClose, onSelect }: CredentialsModalProps) {
  const [credentials, setCredentials] = useState<Credential[]>(MOCK_CREDENTIALS);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Credential>(createDefaultCredential());
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const toggleShow = (id: string) =>
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    const newCred: Credential = {
      ...draft,
      id: `cred-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCredentials((prev) => [newCred, ...prev]);
    setCreating(false);
    setDraft(createDefaultCredential());
  };

  const handleDelete = (id: string) =>
    setCredentials((prev) => prev.filter((c) => c.id !== id));

  const updateDraft = (field: keyof Credential, value: any) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const updateDraftValue = (key: string, val: string) =>
    setDraft((prev) => ({ ...prev, values: { ...prev.values, [key]: val } }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B6B5A' }}>
              <ShieldCheck size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Credential Store</h2>
              <p className="text-xs text-gray-500">Manage reusable, encrypted API credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Credential list */}
          {credentials.length > 0 && (
            <div className="space-y-2">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className={`border border-gray-200 rounded-lg p-4 transition-colors ${
                    onSelect ? 'hover:border-teal-400 cursor-pointer hover:bg-teal-50/30' : ''
                  }`}
                  onClick={() => onSelect?.(cred)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center">
                        <KeyRound size={13} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{cred.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {TYPE_LABELS[cred.type]}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${ENV_COLORS[cred.environment]}`}>
                            {cred.environment}
                          </span>
                          {cred.usedBy && cred.usedBy.length > 0 && (
                            <span className="text-[10px] text-gray-400">
                              Used by {cred.usedBy.length} integration{cred.usedBy.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleShow(cred.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title={showValues[cred.id] ? 'Hide values' : 'Show values'}
                      >
                        {showValues[cred.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        onClick={() => handleDelete(cred.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {showValues[cred.id] && (
                    <div className="mt-3 pl-10 space-y-1">
                      {Object.entries(cred.values).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-gray-500 capitalize">{k}:</span>
                          <span className="text-gray-700">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create new */}
          {creating ? (
            <div className="border-2 border-dashed border-teal-300 rounded-lg p-4 bg-teal-50/30 space-y-3">
              <p className="text-xs font-semibold text-gray-700">New Credential</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Name *</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft('name', e.target.value)}
                    placeholder="e.g. Bureau API Key"
                    className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Type</label>
                  <select
                    value={draft.type}
                    onChange={(e) => updateDraft('type', e.target.value as CredentialType)}
                    className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Environment</label>
                  <select
                    value={draft.environment}
                    onChange={(e) => updateDraft('environment', e.target.value)}
                    className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    <option value="all">All Environments</option>
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              {/* Dynamic value fields per type */}
              <div className="space-y-2">
                {draft.type === 'api_key' && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">API Key Value *</label>
                    <input
                      type="password"
                      value={draft.values.key ?? ''}
                      onChange={(e) => updateDraftValue('key', e.target.value)}
                      placeholder="sk_live_••••••••"
                      className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}
                {draft.type === 'bearer' && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Bearer Token *</label>
                    <input
                      type="password"
                      value={draft.values.token ?? ''}
                      onChange={(e) => updateDraftValue('token', e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIs…"
                      className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}
                {draft.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Username *</label>
                      <input
                        type="text"
                        value={draft.values.username ?? ''}
                        onChange={(e) => updateDraftValue('username', e.target.value)}
                        className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Password *</label>
                      <input
                        type="password"
                        value={draft.values.password ?? ''}
                        onChange={(e) => updateDraftValue('password', e.target.value)}
                        className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}
                {draft.type === 'oauth2' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Client ID *</label>
                      <input
                        type="text"
                        value={draft.values.clientId ?? ''}
                        onChange={(e) => updateDraftValue('clientId', e.target.value)}
                        className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Client Secret *</label>
                      <input
                        type="password"
                        value={draft.values.clientSecret ?? ''}
                        onChange={(e) => updateDraftValue('clientSecret', e.target.value)}
                        className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Token URL *</label>
                      <input
                        type="text"
                        value={draft.values.tokenUrl ?? ''}
                        onChange={(e) => updateDraftValue('tokenUrl', e.target.value)}
                        placeholder="https://auth.provider.com/oauth/token"
                        className="mt-1 w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <ShieldCheck size={10} />
                Values are encrypted at rest and never exposed in logs or UI after saving.
              </p>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setCreating(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!draft.name.trim()}
                  className="text-xs text-white"
                  style={{ backgroundColor: '#0B6B5A' }}
                >
                  Save Credential
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30 transition-colors"
            >
              <Plus size={13} />
              Add New Credential
            </button>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
