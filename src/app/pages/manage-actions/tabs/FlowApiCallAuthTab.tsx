import { ShieldCheck, Info, Link } from 'lucide-react';
import { ApiIntegration, AuthConfig } from '../../../types/apiIntegration';
import { AuthTab } from './AuthTab';

interface FlowApiCallAuthTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
  useFlowAuth: boolean;
  onToggleFlowAuth: (v: boolean) => void;
  flowSharedAuth?: AuthConfig;
}

const AUTH_TYPE_LABELS: Record<string, string> = {
  none: 'No Auth', bearer: 'Bearer Token', api_key: 'API Key',
  basic: 'Basic Auth', oauth2: 'OAuth 2.0', aws_sig4: 'AWS Sig4',
  digest: 'Digest', custom_header: 'Custom Header',
};

export function FlowApiCallAuthTab({
  integration,
  onChange,
  useFlowAuth,
  onToggleFlowAuth,
  flowSharedAuth,
}: FlowApiCallAuthTabProps) {
  const hasFlowAuth = !!flowSharedAuth && flowSharedAuth.type !== 'none';

  return (
    <div className="space-y-4">
      {/* Flow Auth toggle — only show if flow has shared auth configured */}
      {hasFlowAuth && (
        <div className="p-3.5 border border-teal-200 rounded-xl bg-teal-50/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Link size={14} className="text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-teal-800">Use Flow-level Shared Auth</p>
                <p className="text-[10px] text-teal-700 mt-0.5">
                  Flow has shared auth configured:{' '}
                  <span className="font-semibold">
                    {AUTH_TYPE_LABELS[flowSharedAuth!.type] ?? flowSharedAuth!.type}
                  </span>
                  {flowSharedAuth?.apiKeyName && ` (${flowSharedAuth.apiKeyName})`}
                </p>
              </div>
            </div>
            {/* Toggle */}
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={useFlowAuth}
                onChange={(e) => onToggleFlowAuth(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${useFlowAuth ? 'bg-teal-500' : 'bg-gray-200'}`}
                onClick={() => onToggleFlowAuth(!useFlowAuth)}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    useFlowAuth ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Show flow auth details as read-only when toggled on */}
          {useFlowAuth && (
            <div className="mt-3 pt-3 border-t border-teal-200">
              <p className="text-[10px] text-teal-700 flex items-center gap-1.5">
                <ShieldCheck size={11} />
                This step will use the flow's shared auth. To override, toggle off above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* No flow auth set — informational banner */}
      {!hasFlowAuth && (
        <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex items-start gap-2">
          <Info size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-gray-500 leading-relaxed">
            No flow-level shared auth is configured. Configure it in{' '}
            <span className="font-semibold text-gray-600">Flow Settings → Shared Auth</span>{' '}
            to share auth across all steps, or configure auth per-step below.
          </p>
        </div>
      )}

      {/* Per-step auth — shown when not using flow auth */}
      {!useFlowAuth && (
        <AuthTab integration={integration} onChange={onChange} />
      )}
    </div>
  );
}
