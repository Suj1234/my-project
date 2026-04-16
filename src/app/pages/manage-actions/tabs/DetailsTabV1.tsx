import { FileText, Lightbulb, CheckCircle2 } from 'lucide-react';
import { ApiIntegrationV1 } from '../../../types/apiIntegrationV1';

interface DetailsTabV1Props {
  integration: ApiIntegrationV1;
  onChange: (updated: ApiIntegrationV1) => void;
}

export function DetailsTabV1({ integration, onChange }: DetailsTabV1Props) {
  return (
    <div className="grid grid-cols-[2fr_1fr] gap-6 items-start">

      {/* ── Left: Form ── */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Basic Information</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Integration Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={integration.name}
              onChange={(e) => onChange({ ...integration, name: e.target.value })}
              placeholder="e.g. Credit Bureau Check"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1.5">A unique name to identify this integration across the platform.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={integration.description}
              onChange={(e) => onChange({ ...integration, description: e.target.value })}
              placeholder="What does this integration do? Which external API does it call and why?"
              rows={5}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={integration.status}
              onChange={(e) => onChange({ ...integration, status: e.target.value as 'active' | 'inactive' })}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="text-xs text-gray-400 mt-1.5">Only active integrations can be used in journey blocks.</p>
          </div>
        </div>
      </div>

      {/* ── Right: Guidance ── */}
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-blue-600" />
            <p className="text-sm font-semibold text-blue-800">Tips</p>
          </div>
          <ul className="space-y-2.5">
            {[
              'Use a clear, descriptive name — it will appear in journey block selection.',
              'The description helps your team understand what this API does without opening it.',
              'Name should reflect the business action, e.g. "PAN Verification" not "API 1".',
              'Set Status to Inactive to disable an integration without deleting it.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-gray-600 mb-3">After Details, configure:</p>
          <ol className="space-y-2">
            {['Endpoint — URL, method, auth, headers', 'Payload — body/params and expected response', 'Try It — run the API and verify it works'].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

    </div>
  );
}
