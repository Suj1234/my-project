import { useState } from 'react';
import {
  Plus, Globe, Search, Eye, Pencil, Trash2,
  CheckCircle2, Clock, XCircle, Zap, Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ApiIntegration, createDefaultIntegration, HttpMethod } from '../../types/apiIntegration';
import { ApiIntegrationEditor } from './ApiIntegrationEditor';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INTEGRATIONS: ApiIntegration[] = [
  {
    ...createDefaultIntegration(),
    id: 'api-1',
    name: 'Credit Bureau Check',
    description: 'Fetch credit score and bureau report for applicant',
    tags: ['credit', 'bureau', 'kyc'],
    method: 'POST',
    url: 'https://api.bureau.com/v1/{{journey.pan_number}}/credit-check',
    auth: { type: 'bearer', bearerToken: '{{credentials.bureau_token}}' },
    status: 'active',
    advanced: { ...createDefaultIntegration().advanced, executionMode: 'sync' },
  },
  {
    ...createDefaultIntegration(),
    id: 'api-2',
    name: 'PAN Verification',
    description: 'Verify PAN card authenticity via NSDL',
    tags: ['pan', 'identity', 'kyc'],
    method: 'POST',
    url: 'https://api.kyc.com/v2/pan/verify',
    auth: { type: 'api_key', apiKeyName: 'X-API-Key', apiKeyValue: '{{credentials.kyc_api_key}}', apiKeyPlacement: 'header' },
    status: 'active',
    advanced: { ...createDefaultIntegration().advanced, executionMode: 'sync' },
  },
  {
    ...createDefaultIntegration(),
    id: 'api-3',
    name: 'Bank Statement Analysis',
    description: 'Analyze bank statements via Perfios Insights API',
    tags: ['bank', 'financial', 'analysis'],
    method: 'POST',
    url: 'https://insights.perfios.com/v3/analyse',
    auth: { type: 'oauth2', oauth2GrantType: 'client_credentials', oauth2TokenUrl: 'https://auth.perfios.com/token' },
    status: 'active',
    advanced: { ...createDefaultIntegration().advanced, executionMode: 'async_callback' },
  },
  {
    ...createDefaultIntegration(),
    id: 'api-4',
    name: 'Send SMS Notification',
    description: 'Dispatch OTP or journey status SMS',
    tags: ['sms', 'notification'],
    method: 'POST',
    url: 'https://api.sms.com/send',
    auth: { type: 'basic', basicUsername: '{{credentials.sms_user}}', basicPassword: '{{credentials.sms_pass}}' },
    status: 'active',
    advanced: { ...createDefaultIntegration().advanced, executionMode: 'async_fire_forget' },
  },
  {
    ...createDefaultIntegration(),
    id: 'api-5',
    name: 'Address Pin Code Lookup',
    description: 'Validate and lookup address details by pincode',
    tags: ['address', 'pincode'],
    method: 'GET',
    url: 'https://api.postal.com/pincode/{{journey.pincode}}',
    auth: { type: 'none' },
    status: 'draft',
    advanced: { ...createDefaultIntegration().advanced, executionMode: 'sync' },
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  POST:    'bg-blue-50 text-blue-700 border-blue-200',
  PUT:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  PATCH:   'bg-orange-50 text-orange-700 border-orange-200',
  DELETE:  'bg-red-50 text-red-700 border-red-200',
  HEAD:    'bg-purple-50 text-purple-700 border-purple-200',
  OPTIONS: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_ICONS = {
  active:   <CheckCircle2 size={12} className="text-emerald-500" />,
  draft:    <Clock size={12} className="text-gray-400" />,
  inactive: <XCircle size={12} className="text-red-400" />,
};

const STATUS_LABELS = { active: 'Active', draft: 'Draft', inactive: 'Inactive' };

const EXEC_MODE_LABELS: Record<string, { label: string; color: string }> = {
  sync:               { label: 'Sync',         color: 'text-teal-600 bg-teal-50 border-teal-200' },
  async_fire_forget:  { label: 'Fire & Forget', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  async_callback:     { label: 'Callback',      color: 'text-purple-600 bg-purple-50 border-purple-200' },
  polling:            { label: 'Polling',        color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

const AUTH_TYPE_LABELS: Record<string, string> = {
  none:          'No Auth',
  bearer:        'Bearer',
  api_key:       'API Key',
  basic:         'Basic',
  oauth2:        'OAuth 2.0',
  aws_sig4:      'AWS Sig4',
  digest:        'Digest',
  custom_header: 'Custom',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ApiIntegrationPage() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>(MOCK_INTEGRATIONS);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ApiIntegration | 'new' | null>(null);

  const filtered = integrations.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.tags.some((t) => t.toLowerCase().includes(q)) ||
      i.url.toLowerCase().includes(q)
    );
  });

  const handleSave = (integration: ApiIntegration) => {
    setIntegrations((prev) => {
      const exists = prev.some((i) => i.id === integration.id);
      return exists
        ? prev.map((i) => (i.id === integration.id ? integration : i))
        : [integration, ...prev];
    });
    setEditing(null);
  };

  const handleDelete = (id: string) =>
    setIntegrations((prev) => prev.filter((i) => i.id !== id));

  // ── Editor view ──
  if (editing !== null) {
    return (
      <ApiIntegrationEditor
        integration={editing === 'new' ? undefined : editing}
        onBack={() => setEditing(null)}
        onSave={handleSave}
      />
    );
  }

  // ── List view ──
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Page header */}
      <div className="px-8 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">API Integrations</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {integrations.length} integration{integrations.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setEditing('new')}
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: '#0B6B5A' }}
          >
            <Plus size={13} />
            New Integration
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="relative w-80">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag, or URL..."
            className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Globe size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {search ? 'No integrations match your search' : 'No integrations yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Try a different search term' : 'Create your first API integration to get started'}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => setEditing('new')}
                className="mt-4 gap-2 text-xs text-white"
                style={{ backgroundColor: '#0B6B5A' }}
              >
                <Plus size={13} />
                New Integration
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((integration) => {
              const execMode = EXEC_MODE_LABELS[integration.advanced.executionMode] ?? EXEC_MODE_LABELS.sync;
              return (
                <div
                  key={integration.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group bg-white"
                >
                  <div className="flex items-start justify-between">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100">
                        <Globe size={16} className="text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        {/* Name + status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-800">{integration.name}</p>
                          <div className="flex items-center gap-1">
                            {STATUS_ICONS[integration.status]}
                            <span className="text-[10px] text-gray-500">{STATUS_LABELS[integration.status]}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {integration.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-lg">{integration.description}</p>
                        )}

                        {/* Method + URL */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_COLORS[integration.method]}`}>
                            {integration.method}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500 truncate max-w-xs">
                            {integration.url}
                          </span>
                        </div>

                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {/* Execution mode */}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${execMode.color}`}>
                            {execMode.label}
                          </span>

                          {/* Auth type */}
                          {integration.auth.type !== 'none' && (
                            <span className="flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                              <Lock size={8} />
                              {AUTH_TYPE_LABELS[integration.auth.type] ?? integration.auth.type}
                            </span>
                          )}

                          {/* Tags */}
                          {integration.tags.map((tag) => (
                            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <button
                        onClick={() => setEditing(integration)}
                        title="Edit"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(integration.id)}
                        title="Delete"
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
