import { useState } from 'react';
import { Terminal, FileJson, Package } from 'lucide-react';
import { ApiIntegration, HttpMethod } from '../../../types/apiIntegration';
import { VariableInput } from '../components/VariableInput';
import { CurlImportModal } from '../components/CurlImportModal';

const METHODS: { value: HttpMethod; color: string }[] = [
  { value: 'GET',     color: 'text-emerald-600' },
  { value: 'POST',    color: 'text-blue-600' },
  { value: 'PUT',     color: 'text-yellow-600' },
  { value: 'PATCH',   color: 'text-orange-500' },
  { value: 'DELETE',  color: 'text-red-600' },
  { value: 'HEAD',    color: 'text-purple-600' },
  { value: 'OPTIONS', color: 'text-gray-600' },
];

const METHOD_COLORS: Record<HttpMethod, string> = Object.fromEntries(
  METHODS.map((m) => [m.value, m.color])
) as Record<HttpMethod, string>;

interface RequestTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

export function RequestTab({ integration, onChange }: RequestTabProps) {
  const [showCurlModal, setShowCurlModal] = useState(false);

  const update = (field: keyof ApiIntegration, value: any) =>
    onChange({ ...integration, [field]: value });

  const handleCurlImport = (partial: Partial<ApiIntegration>) => {
    onChange({ ...integration, ...partial });
  };

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Integration Name *</label>
          <input
            type="text"
            value={integration.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Credit Bureau Check"
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={integration.description ?? ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What does this API do?"
            rows={2}
            className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
          <input
            type="text"
            value={integration.tags.join(', ')}
            onChange={(e) =>
              update('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
            }
            placeholder="kyc, credit, identity"
            className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-400"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Comma-separated</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Import buttons */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Import from</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCurlModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
          >
            <Terminal size={13} />
            cURL Command
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-gray-200 rounded-lg text-gray-300 cursor-not-allowed"
            title="Coming soon"
          >
            <FileJson size={13} />
            OpenAPI / Swagger
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 text-xs border border-dashed border-gray-200 rounded-lg text-gray-300 cursor-not-allowed"
            title="Coming soon"
          >
            <Package size={13} />
            Postman Collection
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Method + URL */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Request *</label>
        <div className="flex gap-2 items-start">
          {/* Method select */}
          <div className="relative flex-shrink-0">
            <select
              value={integration.method}
              onChange={(e) => update('method', e.target.value as HttpMethod)}
              className={`appearance-none text-xs font-bold border border-gray-200 rounded-md pl-3 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white cursor-pointer ${METHOD_COLORS[integration.method]}`}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value} className={m.color}>
                  {m.value}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* URL */}
          <div className="flex-1">
            <VariableInput
              value={integration.url}
              onChange={(v) => update('url', v)}
              placeholder="https://api.example.com/v1/{{journey.customerId}}/check"
            />
          </div>
        </div>

        {/* URL tips */}
        {integration.url && (
          <div className="mt-2 p-2.5 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-500 font-medium mb-1">Request Preview</p>
            <p className="text-[10px] font-mono text-gray-700 break-all">
              <span className={`font-bold mr-2 ${METHOD_COLORS[integration.method]}`}>
                {integration.method}
              </span>
              {integration.url}
            </p>
          </div>
        )}
      </div>

      {/* cURL import modal */}
      {showCurlModal && (
        <CurlImportModal
          onImport={handleCurlImport}
          onClose={() => setShowCurlModal(false)}
        />
      )}
    </div>
  );
}
