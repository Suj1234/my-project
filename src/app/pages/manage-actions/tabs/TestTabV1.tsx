import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play, Copy, CheckCircle2, AlertTriangle,
  CheckCircle, XCircle, Loader2, Clock, Send, FlaskConical,
  Route, SlidersHorizontal, FileJson,
} from 'lucide-react';
import { ApiIntegrationV1, FieldTypeV1 } from '../../../types/apiIntegrationV1';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract {{var}} names from URL path only (before ?) */
function extractPathVars(url: string): string[] {
  const pathPart = url.split('?')[0];
  return [...new Set((pathPart.match(/\{\{([^}]+)\}\}/g) ?? []).map((m) => m.slice(2, -2)))];
}


function resolveVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc, key) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function validateFieldType(val: string, type: FieldTypeV1, pattern?: string): string | null {
  if (!val.trim()) return null; // empty handled by required check
  switch (type) {
    case 'number':  return isNaN(Number(val)) ? 'Must be a number' : null;
    case 'email':   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Invalid email';
    case 'phone':   return /^\+?[\d\s\-()\\.]{7,15}$/.test(val) ? null : 'Invalid phone number';
    case 'date':    return !isNaN(Date.parse(val)) ? null : 'Invalid date';
    case 'boolean': return ['true', 'false', '1', '0'].includes(val.toLowerCase()) ? null : 'Must be true or false';
    case 'regex':   return pattern ? (new RegExp(pattern).test(val) ? null : `Must match: ${pattern}`) : null;
    default:        return null;
  }
}

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

// ─── Build fetch request ──────────────────────────────────────────────────────

function buildRequest(
  integration: ApiIntegrationV1,
  pathVarValues:  Record<string, string>,
  queryOverrides: Record<string, string>, // GET: param key → test value
  testBody:       string,                  // POST: raw JSON
): { url: string; headers: Record<string, string>; body?: string } {
  const rv = (t: string) => resolveVars(t, pathVarValues);

  // ── Headers + Auth ──
  const headers: Record<string, string> = {};
  const { auth } = integration;
  if (auth.type === 'bearer' && auth.bearerToken) {
    headers['Authorization'] = `Bearer ${rv(auth.bearerToken)}`;
  } else if (auth.type === 'basic' && auth.basicUsername) {
    headers['Authorization'] = `Basic ${btoa(`${rv(auth.basicUsername)}:${rv(auth.basicPassword ?? '')}`)}`;
  } else if (auth.type === 'api_key' && auth.apiKeyName && auth.apiKeyPlacement === 'header') {
    headers[rv(auth.apiKeyName)] = rv(auth.apiKeyValue ?? '');
  }
  integration.headers.filter((h) => h.enabled && h.key).forEach((h) => {
    headers[rv(h.key)] = rv(h.value);
  });

  // ── URL: substitute path vars ──
  let url = resolveVars(integration.url, pathVarValues);

  // ── Query params (GET) ──
  if (integration.method === 'GET') {
    const paramPairs: string[] = [];
    integration.params.filter((p) => p.enabled && p.key).forEach((p) => {
      const val = queryOverrides[p.key] ?? resolveVars(p.value, allVars);
      if (val.trim()) paramPairs.push(`${encodeURIComponent(p.key)}=${encodeURIComponent(val)}`);
    });
    if (auth.type === 'api_key' && auth.apiKeyName && auth.apiKeyPlacement === 'query') {
      paramPairs.push(`${encodeURIComponent(rv(auth.apiKeyName))}=${encodeURIComponent(rv(auth.apiKeyValue ?? ''))}`);
    }
    if (paramPairs.length > 0) url += (url.includes('?') ? '&' : '?') + paramPairs.join('&');
  }

  // ── Body (POST) ──
  let body: string | undefined;
  if (integration.method === 'POST' && testBody.trim()) {
    headers['Content-Type'] = 'application/json';
    body = testBody;
  }

  return { url, headers, body };
}

// ─── Validate inputs before sending ──────────────────────────────────────────

function validateInputs(
  integration: ApiIntegrationV1,
  pathVarValues:  Record<string, string>,
  queryOverrides: Record<string, string>,
  testBody:       string,
): Record<string, string> {
  const errs: Record<string, string> = {};
  const pathVars = extractPathVars(integration.url);

  // Path params
  pathVars.forEach((varName) => {
    const cfg = integration.pathParams.find((p) => p.key === varName);
    const val = pathVarValues[varName] ?? '';
    if (cfg?.required && !val.trim()) {
      errs[`path__${varName}`] = `${varName} is required`;
    } else if (val.trim() && cfg?.fieldType) {
      const e = validateFieldType(val, cfg.fieldType, cfg.description);
      if (e) errs[`path__${varName}`] = e;
    }
  });

  // Query params (GET)
  if (integration.method === 'GET') {
    integration.params.filter((p) => p.enabled && p.key).forEach((p) => {
      const val = queryOverrides[p.key] ?? '';
      if (p.required && !val.trim()) {
        errs[`query__${p.key}`] = `${p.key} is required`;
      } else if (val.trim() && p.fieldType) {
        const e = validateFieldType(val, p.fieldType);
        if (e) errs[`query__${p.key}`] = e;
      }
    });
  }

  // Body field rules (POST)
  if (integration.method === 'POST' && integration.bodySchema.length > 0) {
    try {
      const parsed = JSON.parse(testBody);
      integration.bodySchema.forEach((field) => {
        const val = getNestedValue(parsed, field.path);
        if (field.required && (val === undefined || val === null || val === '')) {
          errs[`body__${field.path}`] = `${field.path} is required`;
        }
      });
    } catch {
      errs['body___json'] = 'Request body is not valid JSON';
    }
  }

  return errs;
}

// ─── cURL builder ─────────────────────────────────────────────────────────────

function buildCurl(
  integration: ApiIntegrationV1,
  req: { url: string; headers: Record<string, string>; body?: string },
): string {
  return [
    `curl -X ${integration.method} \\`,
    `  "${req.url}" \\`,
    ...Object.entries(req.headers).map(([k, v]) => `  -H "${k}: ${v}" \\`),
    req.body ? `  -d '${req.body}'` : null,
  ].filter(Boolean).join('\n');
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
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{response.durationMs}ms</span>
        <span className="text-xs text-gray-500">{formatBytes(response.size)}</span>
        {response.status >= 200 && response.status < 300
          ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle size={12} />Success</span>
          : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} />Failed</span>}
      </div>
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
          {copied ? <><CheckCircle2 size={12} className="text-green-500" />Copied</> : <><Copy size={12} />Copy</>}
        </button>
      </div>
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

// ─── Small input with inline error ───────────────────────────────────────────

function TestInput({
  value, onChange, placeholder, error, onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  onClear?: (key: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); onClear?.(''); }}
        placeholder={placeholder ?? 'value'}
        className={`text-xs border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 font-mono w-full placeholder:text-gray-300 ${
          error
            ? 'border-red-300 bg-red-50 focus:ring-red-400 text-red-900'
            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
        }`}
      />
      {error && <p className="text-[10px] text-red-500 pl-1">{error}</p>}
    </div>
  );
}

// ─── Main TestTab ─────────────────────────────────────────────────────────────

export function TestTabV1({ integration }: { integration: ApiIntegrationV1 }) {
  const isGet    = integration.method === 'GET';
  const pathVars = useMemo(() => extractPathVars(integration.url), [integration.url]);

  // State — reset when integration id or method changes
  const resetKey = `${integration.id}__${integration.method}`;

  const [pathVarValues,  setPathVarValues]  = useState<Record<string, string>>({});
  const [queryOverrides, setQueryOverrides] = useState<Record<string, string>>({});
  const [testBody,       setTestBody]       = useState<string>(integration.bodyRaw);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [testState,      setTestState]      = useState<TestState>({ phase: 'idle' });
  const abortRef                            = useRef<AbortController | null>(null);

  useEffect(() => {
    setPathVarValues({});
    setQueryOverrides({});
    setTestBody(integration.bodyRaw);
    setErrors({});
    setTestState({ phase: 'idle' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const isReady = !!integration.url.trim();

  const clearError = (key: string) => setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

  const handleSend = async () => {
    const errs = validateInputs(integration, pathVarValues, queryOverrides, testBody);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const req = buildRequest(integration, pathVarValues, queryOverrides, testBody);
    setTestState({ phase: 'running' });
    abortRef.current = new AbortController();
    const start = performance.now();

    try {
      const fetchOpts: RequestInit = { method: integration.method, headers: req.headers, signal: abortRef.current.signal };
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
        response: { status: res.status, statusText: res.statusText || (res.ok ? 'OK' : 'Error'), headers: resHeaders, body: bodyText, bodyParsed, isJson, durationMs, size },
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

  const curlReq = buildRequest(integration, pathVarValues, queryOverrides, testBody);
  const curlStr = buildCurl(integration, curlReq);

  const totalErrors  = Object.keys(errors).length;
  const activeParams = integration.params.filter((p) => p.enabled && p.key);

  return (
    <div className="grid grid-cols-2 gap-4 items-start">

      {/* ══ LEFT — Inputs ══ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <FlaskConical size={15} className="text-blue-600" />
          <p className="text-sm font-semibold text-gray-800">Request Inputs</p>
          <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded border ${
            isGet ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>{integration.method}</span>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Path params ── */}
          {pathVars.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Route size={13} className="text-purple-600" />
                <p className="text-xs font-semibold text-gray-700">Path Parameters</p>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Variable</p>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Value</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {pathVars.map((varName) => {
                    const cfg = integration.pathParams.find((p) => p.key === varName);
                    const errKey = `path__${varName}`;
                    return (
                      <div key={varName} className="grid grid-cols-2 items-start px-4 py-3 gap-4">
                        <div className="flex items-center gap-1.5 pt-1">
                          <p className="text-xs font-mono text-purple-700">{`{{${varName}}}`}</p>
                          {cfg?.required && <span className="text-red-500 text-[10px] font-bold">*</span>}
                        </div>
                        <TestInput
                          value={pathVarValues[varName] ?? ''}
                          onChange={(v) => setPathVarValues((prev) => ({ ...prev, [varName]: v }))}
                          placeholder={cfg?.description ?? 'value'}
                          error={errors[errKey]}
                          onClear={() => clearError(errKey)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── GET: Query params ── */}
          {isGet && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <SlidersHorizontal size={13} className="text-blue-600" />
                <p className="text-xs font-semibold text-gray-700">Query Parameters</p>
                {activeParams.length > 0 && (
                  <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                    {activeParams.length} param{activeParams.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {activeParams.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-1">No query parameters configured. Add them in the Payload tab.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Parameter</p>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Value</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {activeParams.map((p) => {
                      const errKey = `query__${p.key}`;
                      const defaultVal = p.value.startsWith('{{') ? '' : p.value;
                      return (
                        <div key={p.id} className="grid grid-cols-2 items-start px-4 py-3 gap-4">
                          <div className="flex items-center gap-1.5 pt-1">
                            <p className="text-xs font-mono text-gray-700">{p.key}</p>
                            {p.required && <span className="text-red-500 text-[10px] font-bold">*</span>}
                          </div>
                          <TestInput
                            value={queryOverrides[p.key] ?? defaultVal}
                            onChange={(v) => setQueryOverrides((prev) => ({ ...prev, [p.key]: v }))}
                            placeholder={p.value.startsWith('{{') ? p.value : p.description ?? 'value'}
                            error={errors[errKey]}
                            onClear={() => clearError(errKey)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── POST: JSON body editor ── */}
          {!isGet && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <FileJson size={13} className="text-blue-600" />
                <p className="text-xs font-semibold text-gray-700">Request Body</p>
                <span className="ml-1 text-[10px] text-gray-400">JSON</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <div className="px-3 py-1.5 bg-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <span className="w-2 h-2 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-[10px] text-gray-400 font-mono">JSON — editable for this test run</span>
                </div>
                <textarea
                  value={testBody}
                  onChange={(e) => { setTestBody(e.target.value); clearError('body___json'); }}
                  rows={10}
                  spellCheck={false}
                  className={`w-full text-xs bg-gray-950 text-green-300 px-4 py-3 focus:outline-none font-mono resize-y leading-relaxed block ${
                    errors['body___json'] ? 'border-2 border-red-500' : ''
                  }`}
                  placeholder={'{\n  "key": "value"\n}'}
                />
              </div>
              {errors['body___json'] && (
                <p className="text-[10px] text-red-500 mt-1 pl-1">{errors['body___json']}</p>
              )}
              {/* Body field rule errors */}
              {integration.bodySchema.filter((f) => errors[`body__${f.path}`]).map((f) => (
                <p key={f.path} className="text-[10px] text-red-500 pl-1">
                  <span className="font-mono">{f.path}</span>: {errors[`body__${f.path}`]}
                </p>
              ))}
            </div>
          )}

          {/* No URL warning */}
          {!isReady && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle size={13} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">No URL configured — set it in the <strong>Endpoint</strong> tab first.</p>
            </div>
          )}

          {/* Validation error summary */}
          {totalErrors > 0 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                {totalErrors} validation error{totalErrors > 1 ? 's' : ''} — fix the highlighted fields before sending.
              </p>
            </div>
          )}

          {/* Send / Cancel */}
          <div className="flex items-center gap-3 pt-1">
            {testState.phase !== 'running' ? (
              <Button onClick={handleSend} disabled={!isReady} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Play size={13} />
                Send Request
              </Button>
            ) : (
              <Button onClick={handleCancel} variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                <Loader2 size={13} className="animate-spin" />
                Sending… Cancel
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* ══ RIGHT — Response ══ */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Play size={14} className="text-blue-600" />
          <p className="text-sm font-semibold text-gray-800">Response</p>
        </div>

        <div className="p-5">

          {testState.phase === 'idle' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Send size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No response yet</p>
              <p className="text-xs text-gray-400 mt-1">
                {isGet
                  ? 'Fill in the parameters and click Send Request.'
                  : 'Review the body and click Send Request.'}
              </p>
            </div>
          )}

          {testState.phase === 'running' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 size={28} className="animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium text-gray-600">Sending request…</p>
              <p className="text-xs text-gray-400 font-mono mt-1 break-all max-w-xs">{curlReq.url}</p>
            </div>
          )}

          {testState.phase === 'error' && testState.isCors && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 mb-1">CORS Blocked</p>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    The browser blocked this request. Run the cURL command below in your terminal to verify.
                  </p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <div className="px-3 py-1.5 bg-gray-800"><span className="text-[10px] text-gray-400 font-mono">cURL</span></div>
                <pre className="bg-gray-950 text-green-300 text-xs font-mono p-4 overflow-x-auto whitespace-pre-wrap break-all">{curlStr}</pre>
              </div>
            </div>
          )}

          {testState.phase === 'error' && !testState.isCors && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Request Failed</p>
                <p className="text-xs font-mono text-red-600 break-all">{testState.message}</p>
                <p className="text-xs text-red-400 mt-1.5">Check the URL is correct and the server is reachable.</p>
              </div>
            </div>
          )}

          {testState.phase === 'success' && <ResponsePanel response={testState.response} />}

        </div>
      </div>

    </div>
  );
}
