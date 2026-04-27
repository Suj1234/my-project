// ─── HTTP Method ─────────────────────────────────────────────────────────────

export type HttpMethodV1 = 'GET' | 'POST';

// ─── Authentication ───────────────────────────────────────────────────────────

export type AuthTypeV1 = 'none' | 'bearer' | 'api_key' | 'basic';

export type ApiKeyPlacementV1 = 'header' | 'query';

export interface AuthConfigV1 {
  type: AuthTypeV1;
  // Bearer Token
  bearerToken?: string;
  // API Key
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyPlacement?: ApiKeyPlacementV1;
  // Basic Auth
  basicUsername?: string;
  basicPassword?: string;
}

// ─── Field validation type ────────────────────────────────────────────────────

export type FieldTypeV1 = 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'regex';

export const FIELD_TYPE_LABELS: Record<FieldTypeV1, string> = {
  string:  'String',
  number:  'Number',
  boolean: 'Boolean',
  email:   'Email',
  phone:   'Phone',
  date:    'Date',
  regex:   'Regex',
};

// ─── Key-Value Pair ───────────────────────────────────────────────────────────

export interface KeyValuePairV1 {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  required?: boolean;
  fieldType?: FieldTypeV1;
  description?: string;
}

// ─── Body field schema rule ───────────────────────────────────────────────────

export interface BodyFieldV1 {
  id: string;
  path: string;          // JSON dot-path, e.g. "applicant.pan" or "amount"
  required: boolean;
  fieldType: FieldTypeV1;
  pattern?: string;      // only used when fieldType === 'regex'
  description?: string;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export type IntegrationStatusV1 = 'active' | 'inactive';

// ─── Full API Integration V1 ──────────────────────────────────────────────────

export interface ApiIntegrationV1 {
  id: string;
  name: string;
  description: string;
  url: string;
  method: HttpMethodV1;
  auth: AuthConfigV1;
  headers: KeyValuePairV1[];
  params: KeyValuePairV1[];       // query params (GET)
  pathParams: KeyValuePairV1[];   // path segment {{vars}} with metadata
  bodyRaw: string;                // POST body template (may contain {{vars}})
  bodySchema: BodyFieldV1[];      // field-level validation rules for POST body
  responseJson: string;           // expected response JSON (documentation)
  status: IntegrationStatusV1;
  createdAt: string;
  updatedAt: string;
}

// ─── Default Factory ──────────────────────────────────────────────────────────

export function createDefaultIntegrationV1(): ApiIntegrationV1 {
  return {
    id: '',
    name: '',
    description: '',
    url: '',
    method: 'GET',
    auth: { type: 'none' },
    headers: [],
    params: [],
    pathParams: [],
    bodyRaw: '',
    bodySchema: [],
    responseJson: '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Auth Labels ──────────────────────────────────────────────────────────────

export const AUTH_LABEL_V1: Record<AuthTypeV1, string> = {
  none:    'No Auth',
  bearer:  'Bearer Token',
  api_key: 'API Key',
  basic:   'Basic Auth',
};
