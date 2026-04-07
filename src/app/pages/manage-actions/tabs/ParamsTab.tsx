import { ApiIntegration } from '../../../types/apiIntegration';
import { KeyValueTable } from '../components/KeyValueTable';
import { Info } from 'lucide-react';

interface ParamsTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

export function ParamsTab({ integration, onChange }: ParamsTabProps) {
  // Parse existing URL to detect query params already in URL
  const urlHasQs = integration.url.includes('?');

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Query parameters are appended to the URL as <code className="bg-blue-100 px-1 rounded">?key=value&key2=value2</code>.
          {urlHasQs && (
            <span className="block mt-0.5 text-yellow-700">
              ⚠ Your URL already contains a <code className="bg-yellow-100 px-0.5 rounded">?</code> — params defined here will be merged.
            </span>
          )}
        </p>
      </div>

      {/* Live URL preview */}
      {(integration.url || integration.queryParams.length > 0) && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">URL Preview</p>
          <p className="text-xs font-mono text-gray-700 break-all">
            {integration.url || '(no URL set)'}
            {integration.queryParams.filter((p) => p.enabled && p.key).length > 0 && (
              <span className="text-teal-600">
                {urlHasQs ? '&' : '?'}
                {integration.queryParams
                  .filter((p) => p.enabled && p.key)
                  .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
                  .join('&')}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Params table */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">
          Query Parameters
          <span className="ml-2 text-[10px] text-gray-400 font-normal">
            ({integration.queryParams.filter((p) => p.enabled).length} active)
          </span>
        </p>
        <KeyValueTable
          rows={integration.queryParams}
          onChange={(queryParams) => onChange({ ...integration, queryParams })}
          keyPlaceholder="Parameter name"
          valuePlaceholder="Value"
          addLabel="Add Parameter"
          showDescription
        />
      </div>
    </div>
  );
}
