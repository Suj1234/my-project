import { useState, useRef } from 'react';
import { X, Package, AlertCircle, CheckCircle2, Upload, Search } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ApiIntegration, HttpMethod, KeyValuePair, AuthConfig, BodyConfig } from '../../../types/apiIntegration';

// ─── Internal Types ───────────────────────────────────────────────────────────

interface PostmanRequest {
  name: string;
  folderPath: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body?: BodyConfig;
  auth?: AuthConfig;
  description?: string;
}

// ─── Postman Auth Parser ──────────────────────────────────────────────────────

function parsePostmanAuth(auth: any): AuthConfig | undefined {
  if (!auth?.type) return undefined;
  const get = (arr: any[], key: string): string =>
    arr?.find((i: any) => i.key === key)?.value ?? '';

  switch (auth.type) {
    case 'bearer':
      return { type: 'bearer', bearerToken: get(auth.bearer, 'token') };
    case 'basic':
      return { type: 'basic', basicUsername: get(auth.basic, 'username'), basicPassword: get(auth.basic, 'password') };
    case 'apikey':
      return {
        type: 'api_key',
        apiKeyName: get(auth.apikey, 'key'),
        apiKeyValue: get(auth.apikey, 'value'),
        apiKeyPlacement: get(auth.apikey, 'in') === 'query' ? 'query' : 'header',
      };
    case 'oauth2':
      return {
        type: 'oauth2',
        oauth2GrantType: 'authorization_code',
        oauth2TokenUrl: get(auth.oauth2, 'accessTokenUrl'),
        oauth2AuthUrl: get(auth.oauth2, 'authUrl'),
        oauth2ClientId: get(auth.oauth2, 'clientId'),
        oauth2ClientSecret: get(auth.oauth2, 'clientSecret'),
        oauth2Scope: get(auth.oauth2, 'scope'),
      };
    case 'awsv4':
      return {
        type: 'aws_sig4',
        awsAccessKey: get(auth.awsv4, 'accessKey'),
        awsSecretKey: get(auth.awsv4, 'secretKey'),
        awsRegion: get(auth.awsv4, 'region'),
        awsService: get(auth.awsv4, 'service'),
        awsSessionToken: get(auth.awsv4, 'sessionToken'),
      };
    case 'digest':
      return { type: 'digest', digestUsername: get(auth.digest, 'username'), digestPassword: get(auth.digest, 'password') };
    default:
      return undefined;
  }
}

// ─── Postman Collection Parser ────────────────────────────────────────────────

function flattenItems(items: any[], folderPath = '', kvIdRef = { n: 1 }): PostmanRequest[] {
  const results: PostmanRequest[] = [];

  for (const item of items ?? []) {
    if (Array.isArray(item.item)) {
      // Folder — recurse
      const childPath = folderPath ? `${folderPath} / ${item.name}` : item.name;
      results.push(...flattenItems(item.item, childPath, kvIdRef));
      continue;
    }

    if (!item.request) continue;
    const req = item.request;
    const method = ((req.method ?? 'GET') as string).toUpperCase() as HttpMethod;

    // URL — can be string or object
    let rawUrl = '';
    let queryParams: KeyValuePair[] = [];

    if (typeof req.url === 'string') {
      rawUrl = req.url;
    } else if (req.url) {
      rawUrl = req.url.raw ?? '';
      queryParams = (req.url.query ?? [])
        .filter((q: any) => !q.disabled)
        .map((q: any) => ({
          id: String(kvIdRef.n++),
          key: q.key ?? '',
          value: q.value ?? '',
          enabled: true,
          description: q.description ?? '',
        }));
    }

    // Postman uses {{var}} — same as our syntax already
    const url = rawUrl;

    // Headers
    const headers: KeyValuePair[] = (req.header ?? [])
      .filter((h: any) => !h.disabled)
      .map((h: any) => ({
        id: String(kvIdRef.n++),
        key: h.key ?? '',
        value: h.value ?? '',
        enabled: true,
        description: h.description ?? '',
      }));

    // Body
    let body: BodyConfig | undefined;
    if (req.body) {
      const mode = req.body.mode;
      if (mode === 'raw') {
        const lang = req.body.options?.raw?.language ?? 'json';
        body = {
          contentType: lang === 'xml' ? 'text/xml' : lang === 'text' ? 'text/plain' : 'application/json',
          inputMode: 'raw',
          rawValue: req.body.raw ?? '',
          formFields: [],
        };
      } else if (mode === 'urlencoded') {
        body = {
          contentType: 'application/x-www-form-urlencoded',
          inputMode: 'form_builder',
          rawValue: '',
          formFields: (req.body.urlencoded ?? []).map((f: any) => ({
            id: String(kvIdRef.n++),
            key: f.key ?? '',
            value: f.value ?? '',
            type: 'text' as const,
            enabled: !f.disabled,
          })),
        };
      } else if (mode === 'formdata') {
        body = {
          contentType: 'multipart/form-data',
          inputMode: 'form_builder',
          rawValue: '',
          formFields: (req.body.formdata ?? []).map((f: any) => ({
            id: String(kvIdRef.n++),
            key: f.key ?? '',
            value: f.type === 'file' ? '' : (f.value ?? ''),
            type: f.type === 'file' ? 'file' as const : 'text' as const,
            enabled: !f.disabled,
          })),
        };
      } else if (mode === 'graphql') {
        body = {
          contentType: 'application/json',
          inputMode: 'raw',
          rawValue: JSON.stringify({ query: req.body.graphql?.query ?? '', variables: req.body.graphql?.variables ?? {} }, null, 2),
          formFields: [],
        };
      }
    }

    // Auth
    const auth = parsePostmanAuth(req.auth);

    // Description
    const desc = typeof req.description === 'string'
      ? req.description
      : (req.description?.content ?? '');

    results.push({ name: item.name, folderPath, method, url, headers, queryParams, body, auth, description: desc });
  }

  return results;
}

function parseCollection(json: any): { requests: PostmanRequest[]; name: string; version: string; errors: string[] } {
  const errors: string[] = [];

  if (!json?.info?.schema) {
    errors.push('Not a valid Postman Collection file (missing info.schema field). Export via File → Export in Postman.');
    return { requests: [], name: '', version: '', errors };
  }

  const schema: string = json.info.schema;
  const version = schema.includes('v2.1') ? 'v2.1' : schema.includes('v2.0') ? 'v2.0' : 'unknown';
  const name = json.info?.name ?? 'Untitled Collection';
  const requests = flattenItems(json.item ?? []);

  if (requests.length === 0) {
    errors.push('No requests found in this collection.');
  }

  return { requests, name, version, errors };
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

export function PostmanImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [requests, setRequests] = useState<PostmanRequest[]>([]);
  const [collectionName, setCollectionName] = useState('');
  const [collectionVersion, setCollectionVersion] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PostmanRequest | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doParse = (raw: string) => {
    try {
      const json = JSON.parse(raw);
      const { requests, name, version, errors } = parseCollection(json);
      setErrors(errors);
      setRequests(requests);
      setCollectionName(name);
      setCollectionVersion(version);
      setSelected(null);
    } catch {
      setErrors(['Invalid JSON. Please paste a valid Postman Collection JSON file.']);
      setRequests([]);
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
      url: selected.url,
      name: selected.name,
      description: selected.description ?? '',
    };
    if (selected.headers.length > 0) partial.headers = selected.headers;
    if (selected.queryParams.length > 0) partial.queryParams = selected.queryParams;
    if (selected.auth) partial.auth = selected.auth;
    if (selected.body) partial.body = selected.body;
    onImport(partial);
    onClose();
  };

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.url.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      r.folderPath.toLowerCase().includes(q)
    );
  });

  // Group by folder for display
  const grouped = filtered.reduce<Record<string, PostmanRequest[]>>((acc, r) => {
    const key = r.folderPath || '(root)';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Package size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Import from Postman Collection</h2>
              <p className="text-xs text-gray-500">Supports Collection v2.0 and v2.1 format</p>
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
                <label className="block text-xs font-medium text-gray-700 mb-2">Paste Collection JSON</label>
                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setErrors([]); setRequests([]); setSelected(null); }}
                  rows={11}
                  className="w-full text-[11px] font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-gray-950 text-orange-300 placeholder:text-gray-600 resize-none"
                  placeholder={'{\n  "info": {\n    "name": "My Collection",\n    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"\n  },\n  "item": [...]\n}'}
                />
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  Export from Postman via <span className="font-medium">File → Export → Collection v2.1</span>
                </p>
              </div>

              {/* File drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
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
                className="w-full py-2 text-xs font-semibold rounded-lg border border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Parse Collection
              </button>
            </div>
          </div>

          {/* ── Right: request picker ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {requests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Package size={22} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">Paste your collection and click Parse</p>
                <p className="text-xs text-gray-300 mt-1">Requests will appear here, grouped by folder</p>
              </div>
            ) : (
              <>
                {/* Picker header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{collectionName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-medium">
                      {collectionVersion} · {requests.length} request{requests.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by name, URL, folder…"
                      className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                </div>

                {/* Grouped request list */}
                <div className="flex-1 overflow-y-auto">
                  {Object.entries(grouped).map(([folder, reqs]) => (
                    <div key={folder}>
                      {/* Folder header */}
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{folder}</p>
                      </div>

                      {/* Requests in folder */}
                      {reqs.map((req, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelected(req)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                            selected === req ? 'bg-orange-50 border-l-2 border-l-orange-400' : ''
                          }`}
                        >
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${METHOD_COLORS[req.method] ?? ''}`}>
                            {req.method}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-700 truncate">{req.name}</p>
                            <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">{req.url || '(no URL)'}</p>
                            {/* Import hints */}
                            <div className="flex items-center gap-2 mt-1">
                              {req.headers.length > 0 && <span className="text-[9px] text-gray-400">{req.headers.length} header{req.headers.length > 1 ? 's' : ''}</span>}
                              {req.queryParams.length > 0 && <span className="text-[9px] text-gray-400">{req.queryParams.length} param{req.queryParams.length > 1 ? 's' : ''}</span>}
                              {req.body && <span className="text-[9px] text-orange-400">body: {req.body.contentType.split('/')[1]}</span>}
                              {req.auth && <span className="text-[9px] text-teal-500">auth: {req.auth.type}</span>}
                            </div>
                          </div>
                          {selected === req && <CheckCircle2 size={13} className="text-orange-500 flex-shrink-0 ml-1 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  ))}
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
              <span className="font-medium text-gray-700">{selected.method} — {selected.name}</span>
              {selected.folderPath && <span className="text-gray-400">in {selected.folderPath}</span>}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Select a request from the list to import</p>
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
              Import Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
