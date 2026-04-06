// Block Types
export type BlockType = 'start' | 'smart' | 'form' | 'end' | 'router' | 'merge' | 'decision';

export type BlockCategory = 'identity' | 'financial' | 'documents' | 'profile';

export type EndBlockType = 'success' | 'rejection' | 'manual_review';

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
  | 'max_date'
  | 'boolean_match'
  | 'api'
  | 'is_in_list'
  | 'not_allowed';

export interface ValidationRule {
  id: string;
  type: ValidationType;
  value: string;
  errorMessage: string;
}

// Form Input Field
export interface FormInputField {
  id: string;
  name: string;                                              // Display label shown to applicant
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select';
  dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE';
  required: boolean;
  fieldSource?: 'native' | 'custom';                        // Source of the backend field
  key?: string;                                             // Non-editable backend key, e.g. "pan_number"
  description?: string;
  category?: string;
  alias?: string;
  min?: number;
  max?: number;
  regex?: string;
  validations?: ValidationRule[];                           // Rich validation rules
}

// Page Configuration
export interface PageConfig {
  id: string;
  name: string;
  action: string;
  userInputs: FormInputField[];
  isConfigured?: boolean;
  configurationMethod?: 'assigned' | 'ai_generated';
  assignedPageId?: string; // Used in Option 1 (Assign Existing Page)
}

// Check Configuration
export interface CheckConfig {
  id: string;
  name: string;
  enabled: boolean;
  outputResponse?: 'pass' | 'reject'; // What to do when check fails
  fields: CheckField[];
}

export interface CheckField {
  id: string;
  name: string;
  type: 'select' | 'number' | 'text' | 'toggle';
  value: any;
  options?: { label: string; value: string }[];
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
  blockTypeId?: string; // For smart blocks, references SmartBlockDefinition.id
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
  endType?: EndBlockType;
  completionMessage?: string;
  routings?: RoutingConfig[];
  defaultRoute?: string;
  dataHooks?: HookEventSlot[];
  decisionConfig?: DecisionBlockConfig;
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
  operator: 'AND' | 'OR'; // Operator between all conditions
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

export interface InputMapping {
  requestPath: string;   // e.g. "applicant.name.firstName"
  label: string;         // human-readable label
  sourceType: InputSourceType;
  sourceValue: string;   // e.g. "first_name" | "true" | "cibil_api.scoreDetails.score"
  extractPath?: string;  // extraction path before transforms
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
  path: string;          // e.g. "scoreDetails.score"
  label: string;         // e.g. "Credit Score"
  storeType: 'custom' | 'native' | 'none'; // none = reference-only (pass-through)
  storeName: string;     // e.g. "cibil_score"
  // Array extraction extras
  isArrayExtract?: boolean;
  arrayPath?: string;    // e.g. "accountDetails"
  arrayField?: string;   // e.g. "dpdSummary"
  arraySubField?: string;// e.g. "maxDPD"
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
  valueTo?: string; // used for "between"
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

// React Flow Node Data
export interface FlowNodeData extends BlockData {
  onAddBlock?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  hasIncomingConnection?: boolean;
}
