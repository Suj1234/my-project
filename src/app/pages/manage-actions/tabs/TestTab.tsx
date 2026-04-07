import { useState } from 'react';
import { Play, Copy, CheckCircle2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { ApiIntegration, VARIABLE_SUGGESTIONS } from '../../../types/apiIntegration';
import { Button } from '../../../components/ui/button';

interface TestTabProps {
  integration: ApiIntegration;
}

type RequestPreview = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
};

function resolveVariables(text: string, sampleVars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    return sampleVars[path] ?? `{{${path}}}`;
  });
}

function buildPreview(integration: ApiIntegration, sampleVars: Record<string, string>): RequestPreview {
  const resolve = (t: string) => resolveVariables(t, sampleVars);

  const headers: Record<string, string> = {};

  // Auth → header
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

  // Regular headers
  integration.headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) => {
      headers[h.key] = resolve(h.value);
    });

  // URL + query params
  let url = resolve(integration.url);
  const activeParams = integration.queryParams.filter((p) => p.enabled && p.key);
  if (activeParams.length > 0) {
    const qs = activeParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(resolve(p.value))}`).join('&');
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  // Body
  let body: string | undefined;
  if (integration.body.contentType !== 'none') {
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

function CodeBlock({ children, language = 'text' }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-950 text-green-300 text-[10px] font-mono p-3 rounded-lg overflow-x-auto max-h-48 leading-relaxed">
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

// Extract all {{variable}} placeholders from the integration
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

export function TestTab({ integration }: TestTabProps) {
  const usedVars = extractVariables(integration);
  const initialSamples = Object.fromEntries(
    usedVars.map((path) => {
      const suggestion = VARIABLE_SUGGESTIONS.find((s) => s.path === path);
      return [path, suggestion?.example ?? ''];
    })
  );

  const [sampleVars, setSampleVars] = useState<Record<string, string>>(initialSamples);
  const [preview, setPreview] = useState<RequestPreview | null>(null);
  const [headersOpen, setHeadersOpen] = useState(true);

  const isReady = !!integration.url && !!integration.method;

  const handlePreview = () => {
    const p = buildPreview(integration, sampleVars);
    setPreview(p);
  };

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
      {/* Not ready banner */}
      {!isReady && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Info size={13} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            Configure the <strong>Request</strong> tab (URL + method) before running a test preview.
          </p>
        </div>
      )}

      {/* Sample variable values */}
      {usedVars.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Sample Variable Values
            <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
              (used to render the request preview)
            </span>
          </p>
          <div className="space-y-2">
            {usedVars.map((path) => {
              const suggestion = VARIABLE_SUGGESTIONS.find((s) => s.path === path);
              return (
                <div key={path} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center">
                  <div>
                    <p className="text-[10px] font-mono text-gray-600">{`{{${path}}}`}</p>
                    {suggestion?.description && (
                      <p className="text-[9px] text-gray-400">{suggestion.description}</p>
                    )}
                  </div>
                  <input
                    type="text"
                    value={sampleVars[path] ?? ''}
                    onChange={(e) => setSampleVars((prev) => ({ ...prev, [path]: e.target.value }))}
                    placeholder={suggestion?.example ?? 'sample value'}
                    className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-gray-300 font-mono"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {usedVars.length === 0 && isReady && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            No <code className="bg-gray-100 px-1 rounded">{`{{variables}}`}</code> detected — the request uses static values only.
          </p>
        </div>
      )}

      {/* Generate preview */}
      <Button
        onClick={handlePreview}
        disabled={!isReady}
        size="sm"
        className="gap-2 text-xs text-white"
        style={{ backgroundColor: '#0B6B5A' }}
      >
        <Play size={12} />
        Generate Request Preview
      </Button>

      {/* Preview output */}
      {preview && (
        <div className="space-y-4">
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Request Preview</p>

            {/* Method + URL */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                preview.method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
                preview.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                preview.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {preview.method}
              </span>
              <span className="text-xs font-mono text-gray-700 break-all">{preview.url}</span>
            </div>

            {/* Headers */}
            <div className="mb-3">
              <button
                onClick={() => setHeadersOpen(!headersOpen)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 mb-1.5"
              >
                {headersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Headers ({Object.keys(preview.headers).length})
              </button>
              {headersOpen && (
                <div className="pl-4 space-y-1">
                  {Object.entries(preview.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-[10px] font-mono">
                      <span className="text-gray-700 font-semibold flex-shrink-0">{k}:</span>
                      <span className="text-gray-500 break-all">
                        {k.toLowerCase() === 'authorization' && v.length > 20
                          ? v.slice(0, 20) + '••••'
                          : v}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            {preview.body && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Body</p>
                <CodeBlock language="json">{preview.body}</CodeBlock>
              </div>
            )}

            {/* cURL equivalent */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-600 mb-1.5">cURL Equivalent</p>
              <CodeBlock>{curlStr}</CodeBlock>
            </div>

            {/* Info note */}
            <div className="mt-3 flex items-start gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <Info size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500">
                This is a preview only — no actual HTTP request is made. Copy the cURL above to test in your terminal.
                Sensitive values like tokens are partially masked.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
