import { useState, useRef } from 'react';
import { X, FileJson, AlertCircle, CheckCircle2, Upload, Search } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ApiIntegration, HttpMethod, KeyValuePair, AuthConfig } from '../../../types/apiIntegration';

// ─── Internal Types ───────────────────────────────────────────────────────────

interface ParsedEndpoint {
  method: HttpMethod;
  path: string;
  fullUrl: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags: string[];
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyContentType?: string;
  bodyExample?: string;
  auth?: AuthConfig;
}

// ─── OpenAPI / Swagger Parser ─────────────────────────────────────────────────

const VALID_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function buildExampleFromSchema(schema: any, spec: any, depth = 0): any {
  if (depth > 5 || !schema) return null;
  if (schema.$ref) {
    const parts = schema.$ref.replace(/^#\//, '').split('/');
    let node: any = spec;
    for (const p of parts) node = node?.[p];
    return buildExampleFromSchema(node, spec, depth + 1);
  }
  if (schema.example !== undefined) return schema.example;
  if (schema.allOf) return buildExampleFromSchema(schema.allOf[0], spec, depth + 1);
  if (schema.oneOf) return buildExampleFromSchema(schema.oneOf[0], spec, depth + 1);
  if (schema.anyOf) return buildExampleFromSchema(schema.anyOf[0], spec, depth + 1);
  if (schema.type === 'object' || schema.properties) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(schema.properties ?? {})) {
      obj[k] = buildExampleFromSchema(v as any, spec, depth + 1);
    }
    return obj;
  }
  if (schema.type === 'array') return [buildExampleFromSchema(schema.items, spec, depth + 1)];
  if (schema.type === 'string') return schema.enum?.[0] ?? schema.format ?? 'string';
  if (schema.type === 'integer' || schema.type === 'number') return 0;
  if (schema.type === 'boolean') return false;
  return null;
}

function resolveSecurityScheme(scheme: any): AuthConfig {
  const t = scheme.type;
  if (t === 'http') {
    if (scheme.scheme === 'bearer') return { type: 'bearer', bearerToken: '' };
    if (scheme.scheme === 'basic') return { type: 'basic', basicUsername: '', basicPassword: '' };
    if (scheme.scheme === 'digest') return { type: 'digest', digestUsername: '', digestPassword: '' };
  }
  if (t === 'apiKey') {
    return {
      type: 'api_key',
      apiKeyName: scheme.name ?? 'X-API-Key',
      apiKeyValue: '',
      apiKeyPlacement: scheme.in === 'query' ? 'query' : 'header',
    };
  }
  if (t === 'oauth2') return { type: 'oauth2', oauth2GrantType: 'client_credentials', oauth2TokenUrl: '' };
  if (t === 'basic') return { type: 'basic', basicUsername: '', basicPassword: '' };
  return { type: 'none' };
}

function parseOpenApi(spec: any): { endpoints: ParsedEndpoint[]; title: string; errors: string[] } {
  const errors: string[] = [];
  const endpoints: ParsedEndpoint[] = [];
  const isV3 = !!spec.openapi;
  const isV2 = !!spec.swagger;

  if (!isV3 && !isV2) {
    errors.push('Not a valid OpenAPI 3.x or Swagger 2.x document. Missing "openapi" or "swagger" field.');
    return { endpoints, title: '', errors };
  }

  const title = spec.info?.title ?? 'Untitled API';

  // Base URL
  let baseUrl = '';
  if (isV3) {
    baseUrl = spec.servers?.[0]?.url ?? '';
  } else {
    const scheme = spec.schemes?.[0] ?? 'https';
    const host = spec.host ?? '';
    const basePath = spec.basePath ?? '';
    baseUrl = host ? `${scheme}://${host}${basePath}` : '';
  }

  const securitySchemes: Record<string, any> = isV3
    ? (spec.components?.securitySchemes ?? {})
    : (spec.securityDefinitions ?? {});

  let kvId = 1;

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of VALID_METHODS) {
      const op: any = (pathItem as any)[method.toLowerCase()];
      if (!op) continue;

      const parameters: any[] = [
        ...((pathItem as any).parameters ?? []),
        ...(op.parameters ?? []),
      ];

      const headers: KeyValuePair[] = parameters
        .filter((p) => p.in === 'header')
        .map((p) => ({ id: String(kvId++), key: p.name, value: p.example ?? p.schema?.example ?? '', enabled: true, description: p.description }));

      const queryParams: KeyValuePair[] = parameters
        .filter((p) => p.in === 'query')
        .map((p) => ({ id: String(kvId++), key: p.name, value: p.example ?? p.schema?.example ?? '', enabled: true, description: p.description }));

      // Path params: {param} → {{param}}
      const fullUrl = baseUrl + path.replace(/\{(\w+)\}/g, '{{$1}}');

      // Body
      let bodyContentType: string | undefined;
      let bodyExample: string | undefined;

      if (isV3 && op.requestBody) {
        const content = op.requestBody.content ?? {};
        const ct = Object.keys(content)[0];
        if (ct) {
          bodyContentType = ct;
          const schemaContent = content[ct];
          const ex = schemaContent?.example ?? schemaContent?.schema?.example;
          if (ex !== undefined) {
            bodyExample = typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2);
          } else if (schemaContent?.schema) {
            const built = buildExampleFromSchema(schemaContent.schema, spec);
            if (built !== null) bodyExample = JSON.stringify(built, null, 2);
          }
        }
      } else if (isV2) {
        const bodyParam = parameters.find((p) => p.in === 'body');
        const formParam = parameters.find((p) => p.in === 'formData');
        if (bodyParam) {
          bodyContentType = (op.consumes ?? spec.consumes ?? ['application/json'])[0];
          if (bodyParam.schema) {
            const built = buildExampleFromSchema(bodyParam.schema, spec);
            if (built !== null) bodyExample = JSON.stringify(built, null, 2);
          }
        } else if (formParam) {
          bodyContentType = 'application/x-www-form-urlencoded';
        }
      }

      // Auth from security
      let auth: AuthConfig | undefined;
      const securityReqs: any[] = op.security ?? spec.security ?? [];
      if (securityReqs.length > 0) {
        const schemeName = Object.keys(securityReqs[0])[0];
        if (schemeName && securitySchemes[schemeName]) {
          auth = resolveSecurityScheme(securitySchemes[schemeName]);
        }
      }

      endpoints.push({
        method,
        path,
        fullUrl,
        operationId: op.operationId,
        summary: op.summary,
        description: op.description,
        tags: op.tags ?? [],
        headers,
        queryParams,
        bodyContentType,
        bodyExample,
        auth,
      });
    }
  }

  if (endpoints.length === 0 && errors.length === 0) {
    errors.push('No API endpoints found in this spec.');
  }

  return { endpoints, title, errors };
}

// ─── Method badge colors ──────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  POST:    'bg-blue-50 text-blue-700 border-blue-200',
  PUT:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  PATCH:   'bg-orange-50 text-orange-700 border-orange-200',
  DELETE:  'bg-red-50 text-red-700 border-red-200',
  HEAD:    'bg-purple-50 text-purple-700 border-purple-200',
  OPTIONS: 'bg-gray-100 text-gray-600 border-gray-200',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onImport: (partial: Partial<ApiIntegration>) => void;
  onClose: () => void;
}

export function OpenApiImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([]);
  const [specTitle, setSpecTitle] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ParsedEndpoint | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doParse = (raw: string) => {
    try {
      const spec = JSON.parse(raw);
      const { endpoints, title, errors } = parseOpenApi(spec);
      setErrors(errors);
      setEndpoints(endpoints);
      setSpecTitle(title);
      setSelected(null);
    } catch {
      setErrors(['Invalid JSON. Please paste valid JSON content.']);
      setEndpoints([]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      doParse(content);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!selected) return;
    const partial: Partial<ApiIntegration> = {
      method: selected.method,
      url: selected.fullUrl,
      name: selected.operationId ?? selected.summary ?? `${selected.method} ${selected.path}`,
      description: selected.description ?? '',
      tags: selected.tags,
    };
    if (selected.headers.length > 0) partial.headers = selected.headers;
    if (selected.queryParams.length > 0) partial.queryParams = selected.queryParams;
    if (selected.auth) partial.auth = selected.auth;
    if (selected.bodyContentType) {
      const ct = selected.bodyContentType;
      partial.body = {
        contentType: ct.includes('json') ? 'application/json'
          : ct.includes('form-urlencoded') ? 'application/x-www-form-urlencoded'
          : ct.includes('xml') ? 'application/xml'
          : 'application/json',
        inputMode: 'raw',
        rawValue: selected.bodyExample ?? '',
        formFields: [],
      };
    }
    onImport(partial);
    onClose();
  };

  const filtered = endpoints.filter((ep) => {
    const q = search.toLowerCase();
    return (
      ep.path.toLowerCase().includes(q) ||
      ep.method.toLowerCase().includes(q) ||
      (ep.summary?.toLowerCase().includes(q) ?? false) ||
      (ep.operationId?.toLowerCase().includes(q) ?? false) ||
      ep.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileJson size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Import from OpenAPI / Swagger</h2>
              <p className="text-xs text-gray-500">Supports OpenAPI 3.x and Swagger 2.x · JSON format</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: input panel ── */}
          <div className="w-[340px] flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Paste Spec JSON</label>
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setErrors([]); setEndpoints([]); setSelected(null); }}
                  rows={11}
                  className="w-full text-[11px] font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-950 text-green-400 placeholder:text-gray-600 resize-none"
                  placeholder={'{\n  "openapi": "3.0.0",\n  "info": { "title": "My API" },\n  "servers": [{ "url": "https://api.example.com" }],\n  "paths": { ... }\n}'}
                />
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  JSON only — for YAML specs, convert first at{' '}
                  <span className="text-indigo-500 font-medium">editor.swagger.io</span>{' '}
                  (File → Convert &amp; Save as JSON)
                </p>
              </div>

              {/* File drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
              >
                <Upload size={16} className="text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Drop .json file here or click to browse</p>
              </div>
              <input ref={fileRef} type="file" accept=".json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

              {/* Errors */}
              {errors.length > 0 && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => doParse(text)}
                disabled={!text.trim()}
                className="w-full py-2 text-xs font-semibold rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Parse Spec
              </button>
            </div>
          </div>

          {/* ── Right: endpoint picker ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {endpoints.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FileJson size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">Paste your spec and click Parse</p>
                <p className="text-xs text-gray-300 mt-1">Available endpoints will appear here</p>
              </div>
            ) : (
              <>
                {/* Picker header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2.5">
                    {specTitle} · {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
                  </p>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by path, method, tag…"
                      className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Endpoint list */}
                <div className="flex-1 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-400">No endpoints match "{search}"</div>
                  ) : (
                    filtered.map((ep, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelected(ep)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                          selected === ep ? 'bg-indigo-50 border-l-2 border-l-indigo-400' : ''
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${METHOD_COLORS[ep.method] ?? ''}`}>
                          {ep.method}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-gray-700 truncate">{ep.path}</p>
                          {ep.summary && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{ep.summary}</p>}
                          {ep.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {ep.tags.map((t) => (
                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">{t}</span>
                              ))}
                            </div>
                          )}
                          {/* Hints about what will be imported */}
                          <div className="flex items-center gap-2 mt-1.5">
                            {ep.headers.length > 0 && <span className="text-[9px] text-gray-400">{ep.headers.length} header{ep.headers.length > 1 ? 's' : ''}</span>}
                            {ep.queryParams.length > 0 && <span className="text-[9px] text-gray-400">{ep.queryParams.length} query param{ep.queryParams.length > 1 ? 's' : ''}</span>}
                            {ep.bodyContentType && <span className="text-[9px] text-indigo-400">body: {ep.bodyContentType.split('/')[1]}</span>}
                            {ep.auth && ep.auth.type !== 'none' && <span className="text-[9px] text-teal-500">auth: {ep.auth.type}</span>}
                          </div>
                        </div>
                        {selected === ep && <CheckCircle2 size={13} className="text-indigo-500 flex-shrink-0 ml-1 mt-0.5" />}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          {selected ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 size={13} className="text-teal-500" />
              <span className="font-mono font-medium text-gray-700">{selected.method} {selected.path}</span>
              {selected.summary && <span className="text-gray-400">— {selected.summary}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Select an endpoint from the list to import</p>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!selected}
              className="text-xs text-white"
              style={{ backgroundColor: '#0B6B5A' }}
            >
              Import Endpoint
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
