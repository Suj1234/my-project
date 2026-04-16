// Block Types
export type BlockType = 'start' | 'smart' | 'form' | 'end' | 'router' | 'merge' | 'decision';

export type BlockCategory = 'identity' | 'financial' | 'documents' | 'profile' | 'fulfilment' | 'decision' | 'data_collection';

export type EndBlockType = 'success' | 'rejection' | 'manual_review';

export type EntrySource = 'web' | 'mobile_sdk' | 'branch' | 'api';
export type AuthMethod = 'otp' | 'password' | 'biometric' | 'none';
export type PrefillSource = 'none' | 'crm_api' | 'custom_api';
export type CTAAction = 'url' | 'deep_link' | 'none';

// ─── Shared helpers ───────────────────────────────────────────────────────────

export interface PassthroughParam {
  id: string;
  key: string;
  value: string;
}

export interface CommTrigger {
  enabled: boolean;
  templateId?: string;
  templateName?: string;
}

export interface WebhookTrigger {
  enabled: boolean;
  url?: string;
  eventType?: string;
}

// ─── Journey-level Settings ───────────────────────────────────────────────────

export interface PageSlot {
  pageId: string | null;
  pageName: string | null;
  configurationMethod?: 'assigned' | 'ai_generated';
  isConfigured?: boolean;
}

export interface JourneySettings {
  loginPage: PageSlot;
  resumePage: PageSlot;
  errorPage: PageSlot;
  maintenancePage: PageSlot;
  mockedPage: PageSlot;
  appConfigId: string | null;
}

export const DEFAULT_JOURNEY_SETTINGS: JourneySettings = {
  loginPage: { pageId: null, pageName: null, isConfigured: false },
  resumePage: { pageId: null, pageName: null, isConfigured: false },
  errorPage: { pageId: null, pageName: null, isConfigured: false },
  maintenancePage: { pageId: null, pageName: null, isConfigured: false },
  mockedPage: { pageId: null, pageName: null, isConfigured: false },
  appConfigId: null,
};

// Mock data (in production, fetched from backend)
export const MOCK_AVAILABLE_PAGES = [
  { id: 'page-login-01', name: 'loginPage' },
  { id: 'page-resume-01', name: 'resumePage' },
  { id: 'page-error-01', name: 'errorPage' },
  { id: 'page-maintenance-01', name: 'maintenancePage' },
  { id: 'page-mock-01', name: 'digiLockerMockPage' },
  { id: 'page-welcome-01', name: 'welcomePage' },
  { id: 'page-consent-01', name: 'kycConsentPage' },
  { id: 'page-success-01', name: 'congratsPage' },
  { id: 'page-rejection-01', name: 'rejectionPage' },
  { id: 'page-review-01', name: 'manualReviewPage' },
];

export const MOCK_APP_CONFIGS = [
  { id: 'cfg-01', name: 'appConfig' },
  { id: 'cfg-02', name: 'appConfig_v2' },
  { id: 'cfg-03', name: 'prodConfig' },
];

// Smart Block Definitions
export interface SmartBlockDefinition {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  icon: string;
  provider?: string;
  hasChecks: boolean;
  hasRetry: boolean;
  pages: PageConfig[];
  checks?: CheckConfig[];
  generalConfig?: GeneralConfigField[];
  retryConfig?: RetryConfigItem[];
}

// Validation Rule for a FormInputField
export type ValidationType =
  | 'regex'
  | 'min_length'
  | 'max_length'
  | 'min_date'
  | 'max_date';

export interface ValidationRule {
  id: string;
  type: ValidationType;
  value: string;
}

// Form Input Field
export interface FormInputField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select';
  dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  required: boolean;
  fieldSource?: 'native' | 'custom';
  key?: string;
  description?: string;
  category?: string;
  alias?: string;
  min?: number;
  max?: number;
  regex?: string;
  validations?: ValidationRule[];
}

// Page Configuration
export interface PageConfig {
  id: string;
  name: string;
  action: string;
  userInputs: FormInputField[];
  isConfigured?: boolean;
  configurationMethod?: 'assigned' | 'ai_generated';
  assignedPageId?: string;
}

// Check Configuration
export interface CheckConfig {
  id: string;
  name: string;
  enabled: boolean;
  outputResponse?: 'pass' | 'reject';
  fields: CheckField[];
}

export interface MasterColumnOption {
  label: string;
  value: string;
  isPrimaryKey: boolean;
  dataType: string;
}

export interface CheckField {
  id: string;
  name: string;
  type: 'select' | 'number' | 'text' | 'toggle' | 'dependent-select';
  value: any;
  options?: { label: string; value: string }[];
  dependsOn?: string;
  masterColumns?: Record<string, MasterColumnOption[]>;
}

export interface GeneralConfigField {
  id: string;
  name: string;
  type: 'select' | 'number' | 'text' | 'date';
  value: any;
  options?: { label: string; value: string }[];
}

// Block Data
export interface BlockData {
  id: string;
  type: BlockType;
  blockTypeId?: string;
  hasRetry?: boolean;
  category?: BlockCategory;
  name: string;
  description: string;
  configured: boolean;
  provider?: string;
  formFields?: FormInputField[];
  checks?: CheckConfig[];
  generalConfig?: GeneralConfigField[];
  retryConfig?: RetryConfig | RetryConfigItem[];
  pages?: PageConfig[];

  // ─── End Block fields ───────────────────────────────────────────────────────
  endType?: EndBlockType;
  completionMessage?: string;
  messageTitle?: string;
  messageBody?: string;
  ctaLabel?: string;
  ctaAction?: CTAAction;
  ctaUrl?: string;
  emailTrigger?: CommTrigger;
  smsTrigger?: CommTrigger;
  webhookTrigger?: WebhookTrigger;
  autoRedirectEnabled?: boolean;
  autoRedirectSeconds?: number;
  redirectUrl?: string;

  // ─── Start Block fields ──────────────────────────────────────────────────────
  entrySource?: EntrySource;
  authRequired?: boolean;
  authMethod?: AuthMethod;
  collectConsent?: boolean;
  consentScope?: string;
  prefillSource?: PrefillSource;
  passthroughParams?: PassthroughParam[];
  startWebhookEnabled?: boolean;
  startWebhookUrl?: string;

  // ─── Form Block fields ──────────────────────────────────────────────────────
  journeyState?: string;

  // ─── Router/Logic fields ────────────────────────────────────────────────────
  routings?: RoutingConfig[];
  defaultRoute?: string;

  // ─── Data hooks ─────────────────────────────────────────────────────────────
  dataHooks?: HookEventSlot[];
  decisionConfig?: DecisionBlockConfig;
  abPages?: PageConfig[];
}

export interface RetryConfig {
  maxAttempts: number;
  coolingPeriod: number;
  velocityCycle: number;
}

export interface RetryConfigItem {
  id: string;
  name: string;
  maxAttempts: number;
  coolingPeriod: number;
  velocityCycle: number;
}

// Routing Configuration for Conditional Router
export interface RoutingConfig {
  id: string;
  conditions: Condition[];
  operator: 'AND' | 'OR';
  targetBlockId: string;
  saved?: boolean;
}

export interface Condition {
  id: string;
  parameter: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not contains' | 'is empty' | 'is not empty';
  value: string;
}

// ─── Data Hooks ──────────────────────────────────────────────────────────────

export type HookTrigger =
  | 'before_block_start'
  | 'after_block_start'
  | 'before_user_submit'
  | 'after_user_submit'
  | 'after_block_complete';

export type InputSourceType = 'native' | 'custom' | 'static' | 'system' | 'api_output';

export type TransformationType =
  | 'trim'
  | 'uppercase'
  | 'lowercase'
  | 'replace'
  | 'regex_extract'
  | 'to_number'
  | 'round'
  | 'default_if_empty'
  | 'timezone_convert'
  | 'date_format'
  | 'join'
  | 'unique';

export interface TransformationStep {
  id: string;
  type: TransformationType;
  config?: Record<string, string>;
}

export type ExtractionType =
  | 'none'
  | 'json_path'
  | 'array_index'
  | 'array_first'
  | 'array_last'
  | 'array_aggregate'
  | 'array_filter_aggregate'
  | 'regex_extract'
  | 'string_split'
  | 'date_component';

export interface ExtractionConfig {
  type: ExtractionType;
  path?: string;
  index?: number;
  fieldPath?: string;
  aggregate?: AggregationType;
  filterField?: string;
  filterValue?: string;
  pattern?: string;
  groupIndex?: number;
  delimiter?: string;
  splitIndex?: number;
  dateComponent?: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
}

export interface InputMapping {
  requestPath: string;
  label: string;
  sourceType: InputSourceType;
  sourceValue: string;
  extraction?: ExtractionConfig;
  transforms?: TransformationStep[];
  isAutoMapped: boolean;
}

export type AggregationType =
  | 'max'
  | 'min'
  | 'sum'
  | 'count'
  | 'first'
  | 'last'
  | 'all'
  | 'unique'
  | 'join'
  | 'latest_by_field';

export interface OutputCapture {
  id: string;
  path: string;
  label: string;
  storeType: 'custom' | 'native' | 'none';
  storeName: string;
  isArrayExtract?: boolean;
  arrayPath?: string;
  arrayField?: string;
  arraySubField?: string;
  aggregation?: AggregationType;
  filterField?: string;
  filterValue?: string;
  latestByField?: string;
  joinDelimiter?: string;
  transforms?: TransformationStep[];
}

export interface DataHookApiBinding {
  id: string;
  apiId: string;
  apiName: string;
  trigger?: HookTrigger;
  latencyP95Ms?: number;
  inputMappings: InputMapping[];
  outputCaptures: OutputCapture[];
}

export interface HookEventSlot {
  id: string;
  eventKey: string;
  eventLabel: string;
  apis: DataHookApiBinding[];
  decisionConfig?: DecisionBlockConfig;
}

// ─── Decision Block ───────────────────────────────────────────────────────────

export type DecisionVerdict = 'PASS' | 'REJECT' | 'FLAG' | 'MANUAL_REVIEW';

export interface DecisionCondition {
  id: string;
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between' | 'contains' | 'is empty' | 'is not empty';
  value: string;
  valueTo?: string;
}

export interface DecisionRule {
  id: string;
  conditions: DecisionCondition[];
  conditionOperator: 'AND' | 'OR';
  verdict: DecisionVerdict;
  targetBlockId?: string;
}

export interface DecisionBlockConfig {
  rules: DecisionRule[];
  defaultVerdict: DecisionVerdict;
}

// ─── React Flow Node Data ─────────────────────────────────────────────────────

export interface FlowNodeData extends BlockData {
  onAddBlock?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  hasIncomingConnection?: boolean;
}
