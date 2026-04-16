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

// ─── Key-Value Pair ───────────────────────────────────────────────────────────

export interface KeyValuePairV1 {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
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
  params: KeyValuePairV1[];   // used when method === 'GET'
  bodyRaw: string;            // used when method === 'POST' (raw JSON)
  responseJson: string;       // expected response JSON pasted by user
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
    bodyRaw: '',
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
