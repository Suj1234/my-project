import { useState, useRef } from 'react';
import {
  Play, Copy, CheckCircle2, AlertTriangle,
  CheckCircle, XCircle, Loader2, Clock, Send, FlaskConical, Info,
} from 'lucide-react';
import { ApiIntegrationV1 } from '../../../types/apiIntegrationV1';
import { Button } from '../../../components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  bodyParsed?: unknown;
  isJson: boolean;
  durationMs: number;
  size: number;
}

type TestState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'success'; response: ApiResponse }
  | { phase: 'error'; message: string; isCors: boolean };

// ─── Extract {{variable}} placeholders from all configured fields ──────────────

function extractVariables(integration: ApiIntegrationV1): string[] {
  const allText = [
    integration.url,
    integration.auth.bearerToken    ?? '',
    integration.auth.apiKeyName     ?? '',
    integration.auth.apiKeyValue    ?? '',
    integration.auth.basicUsername  ?? '',
    integration.auth.basicPassword  ?? '',
    ...integration.headers.map((h) => `${h.key}:${h.value}`),
    ...integration.params.map((p)  => `${p.key}=${p.value}`),
    integration.bodyRaw,
  ].join(' ');

  const matches = allText.match(/\{\{([^}]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

// ─── Substitute variables into a string ───────────────────────────────────────

function resolve(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => vars[path] ?? `{{${path}}}`);
}

// ─── Build the actual fetch request after substitution ────────────────────────

function buildRequest(
  integration: ApiIntegrationV1,
  vars: Record<string, string>,
): { url: string; headers: Record<string, string>; body?: string } {
  const r = (t: string) => resolve(t, vars);
  const headers: Record<string, string> = {};
  const { auth } = integration;

  if (auth.type === 'bearer' && auth.bearerToken) {
    headers['Authorization'] = `Bearer ${r(auth.bearerToken)}`;
  } else if (auth.type === 'basic' && auth.basicUsername) {
    headers['Authorization'] = `Basic ${btoa(`${r(auth.basicUsername)}:${r(auth.basicPassword ?? '')}`)}`;
  } else if (auth.type === 'api_key' && auth.apiKeyName && auth.apiKeyPlacement === 'header') {
    headers[r(auth.apiKeyName)] = r(auth.apiKeyValue ?? '');
  }

  integration.headers.filter((h) => h.enabled && h.key).forEach((h) => {
    headers[r(h.key)] = r(h.value);
  });

  let url = r(integration.url);
  const activeParams = integration.params.filter((p) => p.enabled && p.key);
  if (auth.type === 'api_key' && auth.apiKeyName && auth.apiKeyPlacement === 'query') {
    activeParams.push({ id: '_auth', key: r(auth.apiKeyName), value: r(auth.apiKeyValue ?? ''), enabled: true });
  }
  if (activeParams.length > 0) {
    const qs = activeParams.map((p) => `${encodeURIComponent(r(p.key))}=${encodeURIComponent(r(p.value))}`).join('&');
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  let body: string | undefined;
  if (integration.method === 'POST' && integration.bodyRaw.trim()) {
    headers['Content-Type'] = 'application/json';
    body = r(integration.bodyRaw);
  }

  return { url, headers, body };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function statusColor(s: number) {
  if (s >= 200 && s < 300) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (s >= 300 && s < 400) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (s >= 400 && s < 500) return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

// ─── Response Panel ───────────────────────────────────────────────────────────

function ResponsePanel({ response }: { response: ApiResponse }) {
  const [tab, setTab]       = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);

  const body    = response.isJson && response.bodyParsed
    ? JSON.stringify(response.bodyParsed, null, 2)
    : response.body;
  const headers = Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n');
  const display = tab === 'body' ? body : headers;

  const copy = () => {
    navigator.clipboard?.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} />{response.durationMs}ms
        </span>
        <span className="text-xs text-gray-500">{formatBytes(response.size)}</span>
        {response.status >= 200 && response.status < 300
          ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle size={12} />Success</span>
          : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} />Failed</span>
        }
      </div>

      {/* Tab switcher + copy */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit">
          {(['body', 'headers'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                t === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {t === 'body' ? 'Body' : `Headers (${Object.keys(response.headers).length})`}
            </button>
          ))}
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          {copied
            ? <><CheckCircle2 size={12} className="text-green-500" />Copied</>
            : <><Copy size={12} />Copy</>}
        </button>
      </div>

      {/* Code block */}
      <div className="rounded-lg overflow-hidden border border-gray-800">
        <div className="px-3 py-1.5 bg-gray-800">
          <span className="text-[10px] text-gray-400 font-mono">
            {tab === 'body' ? 'Response Body' : 'Response Headers'}
          </span>
        </div>
        <pre className="bg-gray-950 text-green-300 text-xs font-mono p-4 overflow-x-auto overflow-y-auto max-h-96 leading-relaxed whitespace-pre-wrap break-all">
          {display || '(empty)'}
        </pre>
      </div>
    </div>
  );
}

// ─── Main TestTab ─────────────────────────────────────────────────────────────

export function TestTabV1({ integration }: { integration: ApiIntegrationV1 }) {
  const usedVars = extractVariables(integration);

  const [sampleVars, setSampleVars] = useState<Record<string, string>>(
    Object.fromEntries(usedVars.map((v) => [v, '']))
  );
  const [testState, setTestState] = useState<TestState>({ phase: 'idle' });
  const abortRef                  = useRef<AbortController | null>(null);
  const isReady                   = !!integration.url.trim();

  const handleSend = async () => {
    const req = buildRequest(integration, sampleVars);
    setTestState({ phase: 'running' });
    abortRef.current = new AbortController();
    const start = performance.now();

    try {
      const fetchOpts: RequestInit = {
        method:  integration.method,
        headers: req.headers,
        signal:  abortRef.current.signal,
      };
      if (req.body && integration.method === 'POST') fetchOpts.body = req.body;

      const res        = await fetch(req.url, fetchOpts);
      const durationMs = Math.round(performance.now() - start);
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      const bodyText = await res.text();
      const size     = new Blob([bodyText]).size;
      let bodyParsed: unknown;
      let isJson = false;
      const ct = res.headers.get('content-type') ?? '';
      if (ct.includes('application/json') || ct.includes('text/json')) {
        try { bodyParsed = JSON.parse(bodyText); isJson = true; } catch { /* ignore */ }
      }

      setTestState({
        phase: 'success',
        response: {
          status: res.status,
          statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
          headers: resHeaders,
          body: bodyText,
          bodyParsed,
          isJson,
          durationMs,
          size,
        },
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') { setTestState({ phase: 'idle' }); return; }
      const message = (err as Error)?.message ?? 'Unknown error';
      const isCors  = err instanceof TypeError &&
        (message.includes('Failed to fetch') || message.includes('NetworkError') ||
         message.includes('CORS') || message.includes('Load failed'));
      setTestState({ phase: 'error', message, isCors });
    }
  };

  const handleCancel = () => { abortRef.current?.abort(); setTestState({ phase: 'idle' }); };

  // cURL for CORS error display
  const curlReq = buildRequest(integration, sampleVars);
  const curlStr = [
    `curl -X ${integration.method} \\`,
    `  "${curlReq.url}" \\`,
    ...Object.entries(curlReq.headers).map(([k, v]) => `  -H "${k}: ${v}" \\`),
    curlReq.body ? `  -d '${curlReq.body}'` : null,
  ].filter(Boolean).join('\n');

  return (
    <div className="grid grid-cols-2 gap-4 items-start">

      {/* ══ LEFT — Variable Values + Send ══ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <FlaskConical size={15} className="text-blue-600" />
          <p className="text-sm font-semibold text-gray-800">Variable Values</p>
          <span className="ml-1 text-xs text-gray-400 font-normal">(substituted before sending)</span>
        </div>

        <div className="p-5 space-y-5">

          {/* Variable table */}
          {usedVars.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variable</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sample Value</p>
              </div>
              {/* Rows */}
              <div className="divide-y divide-gray-100">
                {usedVars.map((varPath) => (
                  <div key={varPath} className="grid grid-cols-2 items-center px-4 py-3 gap-4">
                    <div>
                      <p className="text-xs font-mono text-gray-800">{`{{${varPath}}}`}</p>
                    </div>
                    <input
                      type="text"
                      value={sampleVars[varPath] ?? ''}
                      onChange={(e) =>
                        setSampleVars((prev) => ({ ...prev, [varPath]: e.target.value }))
                      }
                      placeholder="value"
                      className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-300 font-mono w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <Info size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                No <code className="bg-gray-200 px-1 rounded font-mono text-[10px]">{`{{variables}}`}</code> found — this request uses static values and will be sent as configured.
              </p>
            </div>
          )}

          {/* URL not set warning */}
          {!isReady && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle size={13} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                No URL configured — set it in the <strong>Request</strong> tab first.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            {testState.phase !== 'running' ? (
              <Button
                onClick={handleSend}
                disabled={!isReady}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play size={13} />
                Send Request
              </Button>
            ) : (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Loader2 size={13} className="animate-spin" />
                Sending… Cancel
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* ══ RIGHT — Response Panel ══ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Play size={14} className="text-blue-600" />
          <p className="text-sm font-semibold text-gray-800">Response</p>
        </div>

        <div className="p-5">

          {/* Idle */}
          {testState.phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Send size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No response yet</p>
              <p className="text-xs text-gray-400 mt-1">
                {usedVars.length > 0
                  ? 'Fill in the variable values and click Send Request.'
                  : 'Click Send Request to test this API.'}
              </p>
            </div>
          )}

          {/* Running */}
          {testState.phase === 'running' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium text-gray-600">Sending request…</p>
              <p className="text-xs text-gray-400 font-mono mt-1 break-all max-w-xs">
                {buildRequest(integration, sampleVars).url}
              </p>
            </div>
          )}

          {/* CORS error */}
          {testState.phase === 'error' && testState.isCors && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 mb-1">CORS Blocked</p>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    The browser blocked this request. The API may be working fine.
                    Run the cURL command below in your terminal to verify.
                  </p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <div className="px-3 py-1.5 bg-gray-800">
                  <span className="text-[10px] text-gray-400 font-mono">cURL</span>
                </div>
                <pre className="bg-gray-950 text-green-300 text-xs font-mono p-4 overflow-x-auto whitespace-pre-wrap break-all">
                  {curlStr}
                </pre>
              </div>
            </div>
          )}

          {/* Other error */}
          {testState.phase === 'error' && !testState.isCors && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Request Failed</p>
                <p className="text-xs font-mono text-red-600 break-all">{testState.message}</p>
                <p className="text-xs text-red-400 mt-1.5">
                  Check the URL is correct and the server is reachable.
                </p>
              </div>
            </div>
          )}

          {/* Success */}
          {testState.phase === 'success' && (
            <ResponsePanel response={testState.response} />
          )}

        </div>
      </div>

    </div>
  );
}
