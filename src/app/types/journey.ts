// Block Types
export type BlockType = 'start' | 'smart' | 'form' | 'end' | 'router' | 'merge';

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

// React Flow Node Data
export interface FlowNodeData extends BlockData {
  onAddBlock?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  hasIncomingConnection?: boolean;
}
