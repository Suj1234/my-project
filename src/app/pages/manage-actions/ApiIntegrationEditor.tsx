import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiIntegration, createDefaultIntegration } from '../../types/apiIntegration';
import { Button } from '../../components/ui/button';
import { RequestTab } from './tabs/RequestTab';
import { AuthTab } from './tabs/AuthTab';
import { HeadersTab } from './tabs/HeadersTab';
import { ParamsTab } from './tabs/ParamsTab';
import { BodyTab } from './tabs/BodyTab';
import { ResponseTab } from './tabs/ResponseTab';
import { AdvancedTab } from './tabs/AdvancedTab';
import { TestTab } from './tabs/TestTab';

type TabId = 'request' | 'auth' | 'headers' | 'params' | 'body' | 'response' | 'advanced' | 'test';

const TABS: { id: TabId; label: string }[] = [
  { id: 'request',  label: 'Request' },
  { id: 'auth',     label: 'Auth' },
  { id: 'headers',  label: 'Headers' },
  { id: 'params',   label: 'Params' },
  { id: 'body',     label: 'Body' },
  { id: 'response', label: 'Response' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'test',     label: 'Test' },
];

const NO_BODY_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function getTabBadge(tab: TabId, integration: ApiIntegration): string | null {
  if (tab === 'headers') {
    const count = integration.headers.filter((h) => h.enabled && h.key).length;
    return count > 0 ? String(count) : null;
  }
  if (tab === 'params') {
    const count = integration.queryParams.filter((p) => p.enabled && p.key).length;
    return count > 0 ? String(count) : null;
  }
  if (tab === 'auth' && integration.auth.type !== 'none') return '✓';
  if (tab === 'body' && integration.body.contentType !== 'none' && !NO_BODY_METHODS.includes(integration.method)) return '✓';
  if (tab === 'response' && integration.response.mappings.length > 0) return String(integration.response.mappings.length);
  if (tab === 'advanced' && integration.advanced.executionMode !== 'sync') return integration.advanced.executionMode.replace('async_', '');
  return null;
}

interface ApiIntegrationEditorProps {
  integration?: ApiIntegration;
  onBack: () => void;
  onSave: (integration: ApiIntegration) => void;
}

export function ApiIntegrationEditor({ integration: initial, onBack, onSave }: ApiIntegrationEditorProps) {
  const [integration, setIntegration] = useState<ApiIntegration>(
    initial ?? {
      ...createDefaultIntegration(),
      id: `api-${Date.now()}`,
    }
  );
  const [activeTab, setActiveTab] = useState<TabId>('request');
  const [saved, setSaved] = useState(false);

  const isNew = !initial;

  const handleSave = () => {
    onSave({ ...integration, updatedAt: new Date().toISOString(), status: 'active' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isValid = !!integration.name.trim() && !!integration.url.trim();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isNew ? 'New API Integration' : integration.name || 'Untitled Integration'}
            </h2>
            {!isNew && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Last updated: {new Date(integration.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
              integration.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : integration.status === 'draft'
                ? 'bg-gray-100 text-gray-600 border-gray-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {integration.status.toUpperCase()}
            </span>
          </div>

          {/* Save */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValid}
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: isValid ? '#0B6B5A' : undefined }}
          >
            {saved ? (
              <><CheckCircle2 size={12} />Saved</>
            ) : (
              <><Save size={12} />Save</>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6 bg-gray-50/50 overflow-x-auto">
        {TABS.map((tab) => {
          const badge = getTabBadge(tab.id, integration);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-teal-700 border-teal-600'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Validation warning */}
      {!isValid && (integration.name || integration.url) && (
        <div className="mx-6 mt-3 flex items-center gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle size={13} className="text-yellow-600 flex-shrink-0" />
          <p className="text-xs text-yellow-700">
            {!integration.name.trim() ? 'Integration name is required.' : 'Request URL is required.'}
          </p>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'request'  && <RequestTab  integration={integration} onChange={setIntegration} />}
        {activeTab === 'auth'     && <AuthTab      integration={integration} onChange={setIntegration} />}
        {activeTab === 'headers'  && <HeadersTab   integration={integration} onChange={setIntegration} />}
        {activeTab === 'params'   && <ParamsTab    integration={integration} onChange={setIntegration} />}
        {activeTab === 'body'     && <BodyTab      integration={integration} onChange={setIntegration} />}
        {activeTab === 'response' && <ResponseTab  integration={integration} onChange={setIntegration} />}
        {activeTab === 'advanced' && <AdvancedTab  integration={integration} onChange={setIntegration} />}
        {activeTab === 'test'     && <TestTab      integration={integration} />}
      </div>
    </div>
  );
}
