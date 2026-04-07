import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { ApiIntegration, BodyContentType, FormBodyField } from '../../../types/apiIntegration';
import { VariableInput } from '../components/VariableInput';

interface BodyTabProps {
  integration: ApiIntegration;
  onChange: (updated: ApiIntegration) => void;
}

const CONTENT_TYPES: { value: BodyContentType; label: string; description: string }[] = [
  { value: 'none',                              label: 'None',            description: 'No body (GET, HEAD, DELETE)' },
  { value: 'application/json',                  label: 'JSON',            description: 'application/json' },
  { value: 'application/x-www-form-urlencoded', label: 'URL Encoded',     description: 'application/x-www-form-urlencoded' },
  { value: 'multipart/form-data',               label: 'Form Data',       description: 'multipart/form-data (file uploads)' },
  { value: 'text/plain',                         label: 'Plain Text',      description: 'text/plain' },
  { value: 'text/xml',                           label: 'XML',             description: 'text/xml' },
  { value: 'application/xml',                   label: 'Application XML', description: 'application/xml' },
  { value: 'custom',                            label: 'Custom',          description: 'Specify your own content type' },
];

const NO_BODY_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const DEFAULT_JSON_TEMPLATE = `{
  "key": "{{journey.pan_number}}",
  "dob": "{{journey.date_of_birth}}"
}`;

function nextId(fields: FormBodyField[]) {
  return String(Math.max(0, ...fields.map((f) => Number(f.id) || 0)) + 1);
}

export function BodyTab({ integration, onChange }: BodyTabProps) {
  const { body, method } = integration;
  const noBodyMethod = NO_BODY_METHODS.includes(method);

  const setBody = (updates: Partial<typeof body>) =>
    onChange({ ...integration, body: { ...body, ...updates } });

  const updateFormField = (id: string, field: keyof FormBodyField, value: any) =>
    setBody({
      formFields: body.formFields.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    });

  const removeFormField = (id: string) =>
    setBody({ formFields: body.formFields.filter((f) => f.id !== id) });

  const addFormField = () =>
    setBody({
      formFields: [
        ...body.formFields,
        { id: nextId(body.formFields), key: '', value: '', type: 'text', enabled: true },
      ],
    });

  if (noBodyMethod) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Info size={18} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 font-medium">No Body for {method} Requests</p>
        <p className="text-xs text-gray-400 mt-1">
          {method} requests do not include a request body.<br />
          Use the <strong>Params</strong> tab for query parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Content type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Body Content Type</label>
        <div className="grid grid-cols-4 gap-1.5">
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => {
                setBody({
                  contentType: ct.value,
                  rawValue: ct.value === 'application/json' && !body.rawValue
                    ? DEFAULT_JSON_TEMPLATE
                    : body.rawValue,
                });
              }}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                body.contentType === ct.value
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className={`text-[11px] font-medium leading-tight ${body.contentType === ct.value ? 'text-teal-800' : 'text-gray-700'}`}>
                {ct.label}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{ct.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom content type text field */}
      {body.contentType === 'custom' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Custom Content-Type Value</label>
          <input
            type="text"
            value={body.customContentType ?? ''}
            onChange={(e) => setBody({ customContentType: e.target.value })}
            placeholder="e.g. application/vnd.api+json"
            className="w-full text-xs border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
          />
        </div>
      )}

      {/* Body content */}
      {body.contentType !== 'none' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Mode toggle for JSON */}
          {body.contentType === 'application/json' && (
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setBody({ inputMode: 'form_builder' })}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  body.inputMode === 'form_builder'
                    ? 'text-teal-700 bg-white border-b-2 border-teal-500 -mb-px'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Form Builder
              </button>
              <button
                onClick={() => setBody({ inputMode: 'raw' })}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  body.inputMode === 'raw'
                    ? 'text-teal-700 bg-white border-b-2 border-teal-500 -mb-px'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Raw JSON
              </button>
            </div>
          )}

          <div className="p-4">
            {/* Raw editor (JSON raw, XML, Text, Custom) */}
            {(body.contentType !== 'application/json' ||
              body.inputMode === 'raw' ||
              body.contentType === 'text/plain' ||
              body.contentType === 'text/xml' ||
              body.contentType === 'application/xml' ||
              body.contentType === 'custom') && (
              <VariableInput
                value={body.rawValue}
                onChange={(v) => setBody({ rawValue: v })}
                multiline
                rows={10}
                placeholder={
                  body.contentType === 'application/json'
                    ? '{\n  "key": "{{journey.value}}"\n}'
                    : body.contentType.includes('xml')
                    ? '<request>\n  <pan>{{journey.pan_number}}</pan>\n</request>'
                    : 'Body content...'
                }
              />
            )}

            {/* Form builder (for JSON form_builder mode, url-encoded, multipart) */}
            {(body.inputMode === 'form_builder' || body.contentType === 'application/x-www-form-urlencoded' || body.contentType === 'multipart/form-data') &&
              body.contentType !== 'text/plain' && body.contentType !== 'text/xml' && body.contentType !== 'application/xml' && body.contentType !== 'custom' && (
              <div className="space-y-2">
                {/* Column headers */}
                {body.formFields.length > 0 && (
                  <div className={`grid gap-x-2 mb-1 ${body.contentType === 'multipart/form-data' ? 'grid-cols-[1fr_80px_1fr_28px]' : 'grid-cols-[1fr_1fr_28px]'}`}>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Key</p>
                    {body.contentType === 'multipart/form-data' && (
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Type</p>
                    )}
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-1">Value</p>
                    <div />
                  </div>
                )}

                {body.formFields.map((field) => (
                  <div
                    key={field.id}
                    className={`grid gap-x-2 items-start ${body.contentType === 'multipart/form-data' ? 'grid-cols-[1fr_80px_1fr_28px]' : 'grid-cols-[1fr_1fr_28px]'}`}
                  >
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateFormField(field.id, 'key', e.target.value)}
                      placeholder="Field name"
                      className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono placeholder:text-gray-300"
                    />
                    {body.contentType === 'multipart/form-data' && (
                      <select
                        value={field.type}
                        onChange={(e) => updateFormField(field.id, 'type', e.target.value)}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        <option value="text">Text</option>
                        <option value="file">File</option>
                      </select>
                    )}
                    {field.type === 'file' ? (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateFormField(field.id, 'value', e.target.value)}
                        placeholder="{{journey.file_variable}}"
                        className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono placeholder:text-gray-300"
                      />
                    ) : (
                      <VariableInput
                        value={field.value}
                        onChange={(v) => updateFormField(field.id, 'value', v)}
                        placeholder="Value"
                        className="!text-xs !py-1.5 !px-2.5"
                      />
                    )}
                    <button
                      onClick={() => removeFormField(field.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 mt-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addFormField}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-600 mt-1 py-1 px-1 rounded hover:bg-teal-50 transition-colors"
                >
                  <Plus size={12} />
                  Add Field
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body size hint */}
      {body.contentType !== 'none' && body.rawValue && (
        <p className="text-[10px] text-gray-400">
          Body size: ~{new Blob([body.rawValue]).size} bytes
        </p>
      )}
    </div>
  );
}
