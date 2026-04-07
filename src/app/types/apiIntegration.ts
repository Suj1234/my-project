// ─── HTTP Method ─────────────────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// ─── Authentication ───────────────────────────────────────────────────────────

export type AuthType =
  | 'none'
  | 'api_key'
  | 'basic'
  | 'bearer'
  | 'oauth2'
  | 'aws_sig4'
  | 'digest'
  | 'custom_header';

export type OAuth2GrantType =
  | 'client_credentials'
  | 'authorization_code'
  | 'authorization_code_pkce'
  | 'password'
  | 'implicit';

export type ApiKeyPlacement = 'header' | 'query';

export interface AuthConfig {
  type: AuthType;
  // API Key
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyPlacement?: ApiKeyPlacement;
  // Basic Auth
  basicUsername?: string;
  basicPassword?: string;
  // Bearer Token
  bearerToken?: string;
  // OAuth 2.0
  oauth2GrantType?: OAuth2GrantType;
  oauth2TokenUrl?: string;
  oauth2AuthUrl?: string;
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2Scope?: string;
  oauth2TokenPlacement?: 'header' | 'body';
  // AWS Signature v4
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsRegion?: string;
  awsService?: string;
  awsSessionToken?: string;
  // Digest Auth
  digestUsername?: string;
  digestPassword?: string;
  // Custom Header
  customHeaderName?: string;
  customHeaderValue?: string;
  // Reference to saved credential
  credentialId?: string;
}

// ─── Headers & Params ─────────────────────────────────────────────────────────

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

// ─── Body ─────────────────────────────────────────────────────────────────────

export type BodyContentType =
  | 'none'
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'text/plain'
  | 'text/xml'
  | 'application/xml'
  | 'text/html'
  | 'custom';

export type BodyInputMode = 'form_builder' | 'raw';

export interface FormBodyField {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

export interface BodyConfig {
  contentType: BodyContentType;
  customContentType?: string;
  inputMode: BodyInputMode;
  rawValue: string;            // Used for raw/json string mode
  formFields: FormBodyField[]; // Used for form builder mode
}

// ─── Response ────────────────────────────────────────────────────────────────

export type ResponseFormat = 'auto' | 'json' | 'xml' | 'text' | 'binary';

export type PaginationType = 'none' | 'offset' | 'page' | 'cursor' | 'link';

export interface ResponseMapping {
  id: string;
  responsePath: string;   // e.g. $.data.creditScore
  variableName: string;   // e.g. journey.creditScore
  label: string;
}

export type StatusAction = 'continue' | 'retry' | 'fail' | 'continue_with_error';

export interface StatusRouting {
  statusRange: '2xx' | '3xx' | '4xx' | '5xx' | 'timeout' | 'network_error';
  action: StatusAction;
}

export interface PaginationConfig {
  type: PaginationType;
  itemsPath?: string;
  // Offset-based
  offsetParamName?: string;
  initialOffset?: number;
  // Page-based
  pageParamName?: string;
  initialPage?: number;
  // Cursor/token-based
  cursorParamName?: string;
  cursorResponsePath?: string;
  // Link-based
  linkResponsePath?: string;
  // Common
  pageSizeParamName?: string;
  pageSize?: number;
  maxItems?: number;
  outputFormat?: 'array_items' | 'array_pages';
}

export interface ResponseConfig {
  parseResponse: boolean;
  format: ResponseFormat;
  mappings: ResponseMapping[];
  statusRouting: StatusRouting[];
  pagination: PaginationConfig;
}

// ─── Advanced ────────────────────────────────────────────────────────────────

export type TlsMode = 'standard' | 'tls' | 'mutual_tls';
export type ExecutionMode = 'sync' | 'async_fire_forget' | 'async_callback' | 'polling';
export type RedirectMode = 'follow' | 'manual' | 'error';

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  delaySeconds: number;
  retryOn: {
    status5xx: boolean;
    status4xx: boolean;
    timeout: boolean;
    networkError: boolean;
  };
}

export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface TlsConfig {
  mode: TlsMode;
  verifySsl: boolean;
  caCertificate?: string;
  clientCertificate?: string;
  clientKey?: string;
}

export interface AdvancedConfig {
  executionMode: ExecutionMode;
  callbackUrl?: string;
  pollingInterval?: number;
  pollingMaxAttempts?: number;
  pollingSuccessPath?: string;
  pollingSuccessValue?: string;
  timeoutSeconds: number;
  retry: RetryConfig;
  followRedirects: RedirectMode;
  maxRedirects: number;
  shareCookies: boolean;
  requestCompressed: boolean;
  proxy: ProxyConfig;
  tls: TlsConfig;
}

// ─── Credential Store ─────────────────────────────────────────────────────────

export type CredentialType = 'api_key' | 'basic' | 'bearer' | 'oauth2' | 'custom';

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  environment: 'all' | 'development' | 'staging' | 'production';
  // Stored values (masked in UI after save)
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  usedBy?: string[]; // integration IDs that reference this credential
}

// ─── Full API Integration ─────────────────────────────────────────────────────

export type IntegrationStatus = 'draft' | 'active' | 'inactive';

export interface ApiIntegration {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  method: HttpMethod;
  url: string;
  auth: AuthConfig;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: BodyConfig;
  response: ResponseConfig;
  advanced: AdvancedConfig;
  status: IntegrationStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export function createDefaultIntegration(): ApiIntegration {
  return {
    id: '',
    name: '',
    description: '',
    tags: [],
    method: 'GET',
    url: '',
    auth: { type: 'none' },
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    queryParams: [],
    body: {
      contentType: 'none',
      inputMode: 'form_builder',
      rawValue: '',
      formFields: [],
    },
    response: {
      parseResponse: true,
      format: 'auto',
      mappings: [],
      statusRouting: [
        { statusRange: '2xx', action: 'continue' },
        { statusRange: '4xx', action: 'fail' },
        { statusRange: '5xx', action: 'retry' },
        { statusRange: 'timeout', action: 'retry' },
        { statusRange: 'network_error', action: 'fail' },
      ],
      pagination: { type: 'none' },
    },
    advanced: {
      executionMode: 'sync',
      timeoutSeconds: 30,
      retry: {
        enabled: true,
        maxAttempts: 3,
        delaySeconds: 5,
        retryOn: { status5xx: true, status4xx: false, timeout: true, networkError: true },
      },
      followRedirects: 'follow',
      maxRedirects: 10,
      shareCookies: false,
      requestCompressed: false,
      proxy: { enabled: false, host: '', port: 8080 },
      tls: { mode: 'standard', verifySsl: true },
    },
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultCredential(): Credential {
  return {
    id: '',
    name: '',
    type: 'api_key',
    environment: 'all',
    values: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Variable Namespaces ──────────────────────────────────────────────────────

export interface VariableSuggestion {
  namespace: string;
  path: string;         // full path e.g. journey.pan_number
  label: string;        // display name
  description?: string;
  example?: string;
}

export const VARIABLE_SUGGESTIONS: VariableSuggestion[] = [
  // Journey namespace
  { namespace: 'journey', path: 'journey.pan_number',    label: 'PAN Number',       description: 'Applicant PAN',        example: 'ABCDE1234F' },
  { namespace: 'journey', path: 'journey.mobile',        label: 'Mobile Number',    description: 'Applicant mobile',     example: '9999999999' },
  { namespace: 'journey', path: 'journey.date_of_birth', label: 'Date of Birth',    description: 'Applicant DOB',        example: '1990-01-01' },
  { namespace: 'journey', path: 'journey.email',         label: 'Email',            description: 'Applicant email',      example: 'user@email.com' },
  { namespace: 'journey', path: 'journey.full_name',     label: 'Full Name',        description: 'Applicant full name',  example: 'Rajesh Kumar' },
  { namespace: 'journey', path: 'journey.pincode',       label: 'Pincode',          description: 'Applicant pincode',    example: '400001' },
  { namespace: 'journey', path: 'journey.loan_amount',   label: 'Loan Amount',      description: 'Requested loan amt',   example: '500000' },
  // Session namespace
  { namespace: 'session', path: 'session.userId',           label: 'User ID',          description: 'Current user ID' },
  { namespace: 'session', path: 'session.applicationId',    label: 'Application ID',   description: 'Loan application ID' },
  { namespace: 'session', path: 'session.journeyId',        label: 'Journey ID',       description: 'Current journey ID' },
  // System namespace
  { namespace: 'system', path: 'system.timestamp',      label: 'Timestamp',        description: 'Current Unix timestamp' },
  { namespace: 'system', path: 'system.uuid',           label: 'UUID',             description: 'Random UUID v4',         example: 'a1b2c3d4-...' },
  { namespace: 'system', path: 'system.date',           label: 'Date',             description: 'Today (YYYY-MM-DD)',     example: '2026-04-07' },
  { namespace: 'system', path: 'system.env',            label: 'Environment',      description: 'dev / staging / prod' },
  // Credentials namespace
  { namespace: 'credentials', path: 'credentials.api_key',      label: 'API Key',          description: 'From credential store' },
  { namespace: 'credentials', path: 'credentials.bearer_token', label: 'Bearer Token',     description: 'From credential store' },
  // Env namespace
  { namespace: 'env', path: 'env.base_url',      label: 'Base URL',       description: 'Environment base URL' },
  { namespace: 'env', path: 'env.timeout',       label: 'Timeout',        description: 'Environment timeout' },
];
