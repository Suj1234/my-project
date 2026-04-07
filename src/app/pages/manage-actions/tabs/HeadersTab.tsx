import { ApiIntegration } from '../../../types/apiIntegration';
import { KeyValueTable } from '../components/KeyValueTable';
import { Info } from 'lucide-react';

interface HeadersTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

const COMMON_HEADERS = [
  { key: 'Content-Type',    value: 'application/json' },
  { key: 'Accept',          value: 'application/json' },
  { key: 'X-Request-ID',    value: '{{system.uuid}}' },
  { key: 'X-Correlation-ID',value: '{{session.applicationId}}' },
  { key: 'Accept-Language', value: 'en-US' },
  { key: 'Cache-Control',   value: 'no-cache' },
];

export function HeadersTab({ integration, onChange }: HeadersTabProps) {
  const addCommonHeader = (key: string, value: string) => {
    const already = integration.headers.some((h) => h.key.toLowerCase() === key.toLowerCase());
    if (already) return;
    const newId = String(Math.max(0, ...integration.headers.map((h) => Number(h.id) || 0)) + 1);
    onChange({
      ...integration,
      headers: [...integration.headers, { id: newId, key, value, enabled: true }],
    });
  };

  return (
    <div className="space-y-5">
      {/* Note */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Authentication headers are managed separately in the <strong>Auth</strong> tab.
          Use <code className="bg-blue-100 px-1 rounded">{`{{variables}}`}</code> in values for dynamic data.
        </p>
      </div>

      {/* Common headers shortcuts */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Quick Add Common Headers</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_HEADERS.map((h) => {
            const exists = integration.headers.some((ih) => ih.key.toLowerCase() === h.key.toLowerCase());
            return (
              <button
                key={h.key}
                onClick={() => addCommonHeader(h.key, h.value)}
                disabled={exists}
                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                  exists
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50'
                }`}
              >
                + {h.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Headers table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">
            Headers
            <span className="ml-2 text-[10px] text-gray-400 font-normal">
              ({integration.headers.filter((h) => h.enabled).length} active)
            </span>
          </p>
        </div>
        <KeyValueTable
          rows={integration.headers}
          onChange={(headers) => onChange({ ...integration, headers })}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
          addLabel="Add Header"
          showDescription
        />
      </div>
    </div>
  );
}
