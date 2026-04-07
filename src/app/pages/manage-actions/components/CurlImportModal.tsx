import { useState } from 'react';
import { X, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ApiIntegration, KeyValuePair, HttpMethod } from '../../../types/apiIntegration';

interface CurlImportModalProps {
  onImport: (partial: Partial<ApiIntegration>) => void;
  onClose: () => void;
}

function parseCurl(curlStr: string): { result: Partial<ApiIntegration>; errors: string[] } {
  const errors: string[] = [];
  const result: Partial<ApiIntegration> = {};
  const headers: KeyValuePair[] = [];

  try {
    const raw = curlStr.trim().replace(/\\\n\s*/g, ' ').replace(/\s+/g, ' ');

    // Method
    const methodMatch = raw.match(/-X\s+([A-Z]+)/i);
    if (methodMatch) {
      result.method = methodMatch[1].toUpperCase() as HttpMethod;
    }

    // URL — handle both quoted and unquoted
    const urlMatch = raw.match(/curl\s+(?:-[^\s]+\s+[^\s]+\s+)*['"]?(https?:\/\/[^\s'"]+)['"]?/i)
      || raw.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/i);
    if (urlMatch) {
      // Strip query string into params
      const rawUrl = urlMatch[1];
      const [baseUrl, qs] = rawUrl.split('?');
      result.url = baseUrl;
      if (qs) {
        result.queryParams = qs.split('&').map((pair, i) => {
          const [k, v = ''] = pair.split('=');
          return { id: String(i + 1), key: decodeURIComponent(k), value: decodeURIComponent(v), enabled: true };
        });
      }
    } else {
      errors.push('Could not find a URL in the cURL command.');
    }

    // Headers
    const headerRegex = /-H\s+['"]([^'"]+)['"]/g;
    let hMatch;
    let hId = 1;
    while ((hMatch = headerRegex.exec(raw)) !== null) {
      const colonIdx = hMatch[1].indexOf(':');
      if (colonIdx > -1) {
        const key = hMatch[1].slice(0, colonIdx).trim();
        const value = hMatch[1].slice(colonIdx + 1).trim();
        // Authorization header → set auth
        if (key.toLowerCase() === 'authorization') {
          if (value.startsWith('Bearer ')) {
            result.auth = { type: 'bearer', bearerToken: value.slice(7).trim() };
          } else if (value.startsWith('Basic ')) {
            result.auth = { type: 'basic' };
          } else {
            result.auth = { type: 'custom_header', customHeaderName: key, customHeaderValue: value };
          }
        } else {
          headers.push({ id: String(hId++), key, value, enabled: true });
        }
      }
    }

    // -u / --user for Basic Auth
    const userMatch = raw.match(/(?:-u|--user)\s+['"]?([^:'"]+):([^'"]+)['"]?/);
    if (userMatch) {
      result.auth = { type: 'basic', basicUsername: userMatch[1], basicPassword: userMatch[2] };
    }

    if (headers.length > 0) result.headers = headers;

    // Body — -d / --data / --data-raw / --data-binary
    const bodyMatch = raw.match(/(?:-d|--data(?:-raw|-binary)?)\s+['"](.+?)['"]\s*(?=-[a-zA-Z]|$)/s)
      || raw.match(/(?:-d|--data(?:-raw|-binary)?)\s+'([\s\S]+?)'/);
    if (bodyMatch) {
      const rawBody = bodyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      // Detect content type from headers
      const ctHeader = headers.find((h) => h.key.toLowerCase() === 'content-type');
      const ct = ctHeader?.value ?? 'application/json';
      let contentType: ApiIntegration['body']['contentType'] = 'application/json';
      if (ct.includes('x-www-form-urlencoded')) contentType = 'application/x-www-form-urlencoded';
      else if (ct.includes('multipart')) contentType = 'multipart/form-data';
      else if (ct.includes('xml')) contentType = 'text/xml';
      else if (ct.includes('plain')) contentType = 'text/plain';

      result.body = {
        contentType,
        inputMode: 'raw',
        rawValue: rawBody,
        formFields: [],
      };

      // If method wasn't set and body exists, default to POST
      if (!result.method) result.method = 'POST';
    }

    if (!result.method) result.method = 'GET';
    if (!result.auth) result.auth = { type: 'none' };
  } catch (e) {
    errors.push('Failed to parse cURL. Please check the format and try again.');
  }

  return { result, errors };
}

export function CurlImportModal({ onImport, onClose }: CurlImportModalProps) {
  const [curlText, setCurlText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<Partial<ApiIntegration> | null>(null);

  const handleParse = () => {
    if (!curlText.trim()) return;
    const { result, errors } = parseCurl(curlText);
    setErrors(errors);
    setPreview(result);
  };

  const handleImport = () => {
    if (preview) {
      onImport(preview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[680px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Terminal size={14} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Import from cURL</h2>
              <p className="text-xs text-gray-500">Paste a cURL command to auto-populate all fields</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              cURL Command
            </label>
            <textarea
              value={curlText}
              onChange={(e) => { setCurlText(e.target.value); setPreview(null); setErrors([]); }}
              rows={7}
              className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-gray-950 text-green-400 placeholder:text-gray-600 resize-none"
              placeholder={`curl -X POST "https://api.example.com/v1/check" \\
  -H "Authorization: Bearer {{credentials.token}}" \\
  -H "Content-Type: application/json" \\
  -d '{"pan": "ABCDE1234F", "dob": "1990-01-01"}'`}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Tip: You can use <code className="bg-gray-100 px-1 rounded">{`{{variables}}`}</code> inside the cURL before importing
            </p>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && errors.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-teal-600" />
                <span className="text-xs font-medium text-teal-700">Parsed successfully — review before importing</span>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3 text-xs">
                {preview.method && preview.url && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">{preview.method}</span>
                    <span className="font-mono text-gray-700 break-all">{preview.url}</span>
                  </div>
                )}
                {preview.auth && preview.auth.type !== 'none' && (
                  <div>
                    <span className="font-medium text-gray-500 uppercase text-[10px] tracking-wide">Auth: </span>
                    <span className="text-gray-700">{preview.auth.type}</span>
                    {preview.auth.bearerToken && (
                      <span className="text-gray-400 ml-1">({preview.auth.bearerToken.slice(0, 12)}…)</span>
                    )}
                  </div>
                )}
                {preview.headers && preview.headers.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-500 uppercase text-[10px] tracking-wide mb-1">
                      Headers ({preview.headers.length})
                    </p>
                    <div className="space-y-1 pl-2">
                      {preview.headers.map((h) => (
                        <div key={h.id} className="font-mono text-[10px] text-gray-600">
                          <span className="text-gray-800">{h.key}</span>: {h.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {preview.queryParams && preview.queryParams.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-500 uppercase text-[10px] tracking-wide mb-1">
                      Query Params ({preview.queryParams.length})
                    </p>
                    <div className="space-y-1 pl-2">
                      {preview.queryParams.map((p) => (
                        <div key={p.id} className="font-mono text-[10px] text-gray-600">
                          <span className="text-gray-800">{p.key}</span>={p.value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {preview.body && preview.body.contentType !== 'none' && (
                  <div>
                    <p className="font-medium text-gray-500 uppercase text-[10px] tracking-wide mb-1">
                      Body ({preview.body.contentType})
                    </p>
                    <pre className="font-mono text-[10px] text-gray-600 bg-gray-100 p-2 rounded max-h-24 overflow-auto">
                      {preview.body.rawValue.slice(0, 300)}{preview.body.rawValue.length > 300 ? '…' : ''}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleParse} disabled={!curlText.trim()} className="text-xs">
              Parse
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!preview || errors.length > 0}
              className="text-xs text-white"
              style={{ backgroundColor: '#0B6B5A' }}
            >
              Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
