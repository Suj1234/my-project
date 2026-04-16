import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiIntegrationV1, createDefaultIntegrationV1 } from '../../types/apiIntegrationV1';
import { Button } from '../../components/ui/button';
import { DetailsTabV1 } from './tabs/DetailsTabV1';
import { RequestTabV1 } from './tabs/RequestTabV1';
import { ParamsResponseTabV1 } from './tabs/ParamsResponseTabV1';
import { TestTabV1 } from './tabs/TestTabV1';

type TabId = 'details' | 'request' | 'params-response' | 'test';

const TABS: { id: TabId; label: string }[] = [
  { id: 'details',         label: 'Overview' },
  { id: 'request',         label: 'Endpoint' },
  { id: 'params-response', label: 'Payload' },
  { id: 'test',            label: 'Try It' },
];

interface ApiIntegrationEditorV1Props {
  integration?: ApiIntegrationV1;
  onBack: () => void;
  onSave: (integration: ApiIntegrationV1) => void;
}

export function ApiIntegrationEditorV1({ integration: initial, onBack, onSave }: ApiIntegrationEditorV1Props) {
  const [integration, setIntegration] = useState<ApiIntegrationV1>(
    initial ?? { ...createDefaultIntegrationV1(), id: `api-v1-${Date.now()}` }
  );
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [saved, setSaved]         = useState(false);

  const isNew   = !initial;
  const isValid = !!integration.name.trim() && !!integration.url.trim();

  const handleSave = () => {
    onSave({ ...integration, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isNew ? 'New API Integration' : integration.name || 'Untitled Integration'}
            </h2>
            {!isNew && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last updated: {new Date(integration.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!isValid}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {saved ? <><CheckCircle2 size={14} />Saved</> : <><Save size={14} />Save</>}
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 px-6 bg-white">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Validation warning ── */}
      {!isValid && (integration.name || integration.url) && (
        <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle size={14} className="text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            {!integration.name.trim()
              ? 'Integration name is required — fill it in the Overview tab.'
              : 'Request URL is required — fill it in the Endpoint tab.'}
          </p>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/40">
        {activeTab === 'details'         && <DetailsTabV1        integration={integration} onChange={setIntegration} />}
        {activeTab === 'request'         && <RequestTabV1        integration={integration} onChange={setIntegration} />}
        {activeTab === 'params-response' && <ParamsResponseTabV1 integration={integration} onChange={setIntegration} />}
        {activeTab === 'test'            && <TestTabV1           integration={integration} />}
      </div>

    </div>
  );
}
