// Block Types
export type BlockType = 'start' | 'smart' | 'form' | 'end' | 'router';

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
}

// Form Input Field
export interface FormInputField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select';
  dataType?: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE'; // For UI configuration display
  required: boolean;
  min?: number;
  max?: number;
  regex?: string;
}

// Page Configuration
export interface PageConfig {
  id: string;
  name: string;
  action: string;
  userInputs: FormInputField[];
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
  category?: BlockCategory;
  name: string;
  description: string;
  configured: boolean;
  provider?: string;
  formFields?: FormInputField[];
  checks?: CheckConfig[];
  generalConfig?: GeneralConfigField[];
  retryConfig?: RetryConfig;
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

// Routing Configuration for Conditional Router
export interface RoutingConfig {
  id: string;
  conditionGroups: ConditionGroup[];
  groupOperator: 'AND' | 'OR'; // Operator between groups
  targetBlockId: string;
}

export interface ConditionGroup {
  id: string;
  conditions: Condition[];
  operator: 'AND' | 'OR'; // Operator within group
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
}