import { useState } from 'react';
import {
  Plus, Globe, Search, Pencil, Trash2, GitMerge,
  CheckCircle2, Clock, XCircle, Lock, X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ApiIntegration, createDefaultIntegration, HttpMethod } from '../../types/apiIntegration';
import { ApiFlow, createDefaultFlow, IntegrationListItem } from '../../types/apiFlow';
import { ApiIntegrationEditor } from './ApiIntegrationEditor';
import { ApiFlowEditor } from './ApiFlowEditor';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ITEMS: IntegrationListItem[] = [
  {
    type: 'single',
    id: 'api-1',
    name: 'Credit Bureau Check',
    description: 'Fetch credit score and bureau report for applicant',
    tags: ['credit', 'bureau', 'kyc'],
    status: 'active',
    updatedAt: new Date().toISOString(),
    singleData: {
      ...createDefaultIntegration(),
      id: 'api-1',
      name: 'Credit Bureau Check',
      description: 'Fetch credit score and bureau report for applicant',
      tags: ['credit', 'bureau', 'kyc'],
      method: 'POST',
      url: 'https://api.bureau.com/v1/{{journey.pan_number}}/credit-check',
      auth: { type: 'bearer', bearerToken: '{{credentials.bureau_token}}' },
      status: 'active',
    },
  },
  {
    type: 'single',
    id: 'api-2',
    name: 'PAN Verification',
    description: 'Verify PAN card authenticity via NSDL',
    tags: ['pan', 'identity', 'kyc'],
    status: 'active',
    updatedAt: new Date().toISOString(),
    singleData: {
      ...createDefaultIntegration(),
      id: 'api-2',
      name: 'PAN Verification',
      description: 'Verify PAN card authenticity via NSDL',
      tags: ['pan', 'identity', 'kyc'],
      method: 'POST',
      url: 'https://api.kyc.com/v2/pan/verify',
      auth: { type: 'api_key', apiKeyName: 'X-API-Key', apiKeyValue: '{{credentials.kyc_api_key}}', apiKeyPlacement: 'header' },
      status: 'active',
    },
  },
  {
    type: 'flow',
    id: 'flow-1',
    name: 'DigiLocker Document Download',
    description: 'Multi-step: Link account → User consent redirect → Fetch document list → Download documents',
    tags: ['digilocker', 'kyc', 'oauth'],
    status: 'active',
    updatedAt: new Date().toISOString(),
    flowData: {
      id: 'flow-1',
      name: 'DigiLocker Document Download',
      description: 'Multi-step: Link account → User consent redirect → Fetch document list → Download documents',
      tags: ['digilocker', 'kyc', 'oauth'],
      status: 'active',
      sharedAuth: { type: 'api_key', apiKeyName: 'x-api-key', apiKeyValue: '{{credentials.perfios_api_key}}', apiKeyPlacement: 'header' },
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    type: 'flow',
    id: 'flow-2',
    name: 'Account Aggregator — Bank Statement',
    description: 'RBI AA consent flow: create session → customer consent → fetch bank transactions',
    tags: ['aa', 'bank-statement', 'consent'],
    status: 'draft',
    updatedAt: new Date().toISOString(),
    flowData: {
      id: 'flow-2',
      name: 'Account Aggregator — Bank Statement',
      description: 'RBI AA consent flow: create session → customer consent → fetch bank transactions',
      tags: ['aa', 'bank-statement', 'consent'],
      status: 'draft',
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
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

const STATUS_ICON = {
  active:   <CheckCircle2 size={11} className="text-emerald-500" />,
  draft:    <Clock size={11} className="text-gray-400" />,
  inactive: <XCircle size={11} className="text-red-400" />,
};

const AUTH_LABEL: Record<string, string> = {
  none: 'No Auth', bearer: 'Bearer', api_key: 'API Key',
  basic: 'Basic', oauth2: 'OAuth 2.0', aws_sig4: 'AWS Sig4',
  digest: 'Digest', custom_header: 'Custom',
};

// ─── New Integration Modal ────────────────────────────────────────────────────

function NewIntegrationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (type: 'single' | 'flow') => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-gray-900">New API Integration</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-5">Choose how many APIs you need to integrate:</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Single */}
          <button
            onClick={() => onCreate('single')}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/30 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center mb-3 transition-colors">
              <Globe size={16} className="text-gray-500 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-800 mb-1">Single API</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              One API call — configure method, URL, auth, headers, body, response mappings, and advanced settings.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['Request', 'Auth', 'Headers', 'Body', 'Response', 'Advanced', 'Test'].map((t) => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t}</span>
              ))}
            </div>
          </button>

          {/* Flow */}
          <button
            onClick={() => onCreate('flow')}
            className="flex flex-col items-start p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/30 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center mb-3 transition-colors">
              <GitMerge size={16} className="text-gray-500 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-800 mb-1">API Flow</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Multiple APIs called in sequence — chain API calls, redirects, transforms, and conditions. Data passes between steps.
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              {['API Call', 'Redirect', 'Wait', 'Transform', 'Condition'].map((t) => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t}</span>
              ))}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── List Item Card ───────────────────────────────────────────────────────────

function IntegrationCard({
  item,
  onEdit,
  onDelete,
}: {
  item: IntegrationListItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSingle = item.type === 'single';
  const single = item.singleData;
  const flow = item.flowData;

  return (
    <div
      className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all group bg-white cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSingle ? 'bg-blue-50' : 'bg-teal-50'}`}>
            {isSingle
              ? <Globe size={16} className="text-blue-500" />
              : <GitMerge size={16} className="text-teal-600" />
            }
          </div>

          <div className="min-w-0">
            {/* Name + status + type badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
              {/* Type badge */}
              <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${
                isSingle
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}>
                {isSingle ? 'Single API' : 'API Flow'}
              </span>
              {/* Status */}
              <div className="flex items-center gap-1">
                {STATUS_ICON[item.status]}
                <span className="text-[10px] text-gray-500 capitalize">{item.status}</span>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xl">{item.description}</p>
            )}

            {/* Single: method + URL */}
            {isSingle && single && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_COLORS[single.method]}`}>
                  {single.method}
                </span>
                <span className="text-[10px] font-mono text-gray-500 truncate max-w-sm">{single.url}</span>
              </div>
            )}

            {/* Flow: step count */}
            {!isSingle && flow && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-gray-500">
                  {flow.steps.length} step{flow.steps.length !== 1 ? 's' : ''}
                </span>
                {flow.sharedAuth && flow.sharedAuth.type !== 'none' && (
                  <span className="flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                    <Lock size={8} /> Shared {AUTH_LABEL[flow.sharedAuth.type] ?? flow.sharedAuth.type}
                  </span>
                )}
              </div>
            )}

            {/* Auth badge (single) */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {isSingle && single && single.auth.type !== 'none' && (
                <span className="flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                  <Lock size={8} />
                  {AUTH_LABEL[single.auth.type] ?? single.auth.type}
                </span>
              )}
              {/* Tags */}
              {item.tags.map((tag) => (
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
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type EditingState =
  | { mode: 'list' }
  | { mode: 'single'; item: ApiIntegration | 'new' }
  | { mode: 'flow'; item: ApiFlow | 'new' };

export function ApiIntegrationsPage() {
  const [items, setItems] = useState<IntegrationListItem[]>(MOCK_ITEMS);
  const [editing, setEditing] = useState<EditingState>({ mode: 'list' });
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const handleCreate = (type: 'single' | 'flow') => {
    setShowNewModal(false);
    if (type === 'single') {
      setEditing({ mode: 'single', item: 'new' });
    } else {
      setEditing({ mode: 'flow', item: 'new' });
    }
  };

  const handleSaveSingle = (integration: ApiIntegration) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === integration.id);
      const listItem: IntegrationListItem = {
        type: 'single',
        id: integration.id,
        name: integration.name,
        description: integration.description,
        tags: integration.tags,
        status: integration.status,
        updatedAt: integration.updatedAt,
        singleData: integration,
      };
      return exists ? prev.map((i) => (i.id === integration.id ? listItem : i)) : [listItem, ...prev];
    });
    setEditing({ mode: 'list' });
  };

  const handleSaveFlow = (flow: ApiFlow) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === flow.id);
      const listItem: IntegrationListItem = {
        type: 'flow',
        id: flow.id,
        name: flow.name,
        description: flow.description,
        tags: flow.tags,
        status: flow.status,
        updatedAt: flow.updatedAt,
        flowData: flow,
      };
      return exists ? prev.map((i) => (i.id === flow.id ? listItem : i)) : [listItem, ...prev];
    });
    setEditing({ mode: 'list' });
  };

  const handleDelete = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  // ── Sub-views ──
  if (editing.mode === 'single') {
    return (
      <ApiIntegrationEditor
        integration={editing.item === 'new' ? undefined : editing.item}
        onBack={() => setEditing({ mode: 'list' })}
        onSave={handleSaveSingle}
      />
    );
  }

  if (editing.mode === 'flow') {
    return (
      <ApiFlowEditor
        flow={editing.item === 'new' ? undefined : editing.item}
        onBack={() => setEditing({ mode: 'list' })}
        onSave={handleSaveFlow}
      />
    );
  }

  // ── List view ──
  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const singleCount = items.filter((i) => i.type === 'single').length;
  const flowCount = items.filter((i) => i.type === 'flow').length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Page header */}
      <div className="px-8 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">API Integrations</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {singleCount} single API{singleCount !== 1 ? 's' : ''} · {flowCount} flow{flowCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewModal(true)}
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: '#0B6B5A' }}
          >
            <Plus size={13} />
            New Integration
          </Button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="px-8 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
        <div className="relative w-80">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag, or description..."
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
                onClick={() => setShowNewModal(true)}
                className="mt-4 gap-2 text-xs text-white"
                style={{ backgroundColor: '#0B6B5A' }}
              >
                <Plus size={13} /> New Integration
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((item) => (
              <IntegrationCard
                key={item.id}
                item={item}
                onEdit={() => {
                  if (item.type === 'single' && item.singleData) {
                    setEditing({ mode: 'single', item: item.singleData });
                  } else if (item.type === 'flow' && item.flowData) {
                    setEditing({ mode: 'flow', item: item.flowData });
                  }
                }}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New modal */}
      {showNewModal && (
        <NewIntegrationModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
