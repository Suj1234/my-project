import { ApiIntegration, ExecutionMode, TlsMode, RedirectMode } from '../../../types/apiIntegration';
import { VariableInput } from '../components/VariableInput';
import { Info, Zap, Clock, RefreshCw, Shield, Wifi, GitMerge } from 'lucide-react';

interface AdvancedTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

const EXECUTION_MODES: { value: ExecutionMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'sync',
    label: 'Synchronous',
    description: 'Journey waits for response before continuing. Supports response mapping.',
    icon: <Clock size={14} />,
  },
  {
    value: 'async_fire_forget',
    label: 'Async — Fire & Forget',
    description: 'Request sent in background. Journey continues immediately. No response mapped.',
    icon: <Zap size={14} />,
  },
  {
    value: 'async_callback',
    label: 'Async — Callback',
    description: 'Journey pauses and waits for the external service to call back when ready.',
    icon: <GitMerge size={14} />,
  },
  {
    value: 'polling',
    label: 'Polling',
    description: 'Repeatedly checks a status endpoint until a success condition is met.',
    icon: <RefreshCw size={14} />,
  },
];

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <p className="text-xs font-semibold text-gray-700">{title}</p>
      </div>
      <div className="pl-5 space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div
          className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-gray-200'}`}
          onClick={() => onChange(!checked)}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </div>
      <div>
        <span className="text-xs text-gray-700 group-hover:text-gray-900">{label}</span>
        {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

export function AdvancedTab({ integration, onChange }: AdvancedTabProps) {
  const { advanced } = integration;

  const set = (updates: Partial<typeof advanced>) =>
    onChange({ ...integration, advanced: { ...advanced, ...updates } });

  const setRetry = (updates: Partial<typeof advanced.retry>) =>
    set({ retry: { ...advanced.retry, ...updates } });

  const setProxy = (updates: Partial<typeof advanced.proxy>) =>
    set({ proxy: { ...advanced.proxy, ...updates } });

  const setTls = (updates: Partial<typeof advanced.tls>) =>
    set({ tls: { ...advanced.tls, ...updates } });

  const setRetryOn = (field: keyof typeof advanced.retry.retryOn, val: boolean) =>
    setRetry({ retryOn: { ...advanced.retry.retryOn, [field]: val } });

  return (
    <div className="space-y-6">
      {/* Execution Mode */}
      <Section icon={<Zap size={13} />} title="Execution Mode">
        <div className="grid grid-cols-2 gap-2">
          {EXECUTION_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => set({ executionMode: mode.value })}
              className={`text-left p-3 rounded-lg border transition-all ${
                advanced.executionMode === mode.value
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`flex items-center gap-2 mb-1 ${advanced.executionMode === mode.value ? 'text-teal-700' : 'text-gray-600'}`}>
                {mode.icon}
                <span className="text-xs font-medium">{mode.label}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{mode.description}</p>
            </button>
          ))}
        </div>

        {/* Callback URL (for async_callback) */}
        {advanced.executionMode === 'async_callback' && (
          <div>
            <VariableInput
              label="Callback URL (sent to external service)"
              value={advanced.callbackUrl ?? ''}
              onChange={(v) => set({ callbackUrl: v })}
              placeholder="{{system.callbackUrl}}"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              The external service should POST results to this URL when processing is complete.
            </p>
          </div>
        )}

        {/* Polling config */}
        {advanced.executionMode === 'polling' && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Polling Configuration</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Interval (seconds)</label>
                <input
                  type="number"
                  value={advanced.pollingInterval ?? 10}
                  onChange={(e) => set({ pollingInterval: Number(e.target.value) })}
                  min={1} max={300}
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Poll Attempts</label>
                <input
                  type="number"
                  value={advanced.pollingMaxAttempts ?? 20}
                  onChange={(e) => set({ pollingMaxAttempts: Number(e.target.value) })}
                  min={1} max={100}
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Success Field Path</label>
                <input
                  type="text"
                  value={advanced.pollingSuccessPath ?? ''}
                  onChange={(e) => set({ pollingSuccessPath: e.target.value })}
                  placeholder="$.status"
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Success Value</label>
                <input
                  type="text"
                  value={advanced.pollingSuccessValue ?? ''}
                  onChange={(e) => set({ pollingSuccessValue: e.target.value })}
                  placeholder="COMPLETED"
                  className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      <div className="border-t border-gray-100" />

      {/* Timeout */}
      <Section icon={<Clock size={13} />} title="Timeout & Retry">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Request Timeout
              <span className="ml-1 text-gray-400 font-normal">(seconds)</span>
            </label>
            <input
              type="range"
              min={1} max={300}
              value={advanced.timeoutSeconds}
              onChange={(e) => set({ timeoutSeconds: Number(e.target.value) })}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>1s</span>
              <span className="font-medium text-teal-600">{advanced.timeoutSeconds}s</span>
              <span>300s</span>
            </div>
          </div>

          <div className="space-y-2">
            <Toggle
              checked={advanced.retry.enabled}
              onChange={(v) => setRetry({ enabled: v })}
              label="Enable Retry on Failure"
            />

            {advanced.retry.enabled && (
              <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Max Attempts</label>
                    <input
                      type="number"
                      value={advanced.retry.maxAttempts}
                      onChange={(e) => setRetry({ maxAttempts: Number(e.target.value) })}
                      min={1} max={10}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Delay (s)</label>
                    <input
                      type="number"
                      value={advanced.retry.delaySeconds}
                      onChange={(e) => setRetry({ delaySeconds: Number(e.target.value) })}
                      min={0} max={120}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-gray-500">Retry On</p>
                  {([
                    { key: 'status5xx',    label: '5xx Server Errors' },
                    { key: 'status4xx',    label: '4xx Client Errors' },
                    { key: 'timeout',      label: 'Timeout' },
                    { key: 'networkError', label: 'Network Error' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advanced.retry.retryOn[key]}
                        onChange={(e) => setRetryOn(key, e.target.checked)}
                        className="w-3 h-3 accent-teal-600"
                      />
                      <span className="text-[10px] text-gray-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      <div className="border-t border-gray-100" />

      {/* Redirects & Cookies */}
      <Section icon={<Wifi size={13} />} title="Redirects & Cookies">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Follow Redirects</label>
            <div className="space-y-1.5">
              {([
                { value: 'follow', label: 'Follow (up to 10)', hint: 'Automatic redirect following' },
                { value: 'manual', label: 'Manual', hint: 'Return redirect response as-is' },
                { value: 'error',  label: 'Error on Redirect', hint: 'Treat any redirect as failure' },
              ] as const).map((opt) => (
                <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="redirectMode"
                    value={opt.value}
                    checked={advanced.followRedirects === opt.value}
                    onChange={() => set({ followRedirects: opt.value })}
                    className="mt-0.5 accent-teal-600"
                  />
                  <div>
                    <span className="text-xs text-gray-700">{opt.label}</span>
                    <p className="text-[10px] text-gray-400">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Toggle
              checked={advanced.shareCookies}
              onChange={(v) => set({ shareCookies: v })}
              label="Share Cookies"
              hint="Share cookies with other API calls in the same journey run"
            />
            <Toggle
              checked={advanced.requestCompressed}
              onChange={(v) => set({ requestCompressed: v })}
              label="Request Compressed Response"
              hint="Adds Accept-Encoding: gzip, deflate header"
            />
          </div>
        </div>
      </Section>

      <div className="border-t border-gray-100" />

      {/* TLS */}
      <Section icon={<Shield size={13} />} title="TLS / SSL">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'standard',   label: 'Standard TLS',  desc: 'Default HTTPS' },
              { value: 'tls',        label: 'Custom TLS',    desc: 'Custom CA cert' },
              { value: 'mutual_tls', label: 'Mutual TLS',    desc: 'Client + server certs' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTls({ mode: opt.value })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  advanced.tls.mode === opt.value
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`text-[11px] font-medium ${advanced.tls.mode === opt.value ? 'text-teal-800' : 'text-gray-700'}`}>
                  {opt.label}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>

          <Toggle
            checked={advanced.tls.verifySsl}
            onChange={(v) => setTls({ verifySsl: v })}
            label="Verify SSL Certificate"
            hint="Disable only for internal/self-signed certificates"
          />

          {(advanced.tls.mode === 'tls' || advanced.tls.mode === 'mutual_tls') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CA Certificate (PEM)</label>
              <textarea
                value={advanced.tls.caCertificate ?? ''}
                onChange={(e) => setTls({ caCertificate: e.target.value })}
                rows={3}
                placeholder="-----BEGIN CERTIFICATE-----"
                className="w-full text-xs font-mono border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none placeholder:text-gray-300"
              />
            </div>
          )}

          {advanced.tls.mode === 'mutual_tls' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Certificate</label>
                <textarea
                  value={advanced.tls.clientCertificate ?? ''}
                  onChange={(e) => setTls({ clientCertificate: e.target.value })}
                  rows={3}
                  placeholder="-----BEGIN CERTIFICATE-----"
                  className="w-full text-xs font-mono border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Private Key</label>
                <textarea
                  value={advanced.tls.clientKey ?? ''}
                  onChange={(e) => setTls({ clientKey: e.target.value })}
                  rows={3}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                  className="w-full text-xs font-mono border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none placeholder:text-gray-300"
                />
              </div>
            </div>
          )}
        </div>
      </Section>

      <div className="border-t border-gray-100" />

      {/* Proxy */}
      <Section icon={<GitMerge size={13} />} title="Proxy">
        <Toggle
          checked={advanced.proxy.enabled}
          onChange={(v) => setProxy({ enabled: v })}
          label="Route through Proxy"
        />

        {advanced.proxy.enabled && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Proxy Host</label>
              <input
                type="text"
                value={advanced.proxy.host}
                onChange={(e) => setProxy({ host: e.target.value })}
                placeholder="proxy.internal.com"
                className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input
                type="number"
                value={advanced.proxy.port}
                onChange={(e) => setProxy({ port: Number(e.target.value) })}
                min={1} max={65535}
                placeholder="8080"
                className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Username (optional)</label>
              <input
                type="text"
                value={advanced.proxy.username ?? ''}
                onChange={(e) => setProxy({ username: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password (optional)</label>
              <input
                type="password"
                value={advanced.proxy.password ?? ''}
                onChange={(e) => setProxy({ password: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
