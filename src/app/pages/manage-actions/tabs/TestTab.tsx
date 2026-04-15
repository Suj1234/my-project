import { useState, useRef } from 'react';
import {
  Play, Copy, CheckCircle2, Info, ChevronDown, ChevronRight,
  Clock, AlertTriangle, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { ApiIntegration, VARIABLE_SUGGESTIONS } from '../../../types/apiIntegration';
import { Button } from '../../../components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestPreview {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  bodyParsed?: unknown;
  isJson: boolean;
  durationMs: number;
  size: number; // bytes
}

type TestState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'success'; response: ApiResponse }
  | { phase: 'error'; message: string; isCors: boolean; response?: ApiResponse };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveVariables(text: string, sampleVars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => sampleVars[path] ?? `{{${path}}}`);
}

function buildPreview(integration: ApiIntegration, sampleVars: Record<string, string>): RequestPreview {
  const resolve = (t: string) => resolveVariables(t, sampleVars);
  const headers: Record<string, string> = {};

  const { auth } = integration;
  if (auth.type === 'bearer' && auth.bearerToken) {
    headers['Authorization'] = `Bearer ${resolve(auth.bearerToken)}`;
  } else if (auth.type === 'basic' && auth.basicUsername) {
    const encoded = btoa(`${resolve(auth.basicUsername)}:${resolve(auth.basicPassword ?? '')}`);
    headers['Authorization'] = `Basic ${encoded}`;
  } else if (auth.type === 'api_key' && auth.apiKeyName && auth.apiKeyPlacement === 'header') {
    headers[auth.apiKeyName] = resolve(auth.apiKeyValue ?? '');
  } else if (auth.type === 'custom_header' && auth.customHeaderName) {
    headers[auth.customHeaderName] = resolve(auth.customHeaderValue ?? '');
  }

  integration.headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) => { headers[h.key] = resolve(h.value); });

  let url = resolve(integration.url);
  const activeParams = integration.queryParams.filter((p) => p.enabled && p.key);
  if (auth.type === 'api_key' && auth.apiKeyName && auth.apiKeyPlacement === 'query') {
    activeParams.push({ id: '_auth', key: auth.apiKeyName, value: resolve(auth.apiKeyValue ?? ''), enabled: true });
  }
  if (activeParams.length > 0) {
    const qs = activeParams
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(resolve(p.value))}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  let body: string | undefined;
  if (integration.body.contentType !== 'none' && !['GET', 'HEAD', 'OPTIONS'].includes(integration.method)) {
    headers['Content-Type'] = integration.body.contentType === 'custom'
      ? (integration.body.customContentType ?? 'application/octet-stream')
      : integration.body.contentType;

    if (integration.body.inputMode === 'raw' || integration.body.formFields.length === 0) {
      body = resolve(integration.body.rawValue);
    } else {
      const obj: Record<string, string> = {};
      integration.body.formFields.filter((f) => f.enabled).forEach((f) => {
        obj[f.key] = resolve(f.value);
      });
      body = JSON.stringify(obj, null, 2);
    }
  }

  return { method: integration.method, url, headers, body };
}

function extractVariables(integration: ApiIntegration): string[] {
  const allText = [
    integration.url,
    integration.body.rawValue,
    ...integration.headers.map((h) => `${h.key}:${h.value}`),
    ...integration.queryParams.map((p) => `${p.key}=${p.value}`),
    integration.auth.bearerToken ?? '',
    integration.auth.apiKeyValue ?? '',
    integration.auth.basicUsername ?? '',
    integration.auth.basicPassword ?? '',
    integration.auth.oauth2ClientId ?? '',
    integration.auth.oauth2ClientSecret ?? '',
    integration.auth.customHeaderValue ?? '',
    ...integration.body.formFields.map((f) => f.value),
  ].join(' ');

  const matches = allText.match(/\{\{([^}]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (status >= 300 && status < 400) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (status >= 400 && status < 500) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ children, language = 'text', maxHeight = 'max-h-64' }: {
  children: string;
  language?: string;
  maxHeight?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className={`bg-gray-950 text-green-300 text-[10px] font-mono p-3 rounded-xl overflow-x-auto overflow-y-auto ${maxHeight} leading-relaxed whitespace-pre-wrap break-all`}>
        {children}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1 rounded bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <CheckCircle2 size={11} className="text-teal-400" /> : <Copy size={11} />}
      </button>
    </div>
  );
}

// ─── Response Panel ───────────────────────────────────────────────────────────

function ResponsePanel({ response }: { response: ApiResponse }) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
  const [headersOpen] = useState(true);

  const bodyDisplay = response.isJson && response.bodyParsed !== undefined
    ? JSON.stringify(response.bodyParsed, null, 2)
    : response.body;

  const headersStr = Object.entries(response.headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500">
          <Clock size={10} />
          {response.durationMs}ms
        </span>
        <span className="text-[10px] text-gray-500">{formatBytes(response.size)}</span>
        {response.status >= 200 && response.status < 300 ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
            <CheckCircle size={11} /> Success
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-red-500">
            <XCircle size={11} /> Failed
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit">
        {(['body', 'headers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'body' ? 'Response Body' : `Headers (${Object.keys(response.headers).length})`}
          </button>
        ))}
      </div>

      {/* Body */}
      {activeTab === 'body' && (
        <CodeBlock maxHeight="max-h-96">
          {bodyDisplay || '(empty response body)'}
        </CodeBlock>
      )}

      {/* Headers */}
      {activeTab === 'headers' && (
        <CodeBlock maxHeight="max-h-64">
          {headersStr || '(no headers)'}
        </CodeBlock>
      )}
    </div>
  );
}

// ─── Main TestTab ─────────────────────────────────────────────────────────────

interface TestTabProps {
  integration: ApiIntegration;
  // Optional: variables already resolved from parent (used in flow steps)
  extraVars?: Record<string, string>;
}

export function TestTab({ integration, extraVars }: TestTabProps) {
  const usedVars = extractVariables(integration);
  const initialSamples = Object.fromEntries(
    usedVars.map((path) => {
      const suggestion = VARIABLE_SUGGESTIONS.find((s) => s.path === path);
      return [path, suggestion?.example ?? ''];
    })
  );

  const [sampleVars, setSampleVars] = useState<Record<string, string>>(initialSamples);
  const [testState, setTestState] = useState<TestState>({ phase: 'idle' });
  const [preview, setPreview] = useState<RequestPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isReady = !!integration.url && !!integration.method;
  const mergedVars = { ...sampleVars, ...(extraVars ?? {}) };

  // ── Build preview ──
  const handleBuildPreview = () => {
    const p = buildPreview(integration, mergedVars);
    setPreview(p);
    setShowPreview(true);
  };

  // ── Send real request ──
  const handleSend = async () => {
    const p = buildPreview(integration, mergedVars);
    setPreview(p);
    setTestState({ phase: 'running' });

    abortRef.current = new AbortController();
    const startTime = performance.now();

    try {
      const fetchOptions: RequestInit = {
        method: p.method,
        headers: p.headers,
        signal: abortRef.current.signal,
      };

      if (p.body && !['GET', 'HEAD', 'OPTIONS'].includes(p.method)) {
        fetchOptions.body = p.body;
      }

      const res = await fetch(p.url, fetchOptions);
      const durationMs = Math.round(performance.now() - startTime);

      // Collect response headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => { resHeaders[key] = value; });

      const bodyText = await res.text();
      const size = new Blob([bodyText]).size;

      let bodyParsed: unknown;
      let isJson = false;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json') || ct.includes('text/json')) {
        try {
          bodyParsed = JSON.parse(bodyText);
          isJson = true;
        } catch {
          isJson = false;
        }
      }

      const response: ApiResponse = {
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        headers: resHeaders,
        body: bodyText,
        bodyParsed,
        isJson,
        durationMs,
        size,
      };

      setTestState({ phase: 'success', response });

    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        setTestState({ phase: 'idle' });
        return;
      }

      const durationMs = Math.round(performance.now() - startTime);
      const message = (err as Error)?.message ?? 'Unknown error';

      // Detect CORS — TypeError with "Failed to fetch" is the browser's CORS error signal
      const isCors =
        err instanceof TypeError &&
        (message.includes('Failed to fetch') ||
          message.includes('NetworkError') ||
          message.includes('CORS') ||
          message.includes('Load failed'));

      setTestState({ phase: 'error', message, isCors });
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setTestState({ phase: 'idle' });
  };

  // ── cURL string ──
  const curlStr = preview
    ? [
        `curl -X ${preview.method} \\`,
        `  "${preview.url}" \\`,
        ...Object.entries(preview.headers).map(([k, v]) => `  -H "${k}: ${v}" \\`),
        preview.body ? `  -d '${preview.body}'` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <div className="space-y-5">
      {/* Not ready */}
      {!isReady && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <Info size={13} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            Configure the <strong>Request</strong> tab (URL + method) before sending.
          </p>
        </div>
      )}

      {/* Sample variable values */}
      {usedVars.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Variable Values
            <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
              (substituted before sending)
            </span>
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1.5fr] text-[10px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span>Variable</span>
              <span>Sample Value</span>
            </div>
            <div className="divide-y divide-gray-100">
              {usedVars.map((path) => {
                const suggestion = VARIABLE_SUGGESTIONS.find((s) => s.path === path);
                return (
                  <div key={path} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center px-4 py-2.5">
                    <div>
                      <p className="text-[10px] font-mono text-gray-700">{`{{${path}}}`}</p>
                      {suggestion?.description && (
                        <p className="text-[9px] text-gray-400 mt-0.5">{suggestion.description}</p>
                      )}
                    </div>
                    <input
                      type="text"
                      value={sampleVars[path] ?? ''}
                      onChange={(e) => setSampleVars((prev) => ({ ...prev, [path]: e.target.value }))}
                      placeholder={suggestion?.example ?? 'value'}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300 font-mono"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {usedVars.length === 0 && isReady && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            No <code className="bg-gray-100 px-1 rounded">{`{{variables}}`}</code> found — request uses static values.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {testState.phase !== 'running' ? (
          <Button
            onClick={handleSend}
            disabled={!isReady}
            size="sm"
            className="gap-2 text-xs text-white"
            style={{ backgroundColor: '#0B6B5A' }}
          >
            <Play size={12} />
            Send Request
          </Button>
        ) : (
          <Button
            onClick={handleCancel}
            size="sm"
            variant="outline"
            className="gap-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
          >
            <Loader2 size={12} className="animate-spin" />
            Sending… Cancel
          </Button>
        )}

        <button
          onClick={handleBuildPreview}
          disabled={!isReady}
          className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 disabled:opacity-40"
        >
          Preview request only
        </button>
      </div>

      {/* Loading */}
      {testState.phase === 'running' && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">Sending request to <span className="font-mono font-semibold">{buildPreview(integration, mergedVars).url}</span>…</p>
        </div>
      )}

      {/* CORS error */}
      {testState.phase === 'error' && testState.isCors && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-orange-800">CORS Blocked</p>
          </div>
          <p className="text-xs text-orange-700 leading-relaxed">
            The browser blocked this request because the server did not include CORS headers
            allowing requests from this origin. This is a browser security restriction — the API
            itself may be working fine.
          </p>
          <p className="text-xs font-semibold text-orange-700 mt-2">How to test anyway:</p>
          <ul className="text-xs text-orange-700 list-disc pl-4 space-y-0.5 leading-relaxed">
            <li>Copy the cURL command below and run it in your terminal — no CORS restriction there</li>
            <li>Use a browser extension like "CORS Unblock" (for dev only)</li>
            <li>If you own the API: add <code className="bg-orange-100 px-1 rounded">Access-Control-Allow-Origin: *</code> to responses</li>
          </ul>
          {preview && (
            <div className="mt-3">
              <p className="text-[10px] text-orange-600 font-semibold mb-1.5">cURL Command</p>
              <CodeBlock>{curlStr}</CodeBlock>
            </div>
          )}
        </div>
      )}

      {/* Other network error */}
      {testState.phase === 'error' && !testState.isCors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <XCircle size={13} className="text-red-500" />
            <p className="text-xs font-semibold text-red-700">Request Failed</p>
          </div>
          <p className="text-xs font-mono text-red-600 break-all">{testState.message}</p>
          <p className="text-[10px] text-red-500 mt-1.5 leading-relaxed">
            Check that the URL is correct and the server is reachable. If the server uses a self-signed certificate, disable SSL verification in the Advanced tab.
          </p>
        </div>
      )}

      {/* Success response */}
      {testState.phase === 'success' && (
        <div className="space-y-3">
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Response</p>
            <ResponsePanel response={testState.response} />
          </div>
        </div>
      )}

      {/* Request preview (toggle) */}
      {preview && showPreview && testState.phase !== 'running' && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <button
            onClick={() => setShowPreview((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <ChevronDown size={13} />
            Request Preview
          </button>

          {/* Method + URL */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
              preview.method === 'GET'    ? 'bg-emerald-100 text-emerald-700' :
              preview.method === 'POST'   ? 'bg-blue-100 text-blue-700' :
              preview.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
            }`}>
              {preview.method}
            </span>
            <span className="text-xs font-mono text-gray-700 break-all">{preview.url}</span>
          </div>

          {/* Request headers */}
          {Object.keys(preview.headers).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Request Headers</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {Object.entries(preview.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-3 px-3 py-2 border-b border-gray-100 last:border-0 text-[10px] font-mono">
                    <span className="text-gray-700 font-semibold flex-shrink-0 min-w-[160px]">{k}</span>
                    <span className="text-gray-500 break-all">
                      {k.toLowerCase() === 'authorization' && v.length > 20
                        ? v.slice(0, 25) + '••••'
                        : v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request body */}
          {preview.body && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Request Body</p>
              <CodeBlock language="json">{preview.body}</CodeBlock>
            </div>
          )}

          {/* cURL */}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">cURL Equivalent</p>
            <CodeBlock>{curlStr}</CodeBlock>
          </div>
        </div>
      )}
    </div>
  );
}
